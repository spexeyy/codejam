import {
  existsSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { inflateRawSync } from "node:zlib";
import type { Plan, Scenario } from "../domain/types.ts";
import { planFromCsv, planFromJson, planToCsv, planToJson } from "./plan.ts";
import {
  DataError,
  parseCsv,
  parseScenario,
  worldFromCsv,
} from "./scenario.ts";

export type Format = "json" | "csv";

// Igual que el simulador oficial: si no se pide un formato, preferimos JSON y si no hay, CSV.
function pick(
  folder: string,
  name: string,
  format?: Format,
): { path: string; format: Format } | undefined {
  for (const ext of format ? [format] : (["json", "csv"] as const)) {
    const path = join(folder, `${name}.${ext}`);
    if (existsSync(path)) return { path, format: ext };
  }
  return undefined;
}

function read(
  file: { path: string; format: Format },
  csv: (text: string) => unknown,
): unknown {
  const text = readFileSync(file.path, "utf8");
  if (file.format === "csv") return csv(text);
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new DataError(`${file.path}: JSON inválido`, { cause: error });
  }
}

const datasetFiles = new Set(
  ["mundo", "pedidos", "vehiculos"].flatMap((name) => [
    `${name}.json`,
    `${name}.csv`,
  ]),
);

// La web entrega cada dataset en un .zip. Lo leemos directo (directorio central del formato ZIP,
// archivos guardados o comprimidos con deflate) para que una entrega sea un solo comando.
function unzipDataset(path: string): string {
  const zip = readFileSync(path);
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new DataError(`${path}: no es un .zip válido`);
  const folder = mkdtempSync(join(tmpdir(), "quickdrop-"));
  let entry = zip.readUInt32LE(end + 16);
  for (let index = 0; index < zip.readUInt16LE(end + 10); index++) {
    const method = zip.readUInt16LE(entry + 10);
    const size = zip.readUInt32LE(entry + 20);
    const nameLength = zip.readUInt16LE(entry + 28);
    const skip =
      nameLength + zip.readUInt16LE(entry + 30) + zip.readUInt16LE(entry + 32);
    const name = basename(
      zip
        .toString("utf8", entry + 46, entry + 46 + nameLength)
        .replaceAll("\\", "/"),
    );
    const local = zip.readUInt32LE(entry + 42);
    const start =
      local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const body = zip.subarray(start, start + size);
    if (datasetFiles.has(name)) {
      writeFileSync(
        join(folder, name),
        method === 8 ? inflateRawSync(body) : body,
      );
    }
    entry += 46 + skip;
  }
  return folder;
}

export function loadScenario(path: string, format?: Format): Scenario {
  const folder = path.toLowerCase().endsWith(".zip")
    ? unzipDataset(path)
    : path;
  if (!existsSync(folder) || !statSync(folder).isDirectory()) {
    throw new DataError(`no existe la carpeta de datos: ${folder}`);
  }
  const worldFile = pick(folder, "mundo", format);
  const required = (name: string) => {
    const file = pick(folder, name, format);
    if (!file)
      throw new DataError(`falta ${name}.json o ${name}.csv en ${folder}`);
    return read(file, parseCsv);
  };
  return parseScenario({
    world: worldFile ? read(worldFile, worldFromCsv) : {},
    orders: required("pedidos"),
    vehicles: required("vehiculos"),
  });
}

export function loadPlan(path: string): Plan {
  const text = readFileSync(path, "utf8");
  return path.toLowerCase().endsWith(".csv")
    ? planFromCsv(text)
    : planFromJson(text);
}

export function writePlan(path: string, plan: Plan): void {
  writeFileSync(
    path,
    path.toLowerCase().endsWith(".csv") ? planToCsv(plan) : planToJson(plan),
  );
}
