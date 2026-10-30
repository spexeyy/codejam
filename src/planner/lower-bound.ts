import { blocks } from "../domain/grid.ts";
import type { Point, Scenario } from "../domain/types.ts";
import { at } from "./evaluation.ts";

// Una cota inferior del costo: demostramos que ningún plan que entregue todo puede costar menos.
// Con ella podemos decir "el óptimo está entre la cota y nuestro plan" sin tener que creerlo.
//
// Distancia: juntando las rutas en el depósito queda un recorrido cerrado que pasa por todos
// los pedidos, así que la distancia total es al menos la del mejor recorrido de un vehículo
// (TSP). Para el TSP usamos la cota de Held y Karp (1970): el 1-árbol mínimo con
// multiplicadores de Lagrange ajustados por subgradiente.
//
// Makespan: no puede ser menor que el promedio de las duraciones de las rutas ni que la ida y
// vuelta al pedido más lejano. Probamos cada cantidad de vehículos k y nos quedamos con la menor.

export type LowerBound = { cost: number; tour: number; vehicles: number };

function heldKarp(points: readonly Point[], iterations: number): number {
  const size = points.length;
  if (size < 2) return 0;
  if (size === 2) return 2 * blocks(at(points, 0), at(points, 1));
  const distance = points.map((a) => points.map((b) => blocks(a, b)));
  const weight = (pi: number[], i: number, j: number) =>
    at(at(distance, i), j) + at(pi, i) + at(pi, j);
  const pi = new Array<number>(size).fill(0);
  let best = 0;
  let step = 0;
  for (let round = 0; round < iterations; round++) {
    // Árbol generador mínimo (Prim) sobre los nodos 1..n, sin el depósito.
    const degree = new Array<number>(size).fill(0);
    const inTree = new Array<boolean>(size).fill(false);
    const link = new Array<number>(size).fill(Infinity);
    const parent = new Array<number>(size).fill(-1);
    link[1] = 0;
    let tree = 0;
    for (let added = 1; added < size; added++) {
      let next = -1;
      for (let v = 1; v < size; v++) {
        if (!inTree[v] && (next === -1 || at(link, v) < at(link, next)))
          next = v;
      }
      inTree[next] = true;
      tree += at(link, next);
      const from = at(parent, next);
      if (from >= 0) {
        degree[from] = at(degree, from) + 1;
        degree[next] = at(degree, next) + 1;
      }
      for (let v = 1; v < size; v++) {
        const w = weight(pi, next, v);
        if (!inTree[v] && w < at(link, v)) {
          link[v] = w;
          parent[v] = next;
        }
      }
    }
    // El depósito se une con sus dos aristas más baratas: eso es un 1-árbol.
    const edges = Array.from({ length: size - 1 }, (_, i) => ({
      v: i + 1,
      w: weight(pi, 0, i + 1),
    })).sort((a, b) => a.w - b.w);
    const first = at(edges, 0);
    const second = at(edges, 1);
    degree[0] = 2;
    degree[first.v] = at(degree, first.v) + 1;
    degree[second.v] = at(degree, second.v) + 1;
    const value =
      tree + first.w + second.w - 2 * pi.reduce((sum, p) => sum + p, 0);
    best = Math.max(best, value);
    const gradient = degree.map((d) => d - 2);
    const norm = gradient.reduce((sum, g) => sum + g * g, 0);
    if (norm === 0) return value;
    if (round === 0) step = (0.01 * value) / Math.sqrt(norm);
    step *= 0.98;
    for (let i = 0; i < size; i++) pi[i] = at(pi, i) + step * at(gradient, i);
  }
  return best;
}

export function lowerBound(scenario: Scenario, iterations = 400): LowerBound {
  const { world, orders, vehicles } = scenario;
  if (orders.length === 0) return { cost: 0, tour: 0, vehicles: 0 };
  // Las distancias son enteras: la cota de distancia se puede redondear hacia arriba.
  const tour = Math.ceil(
    heldKarp(
      [world.depot, ...orders.map((order) => order.position)],
      iterations,
    ) - 1e-9,
  );
  const fastest = Math.min(
    ...vehicles.map((vehicle) => vehicle.minutesPerBlock),
  );
  const farthest = Math.max(
    ...orders.map(
      (order) =>
        2 * blocks(world.depot, order.position) * fastest +
        world.serviceMinutes,
    ),
  );
  const fixed = vehicles
    .map((vehicle) => vehicle.fixedCost)
    .sort((a, b) => a - b);
  const { costs } = world;
  let best: LowerBound | undefined;
  for (let k = 1; k <= vehicles.length; k++) {
    const busy = (fastest * tour + orders.length * world.serviceMinutes) / k;
    const fixedCost = fixed.slice(0, k).reduce((sum, cost) => sum + cost, 0);
    const cost =
      costs.perBlock * tour +
      fixedCost +
      costs.perMinute * Math.max(farthest, busy);
    if (!best || cost < best.cost) best = { cost, tour, vehicles: k };
  }
  if (!best) throw new Error("no hay vehículos");
  return best;
}
