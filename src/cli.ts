import { parseArgs } from "node:util";
import { toClock } from "./domain/clock.ts";
import { simulate } from "./domain/simulate.ts";
import { loadScenario, writePlan, type Format } from "./io/files.ts";
import { DataError } from "./io/scenario.ts";
import { defaultOptions, strategyById } from "./planner/strategies.ts";

const usage = `uso: node src/cli.ts <carpeta o .zip del dataset> [opciones]

  --salida <archivo>      plan a escribir, .json o .csv (por defecto plan.json)
  --estrategia <id>       recocido (por defecto) o insercion
  --semilla <n>           semilla del recocido (por defecto ${defaultOptions.seed})
  --iteraciones <n>       iteraciones por corrida (por defecto ${defaultOptions.iterations})
  --corridas <n>          corridas por cada tamaño de flota (por defecto ${defaultOptions.restarts})
  --formato <json|csv>    formato de los datos a leer (por defecto JSON si existe)`;

function positiveInteger(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0)
    throw new DataError(
      `--${name}: se esperaba un entero positivo y vino "${value}"`,
    );
  return parsed;
}

function main(): number {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      salida: { type: "string", default: "plan.json" },
      estrategia: { type: "string", default: "recocido" },
      semilla: { type: "string" },
      iteraciones: { type: "string" },
      corridas: { type: "string" },
      formato: { type: "string" },
      ayuda: { type: "boolean", short: "h" },
    },
  });
  const [folder] = positionals;
  if (values.ayuda || !folder) {
    process.stderr.write(`${usage}\n`);
    return values.ayuda ? 0 : 1;
  }
  if (
    values.formato !== undefined &&
    values.formato !== "json" &&
    values.formato !== "csv"
  ) {
    throw new DataError(
      `--formato: se espera json o csv y vino "${values.formato}"`,
    );
  }

  const scenario = loadScenario(folder, values.formato as Format | undefined);
  const strategy = strategyById(values.estrategia);
  const started = performance.now();
  const solved = strategy.solve(scenario, {
    seed: positiveInteger(values.semilla, defaultOptions.seed, "semilla"),
    iterations: positiveInteger(
      values.iteraciones,
      defaultOptions.iterations,
      "iteraciones",
    ),
    restarts: Math.max(
      1,
      positiveInteger(values.corridas, defaultOptions.restarts, "corridas"),
    ),
  });
  const seconds = (performance.now() - started) / 1000;

  const simulation = simulate(scenario, solved.plan);
  if (!simulation.valid) {
    process.stderr.write(
      `PLAN INVÁLIDO, no se escribe:\n${simulation.errors.join("\n")}\n`,
    );
    return 2;
  }
  writePlan(values.salida, solved.plan);
  const { cost, metrics } = simulation;
  process.stderr.write(
    [
      `${strategy.name} · ${seconds.toFixed(2)} s · plan en ${values.salida}`,
      `COSTO TOTAL: ${cost.total}`,
      `  distancia  ${metrics.totalBlocks} cuadras = ${cost.distance}`,
      `  vehículos  ${metrics.vehiclesUsed} usados = ${cost.vehicles}`,
      `  tiempo     ${metrics.makespan} min = ${cost.time} (vuelve el último a las ${toClock(metrics.finish)})`,
      `  fallas     ${metrics.failed} = ${cost.failures}`,
      `  premium    ${metrics.premiumMinutes} min = ${cost.premium}${metrics.premiumTotal > 0 ? ` (${metrics.premiumDelivered}/${metrics.premiumTotal} entregados)` : ""}`,
      `Entregas: ${metrics.delivered}/${metrics.orders}${simulation.unassigned.length > 0 ? ` · sin entregar: ${simulation.unassigned.join(", ")}` : ""}`,
      "",
    ].join("\n"),
  );
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  if (!(error instanceof DataError)) throw error;
  process.stderr.write(`Error en los datos: ${error.message}\n`);
  process.exitCode = 1;
}
