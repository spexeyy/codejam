import { pick, seeded } from "./random.ts";
import type { Order, Scenario, World } from "./types.ts";

export type GeneratorOptions = {
  orders: number;
  vehicles: number;
  seed: number;
  world?: Partial<World>;
};

export const baseWorld: World = {
  width: 20,
  height: 20,
  depot: { x: 0, y: 0 },
  departure: 8 * 60,
  serviceMinutes: 5,
  reloadMinutes: 10,
  minutesPerBlock: 3,
  costs: { perBlock: 3, perVehicle: 60, perMinute: 1, perFailure: 200 },
};

// Generamos datasets parecidos a los de evaluación para probar con casos que no vimos. El
// depósito va en cualquier lugar porque el enunciado avisa que puede moverse.
export function generateScenario(options: GeneratorOptions): Scenario {
  const random = seeded(options.seed);
  const base = { ...baseWorld, ...options.world };
  const world: World = {
    ...base,
    depot: options.world?.depot ?? {
      x: pick(random, base.width),
      y: pick(random, base.height),
    },
  };
  const orders: Order[] = Array.from(
    { length: options.orders },
    (_, index) => ({
      id: index + 1,
      position: { x: pick(random, world.width), y: pick(random, world.height) },
      weight: 1 + pick(random, 20),
    }),
  );
  const vehicles = Array.from({ length: options.vehicles }, (_, index) => ({
    id: `V${index + 1}`,
    minutesPerBlock: world.minutesPerBlock,
    fixedCost: world.costs.perVehicle,
  }));
  return { world, orders, vehicles };
}
