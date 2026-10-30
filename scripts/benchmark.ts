import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { generateScenario } from "../src/domain/generate.ts";
import { simulate } from "../src/domain/simulate.ts";
import type { Scenario } from "../src/domain/types.ts";
import { scenarioToRaw } from "../src/io/scenario.ts";
import { defaultOptions, strategyById } from "../src/planner/strategies.ts";

// Corremos cada estrategia sobre escenarios generados del tamaño de los de evaluación y dejamos
// los datasets en datos/bench para comparar con otros solvers (OR-Tools).
const { values } = parseArgs({
  options: {
    casos: { type: "string", default: "20" },
    pedidos: { type: "string", default: "40" },
    vehiculos: { type: "string", default: "5" },
    solo: { type: "string" },
  },
});

const configurations = [
  { label: "insercion", strategy: "insercion", options: defaultOptions },
  { label: "recocido", strategy: "recocido", options: defaultOptions },
  {
    label: "recocido-largo",
    strategy: "recocido",
    options: { seed: 1000, iterations: 5_000_000, restarts: 4 },
  },
];

function save(scenario: Scenario, folder: string) {
  const raw = scenarioToRaw(scenario);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "mundo.json"), JSON.stringify(raw.world));
  writeFileSync(join(folder, "pedidos.json"), JSON.stringify(raw.orders));
  writeFileSync(join(folder, "vehiculos.json"), JSON.stringify(raw.vehicles));
}

for (let seed = 1; seed <= Number(values.casos); seed++) {
  const scenario = generateScenario({
    orders: Number(values.pedidos),
    vehicles: Number(values.vehiculos),
    seed,
  });
  const folder = join("datos", "bench", `caso-${seed}`);
  save(scenario, folder);
  for (const { label, strategy, options } of configurations.filter(
    (configuration) => !values.solo || configuration.label === values.solo,
  )) {
    const started = performance.now();
    const solved = strategyById(strategy).solve(scenario, options);
    const seconds = (performance.now() - started) / 1000;
    const simulation = simulate(scenario, solved.plan);
    if (!simulation.valid)
      throw new Error(`${label} dio un plan inválido en ${folder}`);
    const vehicles = simulation.metrics.vehiclesUsed;
    process.stdout.write(
      `${JSON.stringify({ caso: seed, estrategia: label, costo: simulation.cost.total, vehiculos: vehicles, segundos: Number(seconds.toFixed(2)) })}\n`,
    );
  }
}
