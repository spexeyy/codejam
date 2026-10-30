import { generateScenario } from "@/domain/generate.ts";
import type { Scenario } from "@/domain/types.ts";
import { parseScenario } from "@/io/scenario.ts";
import exampleOrders from "../../../../tests/cases/ejemplo-10/pedidos.json" with { type: "json" };
import exampleVehicles from "../../../../tests/cases/ejemplo-10/vehiculos.json" with { type: "json" };
import exampleWorld from "../../../../tests/cases/ejemplo-10/mundo.json" with { type: "json" };
import practiceOrders from "../../../../tests/cases/practica-40/pedidos.json" with { type: "json" };
import practiceVehicles from "../../../../tests/cases/practica-40/vehiculos.json" with { type: "json" };
import practiceWorld from "../../../../tests/cases/practica-40/mundo.json" with { type: "json" };

export const practice: Scenario = parseScenario({
  world: practiceWorld,
  orders: practiceOrders,
  vehicles: practiceVehicles,
});

export const example: Scenario = parseScenario({
  world: exampleWorld,
  orders: exampleOrders,
  vehicles: exampleVehicles,
});

// El escenario que pide el público: n pedidos al azar con 5 vehículos, como los de evaluación.
export function audienceScenario(orders: number, seed: number): Scenario {
  return generateScenario({ orders, vehicles: 5, seed });
}
