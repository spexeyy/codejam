import { blocks } from "./grid.ts";
import {
  RELOAD,
  type Order,
  type Plan,
  type Point,
  type Scenario,
  type Stop,
  type Vehicle,
  type World,
} from "./types.ts";

// Es una traducción de quickdrop/simulador.py, el simulador con el que nos evalúan. Si cambia
// en un evento, este es el archivo que actualizamos; tests/official.test.ts compara los dos
// en planes al azar para asegurarnos de que nunca nos separamos.

export type VisitStatus = "delivered" | "reload" | "return";

export type Visit = {
  vehicle: string;
  trip: number;
  stop: Stop;
  position: Point;
  blocks: number;
  arrival: number;
  wait: number;
  start: number | null;
  departure: number;
  status: VisitStatus;
};

export type RouteOutcome = {
  blocks: number;
  finish: number;
  delivered: number;
};

export type CostBreakdown = {
  distance: number;
  vehicles: number;
  time: number;
  failures: number;
  total: number;
};

export type Metrics = {
  orders: number;
  delivered: number;
  failed: number;
  totalBlocks: number;
  vehiclesUsed: number;
  makespan: number;
  finish: number;
};

export type Simulation =
  | { valid: false; errors: string[] }
  | {
      valid: true;
      visits: Visit[];
      unassigned: number[];
      metrics: Metrics;
      cost: CostBreakdown;
    };

export const hasOrders = (stops: readonly Stop[]) =>
  stops.some((stop) => stop !== RELOAD);

export function indexOrders(orders: readonly Order[]): Map<number, Order> {
  return new Map(orders.map((order) => [order.id, order]));
}

export function validatePlan(scenario: Scenario, plan: Plan): string[] {
  const errors: string[] = [];
  const vehicles = new Set(scenario.vehicles.map((vehicle) => vehicle.id));
  const orders = new Set(scenario.orders.map((order) => order.id));
  const seenVehicles = new Set<string>();
  const seenOrders = new Map<number, string>();
  plan.routes.forEach((route, index) => {
    if (!vehicles.has(route.vehicle)) {
      errors.push(
        `Ruta ${index + 1}: el vehículo '${route.vehicle}' no existe.`,
      );
      return;
    }
    if (seenVehicles.has(route.vehicle)) {
      errors.push(`El vehículo '${route.vehicle}' aparece en más de una ruta.`);
      return;
    }
    seenVehicles.add(route.vehicle);
    for (const stop of route.stops) {
      if (stop === RELOAD) continue;
      if (!orders.has(stop)) {
        errors.push(`Vehículo ${route.vehicle}: el pedido ${stop} no existe.`);
        continue;
      }
      const previous = seenOrders.get(stop);
      if (previous !== undefined) {
        errors.push(
          `El pedido ${stop} aparece más de una vez (vehículos ${previous} y ${route.vehicle}).`,
        );
        continue;
      }
      seenOrders.set(stop, route.vehicle);
    }
  });
  return errors;
}

export function runRoute(
  world: World,
  vehicle: Vehicle,
  stops: readonly Stop[],
  orders: ReadonlyMap<number, Order>,
  onVisit?: (visit: Visit) => void,
): RouteOutcome {
  const depot = world.depot;
  let time = world.departure;
  let position = depot;
  let trip = 1;
  let total = 0;
  let delivered = 0;
  for (const stop of stops) {
    if (stop === RELOAD) {
      const distance = blocks(position, depot);
      time += distance * vehicle.minutesPerBlock;
      const arrival = time;
      time += world.reloadMinutes;
      onVisit?.({
        vehicle: vehicle.id,
        trip,
        stop,
        position: depot,
        blocks: distance,
        arrival,
        wait: 0,
        start: null,
        departure: time,
        status: "reload",
      });
      total += distance;
      position = depot;
      trip += 1;
      continue;
    }
    const order = orders.get(stop);
    if (!order)
      throw new Error(`el pedido ${stop} no existe: el plan no se validó`);
    const distance = blocks(position, order.position);
    time += distance * vehicle.minutesPerBlock;
    total += distance;
    position = order.position;
    const arrival = time;
    time = arrival + world.serviceMinutes;
    delivered += 1;
    onVisit?.({
      vehicle: vehicle.id,
      trip,
      stop,
      position,
      blocks: distance,
      arrival,
      wait: 0,
      start: arrival,
      departure: time,
      status: "delivered",
    });
  }
  const back = blocks(position, depot);
  time += back * vehicle.minutesPerBlock;
  total += back;
  onVisit?.({
    vehicle: vehicle.id,
    trip,
    stop: RELOAD,
    position: depot,
    blocks: back,
    arrival: time,
    wait: 0,
    start: null,
    departure: time,
    status: "return",
  });
  return { blocks: total, finish: time, delivered };
}

export function costOf(
  world: World,
  totals: {
    blocks: number;
    fixedCost: number;
    makespan: number;
    failed: number;
  },
): CostBreakdown {
  const { costs } = world;
  const distance = totals.blocks * costs.perBlock;
  const time = totals.makespan * costs.perMinute;
  const failures = totals.failed * costs.perFailure;
  return {
    distance,
    vehicles: totals.fixedCost,
    time,
    failures,
    total: distance + totals.fixedCost + time + failures,
  };
}

export function simulate(scenario: Scenario, plan: Plan): Simulation {
  const errors = validatePlan(scenario, plan);
  if (errors.length > 0) return { valid: false, errors };

  const { world } = scenario;
  const orders = indexOrders(scenario.orders);
  const vehicles = new Map(
    scenario.vehicles.map((vehicle) => [vehicle.id, vehicle]),
  );
  const visits: Visit[] = [];
  const assigned = new Set<number>();
  let totalBlocks = 0;
  let fixedCost = 0;
  let used = 0;
  let delivered = 0;
  let finish = world.departure;

  for (const route of plan.routes) {
    const vehicle = vehicles.get(route.vehicle);
    if (!vehicle)
      throw new Error(
        `el vehículo ${route.vehicle} no existe: el plan no se validó`,
      );
    if (!hasOrders(route.stops)) continue;
    used += 1;
    fixedCost += vehicle.fixedCost;
    for (const stop of route.stops) if (stop !== RELOAD) assigned.add(stop);
    const outcome = runRoute(world, vehicle, route.stops, orders, (visit) =>
      visits.push(visit),
    );
    totalBlocks += outcome.blocks;
    delivered += outcome.delivered;
    finish = Math.max(finish, outcome.finish);
  }

  const unassigned = scenario.orders
    .map((order) => order.id)
    .filter((id) => !assigned.has(id));
  const makespan = finish - world.departure;
  return {
    valid: true,
    visits,
    unassigned,
    metrics: {
      orders: scenario.orders.length,
      delivered,
      failed: unassigned.length,
      totalBlocks,
      vehiclesUsed: used,
      makespan,
      finish,
    },
    cost: costOf(world, {
      blocks: totalBlocks,
      fixedCost,
      makespan,
      failed: unassigned.length,
    }),
  };
}
