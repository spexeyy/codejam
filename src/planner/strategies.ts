import type { Plan, Scenario } from "../domain/types.ts";
import { anneal, type Progress } from "./annealing.ts";
import { createEvaluator, solutionCost, toPlan } from "./evaluation.ts";
import { sweepFleet, type FleetSize } from "./insertion.ts";

export type SolveOptions = {
  seed: number;
  iterations: number;
  restarts: number;
};

export type Solved = {
  plan: Plan;
  cost: number;
  history: Progress[];
  fleet: FleetSize[];
};

export type Strategy = {
  id: string;
  name: string;
  summary: string;
  solve: (
    scenario: Scenario,
    options: SolveOptions,
    onImprove?: (plan: Plan, cost: number) => void,
  ) => Solved;
};

export const defaultOptions: SolveOptions = {
  seed: 1,
  iterations: 1_000_000,
  restarts: 2,
};

const insertion: Strategy = {
  id: "insercion",
  name: "Inserción más barata",
  summary:
    "barrido angular y cada pedido donde menos sube el costo, probando de 1 a N vehículos",
  solve: (scenario) => {
    const evaluator = createEvaluator(scenario);
    const swept = sweepFleet(evaluator);
    const cost = solutionCost(evaluator, swept.solution);
    return {
      plan: toPlan(scenario, swept.solution),
      cost,
      history: [],
      fleet: swept.fleet,
    };
  },
};

const annealing: Strategy = {
  id: "recocido",
  name: "Recocido simulado",
  summary:
    "parte de la inserción y prueba cambios chicos; a veces acepta empeorar para no quedarse en un óptimo local",
  solve: (scenario, options, onImprove) => {
    const evaluator = createEvaluator(scenario);
    const swept = sweepFleet(evaluator);
    const annealed = anneal(
      evaluator,
      swept.starts,
      options,
      onImprove &&
        ((solution, cost) => onImprove(toPlan(scenario, solution), cost)),
    );
    return {
      plan: toPlan(scenario, annealed.solution),
      cost: annealed.cost,
      history: annealed.history,
      fleet: swept.fleet,
    };
  },
};

export const strategies: Strategy[] = [insertion, annealing];

export function strategyById(id: string): Strategy {
  const strategy = strategies.find((candidate) => candidate.id === id);
  if (!strategy) {
    throw new Error(
      `no existe la estrategia "${id}"; las disponibles son: ${strategies.map((s) => s.id).join(", ")}`,
    );
  }
  return strategy;
}
