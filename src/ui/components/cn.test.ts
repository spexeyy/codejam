import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { cn } from "./cn.ts";

const sizes = ["metric", "page", "card", "body", "label"];
const colors = ["fg", "fg-2", "fg-3", "fg-4", "accent-text", "ok-text"];

describe("cn", () => {
  it("conserva un tamaño y un color de texto juntos", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...sizes),
        fc.constantFrom(...colors),
        (size, color) => {
          expect(cn(`text-${size}`, `text-${color}`)).toBe(
            `text-${size} text-${color}`,
          );
        },
      ),
    );
  });

  it("ante dos tamaños gana el último", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...sizes),
        fc.constantFrom(...sizes),
        (first, last) => {
          expect(cn(`text-${first}`, `text-${last}`)).toBe(`text-${last}`);
        },
      ),
    );
  });

  it("resuelve los radios y alturas propios como cualquier otro", () => {
    expect(cn("h-control rounded-control", "h-row rounded-card")).toBe(
      "h-row rounded-card",
    );
  });
});
