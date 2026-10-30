import type { Point } from "./types.ts";

// La ciudad es una grilla, así que la distancia es Manhattan (en cuadras). La definimos solo
// acá: si un evento cambia cómo se mide, se toca una función.
export function blocks(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function contains(width: number, height: number, p: Point): boolean {
  return p.x >= 0 && p.x < width && p.y >= 0 && p.y < height;
}
