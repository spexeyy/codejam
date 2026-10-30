import type { Scenario } from "@/domain/types.ts";
import { lowerBound, type LowerBound } from "@/planner/lower-bound.ts";
import {
  defaultOptions,
  strategyById,
  type SolveOptions,
  type Solved,
} from "@/planner/strategies.ts";

export type Solution = {
  base: Solved;
  best: Solved;
  bound: LowerBound;
  seconds: number;
};

export type SolveRequest = { scenario: Scenario; options: SolveOptions };

// Para el escenario que pide el público usamos un presupuesto chico: con 150 pedidos tarda
// unos 4 s y sigue mejorando la inserción. Los casos publicados usan el mismo que el CLI.
export const quickOptions: SolveOptions = {
  seed: 1,
  iterations: 200_000,
  restarts: 1,
};

// El trabajo pesado: la inserción, el recocido y la cota. Corre adentro del worker para que
// la pantalla no se congele los segundos que tarda el recocido.
export function solveAll(
  scenario: Scenario,
  options: SolveOptions = defaultOptions,
): Solution {
  const started = performance.now();
  const base = strategyById("insercion").solve(scenario, options);
  const best = strategyById("recocido").solve(scenario, options);
  const bound = lowerBound(scenario);
  return {
    base,
    best,
    bound,
    seconds: (performance.now() - started) / 1000,
  };
}
