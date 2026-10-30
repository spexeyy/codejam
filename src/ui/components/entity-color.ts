// Clases completas y literales: Tailwind solo genera las que encuentra escritas en el código.
const palette = [
  { solid: "bg-entity-1", soft: "bg-entity-1-soft", token: "--color-entity-1" },
  { solid: "bg-entity-2", soft: "bg-entity-2-soft", token: "--color-entity-2" },
  { solid: "bg-entity-3", soft: "bg-entity-3-soft", token: "--color-entity-3" },
  { solid: "bg-entity-4", soft: "bg-entity-4-soft", token: "--color-entity-4" },
  { solid: "bg-entity-5", soft: "bg-entity-5-soft", token: "--color-entity-5" },
  { solid: "bg-entity-6", soft: "bg-entity-6-soft", token: "--color-entity-6" },
  { solid: "bg-entity-7", soft: "bg-entity-7-soft", token: "--color-entity-7" },
  { solid: "bg-entity-8", soft: "bg-entity-8-soft", token: "--color-entity-8" },
] as const;

export type EntityColor = (typeof palette)[number];

// Cada entidad principal (vehículo, camión, operario) usa el mismo color en todas las vistas.
export function entityColor(index: number): EntityColor {
  return palette[index % palette.length] ?? palette[0];
}

export function cssColor(token: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
}
