import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const restrictImports = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const onlyFrom = (allowed, message) => ({
  regex: `^(?!${allowed.join("|")})`,
  message,
});

const browserOnly = {
  regex: "(^|/)cli(\\.ts)?$|^(node:)?(fs|path|child_process)$",
  message: "ui corre en el navegador: no importa el CLI ni Node.",
};

export default defineConfig(
  { ignores: ["dist/", "test-results/", "playwright-report/"] },
  { linterOptions: { noInlineConfig: true } },
  js.configs.recommended,
  tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "no-console": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "TSAsExpression[expression.type='TSAsExpression'][expression.typeAnnotation.type='TSUnknownKeyword']",
          message: "`as unknown as` esconde un error de tipos.",
        },
      ],
    },
  },
  {
    files: ["src/domain/**"],
    rules: restrictImports(
      onlyFrom(
        ["\\./"],
        "domain no importa nada: ni otros módulos ni librerías.",
      ),
    ),
  },
  {
    files: ["src/rules/**"],
    rules: restrictImports(
      onlyFrom(["\\./", "\\.\\./domain/"], "rules solo importa de domain."),
    ),
  },
  {
    files: ["src/planner/**"],
    rules: restrictImports(
      onlyFrom(
        ["\\./", "\\.\\./domain/", "\\.\\./rules/"],
        "planner solo importa de domain y rules.",
      ),
    ),
  },
  {
    files: ["src/io/**"],
    rules: restrictImports({
      regex: "^(\\.\\./(rules|planner|ui|cli)|@/)",
      message: "io solo importa de domain y de librerías.",
    }),
  },
  {
    files: ["src/ui/**"],
    rules: restrictImports(browserOnly),
  },
  {
    files: ["src/ui/components/**"],
    rules: restrictImports(browserOnly, {
      regex: "(^|/)(domain|rules|planner|io|features)(/|$)",
      message: "las primitivas no conocen la app: sin dominio ni features.",
    }),
  },
  {
    files: ["src/ui/**/*.tsx"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },
);
