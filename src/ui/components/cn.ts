import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Sin esto, tailwind-merge toma `text-body` por un color y lo descarta al lado de `text-fg`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "metric",
        "page",
        "card",
        "body",
        "label",
        "hero",
        "title",
        "lead",
        "slide",
      ],
      radius: ["checkbox", "control", "card"],
      shadow: ["card", "float"],
      spacing: ["control", "row"],
    },
  },
});

export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
