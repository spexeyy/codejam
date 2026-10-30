// No usamos Math.random: con mulberry32 y una semilla fija, el mismo dataset da siempre el mismo
// plan, y eso nos deja testear y reproducir cualquier entrega.
export type Random = () => number;

export function seeded(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (random: Random, size: number) =>
  Math.floor(random() * size);
