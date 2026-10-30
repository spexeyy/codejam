import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { generateScenario } from "../src/domain/generate.ts";
import { simulate } from "../src/domain/simulate.ts";
import type { Scenario } from "../src/domain/types.ts";
import { loadScenario } from "../src/io/files.ts";
import { planToJson } from "../src/io/plan.ts";
import { createEvaluator, solutionCost } from "../src/planner/evaluation.ts";
import { cheapestInsertion } from "../src/planner/insertion.ts";
import { lowerBound } from "../src/planner/lower-bound.ts";
import {
  defaultOptions,
  strategies,
  strategyById,
} from "../src/planner/strategies.ts";

const quick = { seed: 1, iterations: 20_000, restarts: 1 };

function checked(scenario: Scenario, plan: Parameters<typeof simulate>[1]) {
  const simulation = simulate(scenario, plan);
  if (!simulation.valid) throw new Error(simulation.errors.join("; "));
  return simulation;
}

// El último costo que registramos en cada caso publicado: ningún cambio puede empeorarlo.
const recorded = [
  ["practica-40", 913],
  // El evento 1 agregó pedidos premium al ejemplo oficial: su registro anterior (638) ya no aplica.
  ["ejemplo-10", 811],
  ["evento1-40", 1402],
] as const;

describe("casos publicados", () => {
  it.each(recorded)(
    "%s: plan válido, todo entregado y costo ≤ %d",
    (name, cost) => {
      const scenario = loadScenario(`tests/cases/${name}`);
      const solved = strategyById("recocido").solve(scenario, defaultOptions);
      const simulation = checked(scenario, solved.plan);
      expect(simulation.unassigned).toEqual([]);
      expect(simulation.cost.total).toBe(solved.cost);
      expect(simulation.cost.total).toBeLessThanOrEqual(cost);
    },
    30_000,
  );
});

describe("estrategias", () => {
  it("el costo que optimiza el planificador es el del simulador", () => {
    const scenario = generateScenario({ orders: 30, vehicles: 4, seed: 3 });
    const evaluator = createEvaluator(scenario);
    for (let fleet = 1; fleet <= 4; fleet++) {
      const solution = cheapestInsertion(evaluator, fleet);
      const solved = strategyById("insercion").solve(scenario, quick);
      expect(checked(scenario, solved.plan).cost.total).toBe(solved.cost);
      expect(solutionCost(evaluator, solution)).toBeGreaterThan(0);
    }
  });

  it("el recocido nunca empeora la inserción", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const scenario = generateScenario({ orders: 25, vehicles: 5, seed });
      const base = strategyById("insercion").solve(scenario, quick);
      const improved = strategyById("recocido").solve(scenario, quick);
      expect(improved.cost).toBeLessThanOrEqual(base.cost);
    }
  });

  it("la misma entrada da exactamente la misma salida", () => {
    const scenario = generateScenario({ orders: 30, vehicles: 5, seed: 9 });
    const first = strategyById("recocido").solve(scenario, quick);
    const second = strategyById("recocido").solve(scenario, quick);
    expect(planToJson(first.plan)).toBe(planToJson(second.plan));
  });

  it("si entregar cuesta más que la multa, el pedido no se entrega", () => {
    const scenario = generateScenario({
      orders: 10,
      vehicles: 2,
      seed: 4,
      world: {
        depot: { x: 0, y: 0 },
        costs: {
          perBlock: 3,
          perVehicle: 60,
          perMinute: 1,
          perFailure: 1,
          perPremiumMinute: 1,
        },
      },
    });
    const solved = strategyById("recocido").solve(scenario, quick);
    expect(checked(scenario, solved.plan).unassigned).toHaveLength(10);
  });

  it("sin pedidos, el plan no usa vehículos", () => {
    const scenario = generateScenario({ orders: 0, vehicles: 3, seed: 1 });
    for (const strategy of strategies) {
      expect(strategy.solve(scenario, quick).plan.routes).toEqual([]);
    }
  });
});

describe("invariantes del enunciado en escenarios al azar", () => {
  it("todo plan es válido y cada pedido aparece a lo sumo una vez", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 35 }),
        fc.integer({ min: 1, max: 6 }),
        fc.integer({ min: 0, max: 10_000 }),
        fc.integer({ min: 0, max: 300 }),
        (orders, vehicles, seed, perVehicle) => {
          const scenario = generateScenario({
            orders,
            vehicles,
            seed,
            world: {
              costs: {
                perBlock: 3,
                perVehicle,
                perMinute: 1,
                perFailure: 200,
                perPremiumMinute: 1,
              },
            },
          });
          for (const strategy of strategies) {
            const solved = strategy.solve(scenario, {
              seed,
              iterations: 3_000,
              restarts: 1,
            });
            const simulation = checked(scenario, solved.plan);
            expect(simulation.cost.total).toBe(solved.cost);
            const stops = solved.plan.routes.flatMap((route) => route.stops);
            expect(new Set(stops).size).toBe(stops.length);
          }
        },
      ),
      { numRuns: 60 },
    );
  });
});

describe("cota inferior", () => {
  it("nunca supera el costo de un plan que entrega todo", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 0, max: 10_000 }),
        (orders, vehicles, seed) => {
          const scenario = generateScenario({ orders, vehicles, seed });
          const solved = strategyById("recocido").solve(scenario, {
            seed,
            iterations: 5_000,
            restarts: 1,
          });
          const simulation = checked(scenario, solved.plan);
          if (simulation.unassigned.length > 0) return;
          expect(lowerBound(scenario).cost).toBeLessThanOrEqual(
            simulation.cost.total,
          );
        },
      ),
      { numRuns: 80 },
    );
  });

  it("en la práctica deja el óptimo entre 767 y 913", () => {
    expect(lowerBound(loadScenario("tests/cases/practica-40")).cost).toBe(767);
  });
});
