import { motion } from "motion/react";
import { simulate } from "@/domain/simulate.ts";
import { createEvaluator, toPlan } from "@/planner/evaluation.ts";
import { sweepFleet } from "@/planner/insertion.ts";
import { cn } from "@/ui/components/cn.ts";
import { SlideFrame } from "@/ui/features/deck/deck.tsx";
import { practice } from "@/ui/features/plan/datasets.ts";

// Para cada cantidad de camionetas, el plan de la inserción y su costo desglosado. Así se ve
// por qué el total tiene forma de U: el costo fijo y la distancia suben, la jornada baja.
const sizes = sweepFleet(createEvaluator(practice)).starts.map((solution) => {
  const simulation = simulate(practice, toPlan(practice, solution));
  if (!simulation.valid) throw new Error(simulation.errors.join("; "));
  return { count: simulation.metrics.vehiclesUsed, ...simulation.cost };
});
const cheapest = sizes.reduce((best, size) =>
  size.total < best.total ? size : best,
);
const tallest = Math.max(...sizes.map((size) => size.total));

const parts = [
  { key: "time", label: "jornada (makespan)", fill: "bg-fg-3" },
  { key: "distance", label: "cuadras recorridas", fill: "bg-fg-4" },
  { key: "vehicles", label: "costo fijo de las camionetas", fill: "bg-border" },
] as const;

export function Fleet() {
  return (
    <SlideFrame
      title="¿Cuántas camionetas sacar?"
      lead={`Más camionetas terminan antes, pero cada una suma costo fijo y kilómetros. Con esta práctica conviene sacar ${cheapest.count} de ${practice.vehicles.length}.`}
    >
      <div className="flex h-full items-end gap-16">
        <div className="flex h-full flex-1 items-end gap-8 pb-10">
          {sizes.map((size, index) => (
            <div
              key={size.count}
              className="flex h-full flex-1 flex-col justify-end gap-3"
            >
              <p
                className={cn(
                  "text-center text-title font-medium tabular-nums",
                  size === cheapest ? "text-accent-text" : "text-fg-3",
                )}
              >
                {size.total}
              </p>
              <motion.div
                className={cn(
                  "flex flex-col-reverse overflow-hidden rounded-control",
                  size === cheapest &&
                    "outline-2 outline-offset-4 outline-accent",
                )}
                initial={{ height: 0 }}
                animate={{ height: `${(size.total / tallest) * 72}%` }}
                transition={{
                  delay: 0.2 + index * 0.15,
                  duration: 0.6,
                  ease: "easeOut",
                }}
              >
                {parts.map((part) => (
                  <div
                    key={part.key}
                    className={part.fill}
                    style={{
                      height: `${(size[part.key] / size.total) * 100}%`,
                    }}
                  />
                ))}
              </motion.div>
              <p className="text-center text-slide text-fg-2">
                {size.count} {size.count === 1 ? "camioneta" : "camionetas"}
              </p>
            </div>
          ))}
        </div>
        <ul className="flex w-80 flex-col gap-4 pb-24 text-slide text-fg-2">
          {parts.map((part) => (
            <li key={part.key} className="flex items-center gap-3">
              <span className={cn("size-4 rounded-checkbox", part.fill)} />
              {part.label}
            </li>
          ))}
          <li className="mt-4 text-body text-fg-3">
            Cada barra es el mejor plan de la inserción con exactamente esa
            cantidad. El recocido, con las {practice.vehicles.length}{" "}
            disponibles, también elige {cheapest.count}.
          </li>
        </ul>
      </div>
    </SlideFrame>
  );
}
