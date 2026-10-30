import { describe, expect, it } from "vitest";
import { toMinutes } from "../src/domain/clock.ts";
import { simulate } from "../src/domain/simulate.ts";
import type { Plan, Scenario } from "../src/domain/types.ts";
import { loadPlan, loadScenario } from "../src/io/files.ts";
import { DataError, parseCsv, parseScenario } from "../src/io/scenario.ts";

// Los mismos casos que trae tests/test_simulador.py en el repo del simulador oficial.

const twoOrders = [
  { id: 1, x: 2, y: 3, peso: 10 },
  { id: 2, x: 5, y: 3, peso: 5 },
];

function scenario(
  orders: unknown[],
  vehicles: string[],
  world: object = {},
): Scenario {
  return parseScenario({
    world,
    orders,
    vehicles: vehicles.map((id) => ({ id })),
  });
}

function run(routes: [string, (number | "DEPOSITO")[]][], vehicles = ["A"]) {
  const plan: Plan = {
    routes: routes.map(([vehicle, stops]) => ({ vehicle, stops })),
  };
  return simulate(scenario(twoOrders, vehicles), plan);
}

function valid(simulation: ReturnType<typeof simulate>) {
  if (!simulation.valid) throw new Error(simulation.errors.join("; "));
  return simulation;
}

describe("cálculo básico", () => {
  it("coincide con el costo calculado a mano", () => {
    const result = valid(run([["A", [1, 2]]]));
    expect(result.metrics.totalBlocks).toBe(16);
    expect(result.metrics.makespan).toBe(58);
    expect(result.visits[0]?.arrival).toBe(toMinutes("08:15"));
    expect(result.visits[1]?.arrival).toBe(toMinutes("08:29"));
    expect(result.cost).toEqual({
      distance: 48,
      vehicles: 60,
      time: 58,
      failures: 0,
      premium: 0,
      total: 166,
    });
  });

  it("dos vehículos suman distancia y costo fijo", () => {
    const result = valid(
      run(
        [
          ["A", [1]],
          ["B", [2]],
        ],
        ["A", "B"],
      ),
    );
    expect(result.metrics.totalBlocks).toBe(26);
    expect(result.metrics.vehiclesUsed).toBe(2);
    expect(result.cost.vehicles).toBe(120);
    expect(result.metrics.makespan).toBe(53);
  });

  it("un vehículo sin pedidos no cuenta", () => {
    const result = valid(
      run(
        [
          ["A", [1, 2]],
          ["B", []],
        ],
        ["A", "B"],
      ),
    );
    expect(result.metrics.vehiclesUsed).toBe(1);
  });

  it("un pedido sin asignar es una falla", () => {
    const result = valid(run([["A", [1]]]));
    expect(result.unassigned).toEqual([2]);
    expect(result.cost.failures).toBe(200);
  });

  it("volver a cargar suma la vuelta y el tiempo de carga", () => {
    const result = valid(run([["A", [1, "DEPOSITO", 2]]]));
    expect(result.metrics.totalBlocks).toBe(5 + 5 + 8 + 8);
    expect(result.metrics.makespan).toBe(26 * 3 + 2 * 5 + 10);
  });
});

describe("pedidos premium (evento 1)", () => {
  const withPremium = [twoOrders[0], { ...twoOrders[1], premium: true }];

  it("suma los minutos desde la salida hasta que empieza cada entrega premium", () => {
    const plan = (stops: number[]): Plan => ({
      routes: [{ vehicle: "A", stops }],
    });
    const first = valid(simulate(scenario(withPremium, ["A"]), plan([2, 1])));
    const later = valid(simulate(scenario(withPremium, ["A"]), plan([1, 2])));
    expect(first.metrics.premiumMinutes).toBe(24);
    expect(later.metrics.premiumMinutes).toBe(29);
    expect(first.cost.premium).toBeLessThan(later.cost.premium);
  });

  it("el premium vacío en CSV es falso y el 1 es verdadero", () => {
    const orders = parseCsv("id;x;y;peso;premium\n1;2;3;10;\n2;5;3;5;1\n");
    const data = scenario(orders, ["A"]);
    expect(data.orders.map((order) => order.premium)).toEqual([false, true]);
  });

  it("lee el costo por minuto premium del mundo, con 1 por defecto", () => {
    expect(scenario(twoOrders, ["A"]).world.costs.perPremiumMinute).toBe(1);
    expect(
      scenario(twoOrders, ["A"], { costo_por_minuto_premium: "2,5" }).world
        .costs.perPremiumMinute,
    ).toBe(2.5);
  });
});

describe("validez", () => {
  it("un pedido repetido invalida el plan", () => {
    expect(
      run(
        [
          ["A", [1, 2]],
          ["B", [2]],
        ],
        ["A", "B"],
      ).valid,
    ).toBe(false);
  });

  it("un pedido inexistente invalida el plan", () => {
    expect(run([["A", [1, 2, 99]]]).valid).toBe(false);
  });

  it("un vehículo inexistente invalida el plan", () => {
    expect(run([["Z", [1, 2]]]).valid).toBe(false);
  });

  it("un vehículo repetido invalida el plan", () => {
    expect(
      run([
        ["A", [1]],
        ["A", [2]],
      ]).valid,
    ).toBe(false);
  });

  it.each([
    [[{ id: 1, x: 20, y: 0, peso: 1 }], "fuera de la grilla"],
    [
      [
        { id: 1, x: 1, y: 1, peso: 1 },
        { id: 1, x: 2, y: 2, peso: 1 },
      ],
      "id repetido",
    ],
    [[{ id: 1, x: 1, y: 1 }], "falta 'peso'"],
  ])("rechaza datos inválidos: %j", (orders, message) => {
    expect(() => scenario(orders, ["A"])).toThrow(DataError);
    expect(() => scenario(orders, ["A"])).toThrow(message);
  });

  it("lee todo del mundo, con valores por defecto si faltan", () => {
    const world = scenario(twoOrders, ["A"], {
      deposito_x: 7,
      costo_por_vehiculo: "",
    }).world;
    expect(world.depot).toEqual({ x: 7, y: 0 });
    expect(world.costs.perVehicle).toBe(60);
  });
});

describe("el ejemplo oficial", () => {
  // El evento 1 agregó pedidos premium al ejemplo: el mismo plan pasó de 1013 a 1124.
  it("el plan de ejemplo cuesta 1124, en JSON y en CSV", () => {
    for (const format of ["json", "csv"] as const) {
      const data = loadScenario("tests/cases/ejemplo-10", format);
      const result = valid(
        simulate(
          data,
          loadPlan(`tests/cases/ejemplo-10/plan_ejemplo.${format}`),
        ),
      );
      expect(result.cost.total).toBe(1124);
    }
  });
});

describe("lectura", () => {
  it("el .zip que baja la web se lee igual que la carpeta", () => {
    expect(loadScenario("tests/cases/practica-40.zip")).toEqual(
      loadScenario("tests/cases/practica-40"),
    );
  });

  it("JSON y CSV del mismo dataset dan lo mismo", () => {
    expect(loadScenario("tests/cases/practica-40", "csv")).toEqual(
      loadScenario("tests/cases/practica-40", "json"),
    );
  });
});
