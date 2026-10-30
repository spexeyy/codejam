import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint();

async function importErrors(filePath: string, source: string) {
  const [report] = await eslint.lintText(`${source}\n`, { filePath });
  return (report?.messages ?? []).filter(
    (message) => message.ruleId === "no-restricted-imports",
  );
}

const forbidden: [string, string][] = [
  ["src/domain/plan.ts", 'import "../io/output.ts";'],
  ["src/domain/plan.ts", 'import "../rules/capacity.ts";'],
  ["src/domain/plan.ts", 'import "fs";'],
  ["src/domain/plan.ts", 'import "node:fs";'],
  ["src/domain/plan.ts", 'import "zod";'],
  ["src/domain/plan.ts", 'import "@/ui/components/cn.ts";'],
  ["src/rules/capacity.ts", 'import "../planner/greedy.ts";'],
  ["src/rules/capacity.ts", 'import "../io/output.ts";'],
  ["src/rules/capacity.ts", 'import "../cli.ts";'],
  ["src/planner/greedy.ts", 'import "../io/output.ts";'],
  ["src/planner/greedy.ts", 'import "../ui/app.tsx";'],
  ["src/io/output.ts", 'import "../planner/greedy.ts";'],
  ["src/io/output.ts", 'import "../ui/app.tsx";'],
  ["src/ui/features/result/result.tsx", 'import "@/cli.ts";'],
  ["src/ui/features/result/result.tsx", 'import "node:fs";'],
  ["src/ui/components/button.tsx", 'import "@/domain/types.ts";'],
  ["src/ui/components/button.tsx", 'import "../features/shell/app-shell.tsx";'],
];

const allowed: [string, string][] = [
  ["src/domain/plan.ts", 'import "./types.ts";'],
  ["src/rules/capacity.ts", 'import "../domain/types.ts";'],
  ["src/planner/greedy.ts", 'import "../rules/capacity.ts";'],
  ["src/planner/greedy.ts", 'import "../domain/types.ts";'],
  ["src/io/output.ts", 'import "../domain/types.ts";'],
  ["src/io/output.ts", 'import "zod";'],
  ["src/cli.ts", 'import "./planner/greedy.ts";'],
  ["src/ui/features/result/result.tsx", 'import "@/planner/greedy.ts";'],
  ["src/ui/components/button.tsx", 'import "./cn.ts";'],
];

describe("regla de arquitectura", () => {
  it.each(forbidden)("%s no puede hacer %s", async (filePath, source) => {
    expect(await importErrors(filePath, source)).toHaveLength(1);
  });

  it.each(allowed)("%s puede hacer %s", async (filePath, source) => {
    expect(await importErrors(filePath, source)).toHaveLength(0);
  });
});
