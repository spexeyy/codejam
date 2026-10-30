import { RELOAD, type Plan, type Stop } from "../domain/types.ts";
import { DataError, parseCsv } from "./scenario.ts";

export function planToJson(plan: Plan): string {
  const rutas = plan.routes.map((route) => ({
    vehiculo: route.vehicle,
    paradas: route.stops,
  }));
  return `${JSON.stringify({ rutas }, null, 2)}\n`;
}

export function planToCsv(plan: Plan): string {
  const rows = plan.routes.flatMap((route) =>
    route.stops.map((stop) => `${route.vehicle},${stop}`),
  );
  return ["vehiculo,parada", ...rows, ""].join("\n");
}

function parseStop(value: unknown, where: string): Stop {
  if (typeof value === "string" && value.trim().toUpperCase() === RELOAD)
    return RELOAD;
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^[+-]?\d+$/.test(value.trim()))
    return Number(value.trim());
  throw new DataError(
    `${where}: parada inválida ${JSON.stringify(value)} (se espera id de pedido o ${RELOAD})`,
  );
}

export function planFromJson(text: string): Plan {
  const raw: unknown = JSON.parse(text.replace(/^\uFEFF/, ""));
  const rutas =
    typeof raw === "object" && raw !== null
      ? (raw as { rutas?: unknown }).rutas
      : undefined;
  if (!Array.isArray(rutas))
    throw new DataError("el plan debe ser un objeto con una lista 'rutas'");
  return {
    routes: rutas.map((entry: unknown, index) => {
      const route = (
        typeof entry === "object" && entry !== null ? entry : {}
      ) as { vehiculo?: unknown; paradas?: unknown };
      if (
        route.vehiculo === undefined ||
        String(route.vehiculo).trim() === ""
      ) {
        throw new DataError(`ruta ${index + 1}: falta 'vehiculo'`);
      }
      const vehicle = String(route.vehiculo).trim();
      const stops = route.paradas === undefined ? [] : route.paradas;
      if (!Array.isArray(stops))
        throw new DataError(`ruta ${index + 1}: 'paradas' debe ser una lista`);
      return {
        vehicle,
        stops: stops.map((stop: unknown) =>
          parseStop(stop, `ruta ${index + 1} (${vehicle})`),
        ),
      };
    }),
  };
}

export function planFromCsv(text: string): Plan {
  const routes = new Map<string, Stop[]>();
  parseCsv(text).forEach((row, index) => {
    const vehicle = String(row.vehiculo ?? "").trim();
    const stop = String(row.parada ?? "").trim();
    if (vehicle === "" || stop === "")
      throw new DataError(
        `plan CSV, fila ${index + 2}: faltan 'vehiculo' o 'parada'`,
      );
    const stops = routes.get(vehicle) ?? [];
    stops.push(parseStop(stop, `plan CSV, fila ${index + 2}`));
    routes.set(vehicle, stops);
  });
  return {
    routes: [...routes].map(([vehicle, stops]) => ({ vehicle, stops })),
  };
}
