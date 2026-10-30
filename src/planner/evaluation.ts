import {
  costOf,
  hasOrders,
  indexOrders,
  runRoute,
} from "../domain/simulate.ts";
import {
  RELOAD,
  type Order,
  type Plan,
  type Scenario,
  type Stop,
} from "../domain/types.ts";

// Mientras buscamos, una solución es una lista de paradas por vehículo (en el orden del archivo
// de vehículos) más los pedidos que decidimos no entregar.
export type Solution = { routes: Stop[][]; pool: number[] };

export function at<T>(list: readonly T[], index: number): T {
  const element = list[index];
  if (element === undefined)
    throw new Error(`índice ${index} fuera de rango (largo ${list.length})`);
  return element;
}

export type Leg = {
  premiumMinutes: number;
  blocks: number;
  finish: number;
  used: boolean;
  fixedCost: number;
};

export type Evaluator = {
  scenario: Scenario;
  orders: Map<number, Order>;
  leg: (vehicle: number, stops: readonly Stop[]) => Leg;
  total: (legs: readonly Leg[], failed: number) => number;
};

export function createEvaluator(scenario: Scenario): Evaluator {
  const { world, vehicles } = scenario;
  const orders = indexOrders(scenario.orders);
  const idle: Leg = {
    premiumMinutes: 0,
    blocks: 0,
    finish: world.departure,
    used: false,
    fixedCost: 0,
  };

  const leg = (index: number, stops: readonly Stop[]): Leg => {
    const vehicle = vehicles[index];
    if (!vehicle) throw new Error(`no hay vehículo en la posición ${index}`);
    if (!hasOrders(stops)) return idle;
    const outcome = runRoute(world, vehicle, stops, orders);
    return {
      premiumMinutes: outcome.premiumMinutes,
      blocks: outcome.blocks,
      finish: outcome.finish,
      used: true,
      fixedCost: vehicle.fixedCost,
    };
  };

  // Es la misma cuenta que simulate() (usa su costOf), pero sin armar la lista de visitas:
  // el recocido la repite millones de veces y solo recalcula las rutas que cambiaron.
  const total = (legs: readonly Leg[], failed: number) => {
    let blocks = 0;
    let fixedCost = 0;
    let premiumMinutes = 0;
    let finish = world.departure;
    for (const current of legs) {
      if (!current.used) continue;
      blocks += current.blocks;
      fixedCost += current.fixedCost;
      premiumMinutes += current.premiumMinutes;
      finish = Math.max(finish, current.finish);
    }
    return costOf(world, {
      blocks,
      fixedCost,
      makespan: finish - world.departure,
      failed,
      premiumMinutes,
    }).total;
  };

  return { scenario, orders, leg, total };
}

export function legsOf(evaluator: Evaluator, solution: Solution): Leg[] {
  return solution.routes.map((stops, index) => evaluator.leg(index, stops));
}

export function solutionCost(evaluator: Evaluator, solution: Solution): number {
  return evaluator.total(legsOf(evaluator, solution), solution.pool.length);
}

export function toPlan(scenario: Scenario, solution: Solution): Plan {
  return {
    routes: solution.routes.flatMap((stops, index) => {
      const vehicle = scenario.vehicles[index];
      return vehicle && hasOrders(stops)
        ? [{ vehicle: vehicle.id, stops: trimReloads(stops) }]
        : [];
    }),
  };
}

// Un DEPOSITO al final o dos seguidos no cambian nada salvo sumar tiempo de carga: los sacamos.
function trimReloads(stops: readonly Stop[]): Stop[] {
  const trimmed: Stop[] = [];
  for (const stop of stops) {
    if (
      stop === RELOAD &&
      (trimmed.length === 0 || trimmed[trimmed.length - 1] === RELOAD)
    )
      continue;
    trimmed.push(stop);
  }
  while (trimmed[trimmed.length - 1] === RELOAD) trimmed.pop();
  return trimmed;
}
