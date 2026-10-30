import { blocks } from "../domain/grid.ts";
import type { Order, Stop } from "../domain/types.ts";
import {
  at,
  legsOf,
  solutionCost,
  type Evaluator,
  type Leg,
  type Solution,
} from "./evaluation.ts";

export type FleetSize = { vehicles: number; cost: number };

// Barrido angular: ordenamos los pedidos por ángulo alrededor del depósito y los repartimos en k
// sectores. El pedido más lejano de cada sector abre la ruta de un vehículo, así las rutas
// arrancan apuntando a zonas distintas de la ciudad.
function seeds(evaluator: Evaluator, fleet: number): Order[] {
  const { depot } = evaluator.scenario.world;
  const angle = (order: Order) =>
    Math.atan2(order.position.y - depot.y, order.position.x - depot.x);
  const sorted = [...evaluator.scenario.orders].sort(
    (a, b) => angle(a) - angle(b) || a.id - b.id,
  );
  return Array.from({ length: fleet }, (_, sector) => {
    const slice = sorted.slice(
      Math.floor((sector * sorted.length) / fleet),
      Math.floor(((sector + 1) * sorted.length) / fleet),
    );
    return slice.reduce((far, order) =>
      blocks(depot, order.position) > blocks(depot, far.position) ? order : far,
    );
  });
}

const replaced = (legs: readonly Leg[], index: number, leg: Leg) =>
  legs.map((old, i) => (i === index ? leg : old));

// Cada pedido va a la posición que menos sube el costo total, no solo la distancia: así la
// inserción ya tiene en cuenta el makespan y el costo de usar otro vehículo.
export function cheapestInsertion(
  evaluator: Evaluator,
  fleet: number,
): Solution {
  const { scenario } = evaluator;
  const { depot } = scenario.world;
  const routes: Stop[][] = scenario.vehicles.map(() => []);
  const opening = seeds(evaluator, Math.min(fleet, scenario.orders.length));
  opening.forEach((order, index) => at(routes, index).push(order.id));
  const opened = new Set(opening.map((order) => order.id));
  const pending = scenario.orders
    .filter((order) => !opened.has(order.id))
    .sort(
      (a, b) =>
        blocks(depot, b.position) - blocks(depot, a.position) || a.id - b.id,
    );

  let legs = legsOf(evaluator, { routes, pool: [] });
  for (const order of pending) {
    let best:
      { vehicle: number; stops: Stop[]; leg: Leg; cost: number } | undefined;
    for (let vehicle = 0; vehicle < Math.min(fleet, routes.length); vehicle++) {
      const current = at(routes, vehicle);
      for (let position = 0; position <= current.length; position++) {
        const stops = current.toSpliced(position, 0, order.id);
        const leg = evaluator.leg(vehicle, stops);
        const cost = evaluator.total(replaced(legs, vehicle, leg), 0);
        if (!best || cost < best.cost) best = { vehicle, stops, leg, cost };
      }
    }
    if (!best) throw new Error("no hay vehículos para insertar pedidos");
    routes[best.vehicle] = best.stops;
    legs = replaced(legs, best.vehicle, best.leg);
  }
  return dropUnprofitable(evaluator, { routes, pool: [] });
}

// Si sacar un pedido ahorra más que la multa por no entregarlo, no lo entregamos. Con los costos
// de la práctica no pasa nunca, pero los costos vienen en cada dataset.
export function dropUnprofitable(
  evaluator: Evaluator,
  start: Solution,
): Solution {
  let solution = start;
  let cost = solutionCost(evaluator, solution);
  for (;;) {
    let best: { solution: Solution; cost: number } | undefined;
    solution.routes.forEach((stops, vehicle) => {
      stops.forEach((stop, position) => {
        if (typeof stop !== "number") return;
        const candidate: Solution = {
          routes: solution.routes.map((route, i) =>
            i === vehicle ? route.toSpliced(position, 1) : route,
          ),
          pool: [...solution.pool, stop],
        };
        const candidateCost = solutionCost(evaluator, candidate);
        if (candidateCost < (best?.cost ?? cost))
          best = { solution: candidate, cost: candidateCost };
      });
    });
    if (!best) return solution;
    solution = best.solution;
    cost = best.cost;
  }
}

// Probamos con 1, 2, ... N vehículos y nos quedamos con el más barato. Esta curva es la que
// muestra por qué no conviene usar toda la flota.
export function sweepFleet(evaluator: Evaluator): {
  solution: Solution;
  fleet: FleetSize[];
  starts: Solution[];
} {
  const { orders, vehicles } = evaluator.scenario;
  if (orders.length === 0) {
    const empty: Solution = { routes: vehicles.map(() => []), pool: [] };
    return { solution: empty, fleet: [], starts: [empty] };
  }
  const sizes = Array.from(
    { length: Math.min(vehicles.length, orders.length) },
    (_, i) => i + 1,
  );
  const tried = sizes.map((fleet) => {
    const solution = cheapestInsertion(evaluator, fleet);
    return { fleet, solution, cost: solutionCost(evaluator, solution) };
  });
  const best = tried.reduce((winner, current) =>
    current.cost < winner.cost ? current : winner,
  );
  return {
    solution: best.solution,
    fleet: tried.map(({ fleet, cost }) => ({ vehicles: fleet, cost })),
    starts: tried.map(({ solution }) => solution),
  };
}
