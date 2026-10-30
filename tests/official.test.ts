import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateScenario } from "../src/domain/generate.ts";
import { pick, seeded } from "../src/domain/random.ts";
import { simulate } from "../src/domain/simulate.ts";
import {
  RELOAD,
  type Plan,
  type Scenario,
  type Stop,
} from "../src/domain/types.ts";
import { planToJson } from "../src/io/plan.ts";
import { scenarioToRaw } from "../src/io/scenario.ts";

// Comparamos nuestro simulador con el oficial (Python) en planes al azar, incluidos planes
// inválidos, con fallas y con recargas. Necesita el repo quickdrop-sim clonado; si no está, se saltea.
const official =
  process.env.QUICKDROP_SIM ??
  join(homedir(), "Projects/codejam-ref/quickdrop-sim");

function randomPlan(scenario: Scenario, seed: number): Plan {
  const random = seeded(seed);
  const ids = scenario.orders
    .map((order) => order.id)
    .filter(() => random() < 0.9);
  if (random() < 0.15) ids.push(scenario.orders.length + 5);
  if (random() < 0.15 && ids.length > 0) ids.push(ids[0] as number);
  const routes = scenario.vehicles.map((vehicle) => ({
    vehicle: vehicle.id,
    stops: [] as Stop[],
  }));
  for (const id of ids) {
    const route = routes[pick(random, routes.length)];
    route?.stops.push(id);
    if (random() < 0.1) route?.stops.push(RELOAD);
  }
  return { routes: routes.filter(() => random() < 0.85) };
}

function officialCost(
  folder: string,
  planPath: string,
): { valido: boolean; costo?: { total: number } } {
  try {
    const output = execFileSync(
      "python3",
      ["-m", "quickdrop", "simular", folder, planPath, "--json"],
      {
        cwd: official,
        encoding: "utf8",
      },
    );
    return JSON.parse(output) as { valido: boolean; costo: { total: number } };
  } catch (error) {
    const output = (error as { stdout?: string }).stdout;
    if (output) return JSON.parse(output) as { valido: boolean };
    throw error;
  }
}

describe.skipIf(!existsSync(join(official, "quickdrop")))(
  "contra el simulador oficial",
  () => {
    it("da el mismo costo y la misma validez en 120 planes al azar", () => {
      const root = mkdtempSync(join(tmpdir(), "quickdrop-"));
      for (let seed = 0; seed < 120; seed++) {
        const scenario = generateScenario({
          orders: 5 + (seed % 40),
          vehicles: 1 + (seed % 5),
          seed,
          world: {
            serviceMinutes: seed % 7,
            reloadMinutes: seed % 13,
            minutesPerBlock: 1 + (seed % 4),
            costs: {
              perBlock: 3,
              perVehicle: 60,
              perMinute: 1,
              perFailure: 200,
              perPremiumMinute: seed % 3,
            },
          },
          premiumShare: 0.3,
        });
        const folder = join(root, `caso-${seed}`);
        const raw = scenarioToRaw(scenario);
        mkdirSync(folder, { recursive: true });
        writeFileSync(join(folder, "mundo.json"), JSON.stringify(raw.world));
        writeFileSync(join(folder, "pedidos.json"), JSON.stringify(raw.orders));
        writeFileSync(
          join(folder, "vehiculos.json"),
          JSON.stringify(raw.vehicles),
        );
        const plan = randomPlan(scenario, seed);
        const planPath = join(folder, "plan.json");
        writeFileSync(planPath, planToJson(plan));

        const ours = simulate(scenario, plan);
        const theirs = officialCost(folder, planPath);
        expect(ours.valid, `caso ${seed}`).toBe(theirs.valido);
        if (ours.valid)
          expect(ours.cost.total, `caso ${seed}`).toBe(theirs.costo?.total);
      }
    }, 120_000);
  },
);
