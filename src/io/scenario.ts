import { toClock, toMinutes } from "../domain/clock.ts";
import { contains } from "../domain/grid.ts";
import {
  RELOAD,
  type Order,
  type Scenario,
  type Vehicle,
  type World,
} from "../domain/types.ts";

// Leemos los datos igual que quickdrop/cargar.py: un campo vacío toma el valor por defecto, los
// campos que no conocemos se ignoran y cada error dice qué campo falló. Así un dataset que el
// simulador acepta, nosotros también lo aceptamos.

export class DataError extends Error {}

type Row = Record<string, unknown>;

const isEmpty = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "");

function integer(value: unknown, where: string): number {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^[+-]?\d+$/.test(value.trim()))
    return Number(value.trim());
  throw new DataError(
    `${where}: se esperaba un entero y vino ${JSON.stringify(value)}`,
  );
}

function decimal(value: unknown, where: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    if (value.trim() !== "" && Number.isFinite(parsed)) return parsed;
  }
  throw new DataError(
    `${where}: se esperaba un número y vino ${JSON.stringify(value)}`,
  );
}

// Como _booleano de cargar.py: en CSV vienen 1/0, true/false o si/no.
function flag(value: unknown, where: string): boolean {
  if (typeof value === "boolean") return value;
  if (value === 0 || value === 1) return value === 1;
  const text = String(value).trim().toLowerCase();
  if (["1", "true", "si", "sí", "verdadero"].includes(text)) return true;
  if (["0", "false", "no", "falso"].includes(text)) return false;
  throw new DataError(
    `${where}: se esperaba un booleano (1/0) y vino ${JSON.stringify(value)}`,
  );
}

function clock(value: unknown, where: string): number {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  try {
    return toMinutes(String(value));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new DataError(`${where}: ${reason}`, { cause: error });
  }
}

const worldFields = {
  grilla_ancho: [integer, 20],
  grilla_alto: [integer, 20],
  deposito_x: [integer, 0],
  deposito_y: [integer, 0],
  hora_salida: [clock, "08:00"],
  tiempo_servicio: [integer, 5],
  tiempo_carga: [integer, 10],
  min_por_cuadra: [integer, 3],
  costo_por_cuadra: [decimal, 3],
  costo_por_vehiculo: [decimal, 60],
  costo_por_minuto_total: [decimal, 1],
  costo_por_falla: [decimal, 200],
  costo_por_minuto_premium: [decimal, 1],
} as const;

type WorldField = keyof typeof worldFields;

export function parseWorld(raw: unknown): World {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new DataError("mundo: se esperaba un objeto con claves");
  }
  const row = raw as Row;
  const read = (key: WorldField) => {
    const [parse, fallback] = worldFields[key];
    const value = isEmpty(row[key]) ? fallback : row[key];
    return parse(value, `mundo.${key}`);
  };
  const world: World = {
    width: read("grilla_ancho"),
    height: read("grilla_alto"),
    depot: { x: read("deposito_x"), y: read("deposito_y") },
    departure: read("hora_salida"),
    serviceMinutes: read("tiempo_servicio"),
    reloadMinutes: read("tiempo_carga"),
    minutesPerBlock: read("min_por_cuadra"),
    costs: {
      perBlock: read("costo_por_cuadra"),
      perVehicle: read("costo_por_vehiculo"),
      perMinute: read("costo_por_minuto_total"),
      perFailure: read("costo_por_falla"),
      perPremiumMinute: read("costo_por_minuto_premium"),
    },
  };
  if (world.width <= 0 || world.height <= 0)
    throw new DataError("mundo: la grilla debe tener tamaño positivo");
  if (!contains(world.width, world.height, world.depot))
    throw new DataError("mundo: el depósito está fuera de la grilla");
  if (
    world.minutesPerBlock <= 0 ||
    world.serviceMinutes < 0 ||
    world.reloadMinutes < 0
  ) {
    throw new DataError("mundo: tiempos inválidos");
  }
  return world;
}

export function parseOrders(raw: unknown, world: World): Order[] {
  if (!Array.isArray(raw))
    throw new DataError("pedidos: se esperaba una lista");
  const seen = new Set<number>();
  return raw.map((entry: unknown, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new DataError(
        `pedidos, elemento ${index + 1}: se esperaba un objeto`,
      );
    }
    const row = entry as Row;
    for (const key of ["id", "x", "y", "peso"]) {
      if (isEmpty(row[key]))
        throw new DataError(`pedidos, elemento ${index + 1}: falta '${key}'`);
    }
    const id = integer(row.id, `pedidos, elemento ${index + 1}, id`);
    const where = `pedido ${id}`;
    const position = {
      x: integer(row.x, `${where}, x`),
      y: integer(row.y, `${where}, y`),
    };
    const weight = integer(row.peso, `${where}, peso`);
    const premium = isEmpty(row.premium)
      ? false
      : flag(row.premium, `${where}, premium`);
    if (seen.has(id)) throw new DataError(`${where}: id repetido`);
    if (!contains(world.width, world.height, position)) {
      throw new DataError(
        `${where}: (${position.x},${position.y}) está fuera de la grilla`,
      );
    }
    if (weight < 0) throw new DataError(`${where}: peso negativo`);
    seen.add(id);
    return { id, position, weight, premium };
  });
}

export function parseVehicles(raw: unknown, world: World): Vehicle[] {
  if (!Array.isArray(raw))
    throw new DataError("vehiculos: se esperaba una lista");
  const seen = new Set<string>();
  return raw.map((entry: unknown, index) => {
    const row = (
      typeof entry === "object" && entry !== null ? entry : {}
    ) as Row;
    if (isEmpty(row.id))
      throw new DataError(`vehiculos, elemento ${index + 1}: falta 'id'`);
    const id = String(row.id).trim();
    if (seen.has(id)) throw new DataError(`vehículo ${id}: id repetido`);
    if (id.toUpperCase() === RELOAD) {
      throw new DataError(
        `vehículo ${id}: '${RELOAD}' no puede usarse como id de vehículo`,
      );
    }
    seen.add(id);
    return {
      id,
      minutesPerBlock: world.minutesPerBlock,
      fixedCost: world.costs.perVehicle,
    };
  });
}

export function parseCsv(text: string): Row[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const first = lines[0] ?? "";
  const separator = first.includes(";") && !first.includes(",") ? ";" : ",";
  const headers = first.split(separator).map((header) => header.trim());
  return lines
    .slice(1)
    .map((line) => line.split(separator).map((cell) => cell.trim()))
    .filter((cells) => cells.some((cell) => cell !== ""))
    .map((cells) =>
      Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ""])),
    );
}

export function worldFromCsv(text: string): unknown {
  const rows = parseCsv(text);
  const [head] = rows;
  if (head && !("clave" in head && "valor" in head)) {
    throw new DataError("mundo.csv: se esperan las columnas 'clave,valor'");
  }
  return Object.fromEntries(rows.map((row) => [String(row.clave), row.valor]));
}

export type RawScenario = {
  world: unknown;
  orders: unknown;
  vehicles: unknown;
};

export function parseScenario(raw: RawScenario): Scenario {
  const world = parseWorld(raw.world);
  return {
    world,
    orders: parseOrders(raw.orders, world),
    vehicles: parseVehicles(raw.vehicles, world),
  };
}

// El camino inverso: lo usamos para escribir datasets generados y pasárselos al simulador oficial.
export function scenarioToRaw(scenario: Scenario): {
  world: Record<string, number | string>;
  orders: Record<string, number | boolean>[];
  vehicles: Record<string, string>[];
} {
  const { world } = scenario;
  return {
    world: {
      grilla_ancho: world.width,
      grilla_alto: world.height,
      deposito_x: world.depot.x,
      deposito_y: world.depot.y,
      hora_salida: toClock(world.departure),
      tiempo_servicio: world.serviceMinutes,
      tiempo_carga: world.reloadMinutes,
      min_por_cuadra: world.minutesPerBlock,
      costo_por_cuadra: world.costs.perBlock,
      costo_por_vehiculo: world.costs.perVehicle,
      costo_por_minuto_total: world.costs.perMinute,
      costo_por_falla: world.costs.perFailure,
      costo_por_minuto_premium: world.costs.perPremiumMinute,
    },
    orders: scenario.orders.map((order) => ({
      id: order.id,
      x: order.position.x,
      y: order.position.y,
      peso: order.weight,
      premium: order.premium,
    })),
    vehicles: scenario.vehicles.map((vehicle) => ({ id: vehicle.id })),
  };
}
