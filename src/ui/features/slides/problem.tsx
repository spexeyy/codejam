import { motion } from "motion/react";
import { toClock } from "@/domain/clock.ts";
import { SlideFrame } from "@/ui/features/deck/deck.tsx";
import { practice } from "@/ui/features/plan/datasets.ts";
import { RouteGrid } from "@/ui/features/plan/route-grid.tsx";

const { world, orders, vehicles } = practice;
const { costs } = world;

const facts = [
  { value: String(orders.length), label: "pedidos" },
  { value: String(vehicles.length), label: "camionetas" },
  { value: `${world.width} × ${world.height}`, label: "cuadras" },
];

const prices = [
  { value: costs.perBlock, label: "por cada cuadra recorrida" },
  { value: costs.perVehicle, label: "por cada camioneta que sale" },
  { value: costs.perMinute, label: "por minuto hasta que vuelve la última" },
  { value: costs.perFailure, label: "por cada pedido que no se entrega" },
];

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] as const },
});

export function Problem() {
  return (
    <SlideFrame title="El problema">
      <div className="flex h-full gap-14">
        <RouteGrid scenario={practice} size={500} reveal />
        <div className="flex flex-1 flex-col gap-7">
          <div className="flex gap-10">
            {facts.map((fact, index) => (
              <motion.div key={fact.label} {...enter(0.15 + index * 0.1)}>
                <p className="text-title font-medium text-fg tabular-nums">
                  {fact.value}
                </p>
                <p className="text-slide text-fg-3">{fact.label}</p>
              </motion.div>
            ))}
          </div>
          <motion.p className="text-slide text-fg-2" {...enter(0.5)}>
            Todas salen del depósito (D) a las {toClock(world.departure)} y
            vuelven a él. El simulador oficial cobra:
          </motion.p>
          <div className="grid grid-cols-2 gap-3">
            {prices.map((price, index) => (
              <motion.div
                key={price.label}
                className="flex flex-col gap-1 rounded-card border border-border bg-surface px-5 py-4 shadow-card"
                {...enter(0.7 + index * 0.15)}
              >
                <span className="text-title font-medium text-fg tabular-nums">
                  {price.value}
                </span>
                <span className="text-body text-fg-2">{price.label}</span>
              </motion.div>
            ))}
          </div>
          <motion.p className="text-lead text-fg" {...enter(1.5)}>
            El dilema: más camionetas terminan antes,{" "}
            <span className="text-fg-3">
              pero cada una cuesta {costs.perVehicle} y suma kilómetros.
            </span>
          </motion.p>
        </div>
      </div>
    </SlideFrame>
  );
}
