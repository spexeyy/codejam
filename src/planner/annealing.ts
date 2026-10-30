import { blocks } from "../domain/grid.ts";
import { RELOAD, type Stop } from "../domain/types.ts";
import {
  at,
  legsOf,
  type Evaluator,
  type Leg,
  type Solution,
} from "./evaluation.ts";
import { pick, seeded, type Random } from "../domain/random.ts";

export type Progress = { iteration: number; current: number; best: number };

export type AnnealingOptions = {
  seed: number;
  iterations: number;
  restarts: number;
};

export type Annealed = {
  solution: Solution;
  cost: number;
  history: Progress[];
};

type Change = { routes: Map<number, Stop[]>; pool?: number[] };

const HISTORY_POINTS = 120;

// Los movimientos son cambios chicos. Cada uno devuelve solo las rutas que toca, así evaluarlo
// cuesta lo que miden esas rutas y no el plan entero.
function relocate(solution: Solution, random: Random): Change | undefined {
  const fromPool = solution.pool.length > 0 && random() < 0.1;
  const routes = new Map<number, Stop[]>();
  let pool = solution.pool;
  let moved: Stop;
  if (fromPool) {
    const index = pick(random, solution.pool.length);
    moved = at(solution.pool, index);
    pool = solution.pool.toSpliced(index, 1);
  } else {
    const from = pick(random, solution.routes.length);
    const stops = at(solution.routes, from);
    if (stops.length === 0) return undefined;
    const index = pick(random, stops.length);
    moved = at(stops, index);
    routes.set(from, stops.toSpliced(index, 1));
    if (typeof moved === "number" && random() < 0.03)
      return { routes, pool: [...pool, moved] };
  }
  const to = pick(random, solution.routes.length);
  const target = routes.get(to) ?? at(solution.routes, to);
  routes.set(to, target.toSpliced(pick(random, target.length + 1), 0, moved));
  return { routes, pool };
}

function swap(solution: Solution, random: Random): Change | undefined {
  const a = pick(random, solution.routes.length);
  const b = pick(random, solution.routes.length);
  const first = at(solution.routes, a);
  const second = at(solution.routes, b);
  if (first.length === 0 || second.length === 0) return undefined;
  const i = pick(random, first.length);
  const j = pick(random, second.length);
  if (a === b)
    return {
      routes: new Map([[a, first.with(i, at(first, j)).with(j, at(first, i))]]),
    };
  return {
    routes: new Map([
      [a, first.with(i, at(second, j))],
      [b, second.with(j, at(first, i))],
    ]),
  };
}

function reverse(solution: Solution, random: Random): Change | undefined {
  const index = pick(random, solution.routes.length);
  const stops = at(solution.routes, index);
  if (stops.length < 3) return undefined;
  let i = pick(random, stops.length);
  let j = pick(random, stops.length);
  if (i > j) [i, j] = [j, i];
  if (j - i < 1) return undefined;
  const reversed = [
    ...stops.slice(0, i),
    ...stops.slice(i, j + 1).reverse(),
    ...stops.slice(j + 1),
  ];
  return { routes: new Map([[index, reversed]]) };
}

function moveSegment(solution: Solution, random: Random): Change | undefined {
  const from = pick(random, solution.routes.length);
  const stops = at(solution.routes, from);
  const length = 2 + pick(random, 2);
  if (stops.length < length) return undefined;
  const start = pick(random, stops.length - length + 1);
  const segment = stops.slice(start, start + length);
  if (random() < 0.5) segment.reverse();
  const rest = stops.toSpliced(start, length);
  const to = pick(random, solution.routes.length);
  const target = to === from ? rest : at(solution.routes, to);
  const placed = target.toSpliced(
    pick(random, target.length + 1),
    0,
    ...segment,
  );
  return to === from
    ? { routes: new Map([[from, placed]]) }
    : {
        routes: new Map([
          [from, rest],
          [to, placed],
        ]),
      };
}

// 2-opt*: dos vehículos intercambian el final de sus recorridos. Es el movimiento que equilibra
// rutas, que es lo que baja el makespan.
function crossTails(solution: Solution, random: Random): Change | undefined {
  const a = pick(random, solution.routes.length);
  const b = pick(random, solution.routes.length);
  if (a === b) return undefined;
  const first = at(solution.routes, a);
  const second = at(solution.routes, b);
  const i = pick(random, first.length + 1);
  const j = pick(random, second.length + 1);
  return {
    routes: new Map([
      [a, [...first.slice(0, i), ...second.slice(j)]],
      [b, [...second.slice(0, j), ...first.slice(i)]],
    ]),
  };
}

function shuffled<T>(list: readonly T[], random: Random): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = pick(random, i + 1);
    [copy[i], copy[j]] = [at(copy, j), at(copy, i)];
  }
  return copy;
}

// Ruina y recreación (la idea de SISR, Christiaens y Vanden Berghe, 2020): sacamos todos los
// pedidos de un vehículo o un grupo de pedidos vecinos, y los volvemos a meter de a uno donde
// menos sube el costo. Es el único movimiento que puede cerrar un vehículo de una vez; con los
// otros habría que vaciarlo pedido por pedido, cuesta arriba.
function ruinAndRecreate(
  solution: Solution,
  random: Random,
  evaluator: Evaluator,
): Change | undefined {
  const delivered = solution.routes.flat().filter((stop) => stop !== RELOAD);
  if (delivered.length === 0) return undefined;
  let removed: number[];
  if (random() < 0.3) {
    const used = solution.routes.flatMap((stops, index) =>
      stops.some((stop) => stop !== RELOAD) ? [index] : [],
    );
    removed = at(solution.routes, at(used, pick(random, used.length))).filter(
      (stop) => stop !== RELOAD,
    );
  } else {
    const center = evaluator.orders.get(
      at(delivered, pick(random, delivered.length)),
    );
    if (!center) return undefined;
    const near = (id: number) => {
      const order = evaluator.orders.get(id);
      return order ? blocks(order.position, center.position) : Infinity;
    };
    removed = [...delivered]
      .sort((a, b) => near(a) - near(b) || a - b)
      .slice(0, 2 + pick(random, 7));
  }
  const gone = new Set(removed);
  const routes = solution.routes.map((stops) =>
    stops.filter((stop) => stop === RELOAD || !gone.has(stop)),
  );
  let legs = routes.map((stops, index) => evaluator.leg(index, stops));
  for (const id of shuffled(removed, random)) {
    let best:
      { vehicle: number; stops: Stop[]; legs: Leg[]; cost: number } | undefined;
    routes.forEach((current, vehicle) => {
      for (let position = 0; position <= current.length; position++) {
        const stops = current.toSpliced(position, 0, id);
        const next = legs.with(vehicle, evaluator.leg(vehicle, stops));
        const cost = evaluator.total(next, solution.pool.length);
        if (!best || cost < best.cost)
          best = { vehicle, stops, legs: next, cost };
      }
    });
    if (!best) return undefined;
    routes[best.vehicle] = best.stops;
    legs = best.legs;
  }
  return { routes: new Map(routes.map((stops, index) => [index, stops])) };
}

type Move = (
  solution: Solution,
  random: Random,
  evaluator: Evaluator,
) => Change | undefined;

const moves: [number, Move][] = [
  [0.3, relocate],
  [0.2, swap],
  [0.249, reverse],
  [0.15, moveSegment],
  [0.1, crossTails],
  [0.001, ruinAndRecreate],
];

function propose(
  solution: Solution,
  random: Random,
  evaluator: Evaluator,
): Change | undefined {
  let roll = random();
  for (const [weight, move] of moves) {
    if (roll < weight) return move(solution, random, evaluator);
    roll -= weight;
  }
  return undefined;
}

function apply(solution: Solution, change: Change): Solution {
  return {
    routes: solution.routes.map(
      (stops, index) => change.routes.get(index) ?? stops,
    ),
    pool: change.pool ?? solution.pool,
  };
}

function costAfter(
  evaluator: Evaluator,
  legs: readonly Leg[],
  change: Change,
  pool: number,
): { legs: Leg[]; cost: number } {
  const next = legs.map((leg, index) => {
    const stops = change.routes.get(index);
    return stops ? evaluator.leg(index, stops) : leg;
  });
  return {
    legs: next,
    cost: evaluator.total(next, change.pool?.length ?? pool),
  };
}

// Lo medimos en la práctica de 40 pedidos (docs/benchmarks.md): con temperatura inicial del
// 0,5 % del costo y enfriando 200 veces, las cuatro semillas llegan a 913. Con 2 % o más la
// búsqueda se dispersa y termina en 941, el mismo costo de la inserción.
const HOT_SHARE = 0.005;
const COOLING = 200;

function run(
  evaluator: Evaluator,
  start: Solution,
  iterations: number,
  random: Random,
): Annealed {
  let solution = start;
  let legs = legsOf(evaluator, solution);
  let cost = evaluator.total(legs, solution.pool.length);
  let best = { solution, cost };
  const history: Progress[] = [];
  const every = Math.max(1, Math.floor(iterations / HISTORY_POINTS));
  const hot = Math.max(cost * HOT_SHARE, 1e-6);
  const cold = hot / COOLING;
  for (let iteration = 0; iteration < iterations; iteration++) {
    if (iteration % every === 0)
      history.push({ iteration, current: cost, best: best.cost });
    const change = propose(solution, random, evaluator);
    if (!change) continue;
    const next = costAfter(evaluator, legs, change, solution.pool.length);
    const delta = next.cost - cost;
    const temperature = hot * Math.pow(cold / hot, iteration / iterations);
    if (delta <= 0 || random() < Math.exp(-delta / temperature)) {
      solution = apply(solution, change);
      legs = next.legs;
      cost = next.cost;
      if (cost < best.cost - 1e-9) best = { solution, cost };
    }
  }
  history.push({ iteration: iterations, current: cost, best: best.cost });
  return { solution: best.solution, cost: best.cost, history };
}

// Arrancamos corridas desde la inserción de cada tamaño de flota y nos quedamos con la más
// barata. Desde un solo arranque la búsqueda casi nunca cierra ni abre un vehículo: tendría
// que mover todos sus pedidos de a uno, cuesta arriba. En el benchmark eso nos dejaba hasta
// 4,9 % por encima de la mejor solución conocida.
export function anneal(
  evaluator: Evaluator,
  starts: readonly Solution[],
  options: AnnealingOptions,
): Annealed {
  const runs = starts.flatMap((start, index) =>
    Array.from({ length: options.restarts }, (_, restart) =>
      run(
        evaluator,
        start,
        options.iterations,
        seeded(options.seed + index * 7919 + restart * 104729),
      ),
    ),
  );
  return runs.reduce((winner, current) =>
    current.cost < winner.cost ? current : winner,
  );
}
