import { motion } from "motion/react";
import { cn } from "@/ui/components/cn.ts";
import { SlideFrame } from "@/ui/features/deck/deck.tsx";

// Los números salen de docs/benchmarks.md: 20 escenarios generados como los de evaluación
// (40 pedidos, 5 camionetas, depósito en cualquier lugar), todos medidos con el simulador.
const versions = [
  { label: "Inserción más barata", gap: 6.5, seconds: "0,01 s" },
  { label: "Recocido, primera versión", gap: 1.05, seconds: "1,8 s" },
  { label: "OR-Tools de Google", gap: 0.23, seconds: "10 s" },
  {
    label: "Recocido + ruina y recreación",
    gap: 0,
    seconds: "6 s",
    ours: true,
  },
];

const percent = (value: number) => `${value.toFixed(2).replace(".", ",")} %`;

export function Benchmark() {
  return (
    <SlideFrame
      title="¿Qué tan bueno es?"
      lead="Lo medimos en 20 escenarios nuevos, del tamaño de los de evaluación, contra la mejor solución que encontró cualquier método."
    >
      <div className="flex gap-16">
        <div className="flex flex-1 flex-col gap-5">
          <p className="text-slide text-fg-3">
            cuánto más caro que la mejor solución, en promedio
          </p>
          {versions.map((version, index) => (
            <div key={version.label} className="flex items-center gap-5">
              <span
                className={cn(
                  "w-80 text-slide",
                  version.ours ? "font-medium text-fg" : "text-fg-2",
                )}
              >
                {version.label}
              </span>
              <div className="h-3 flex-1 rounded-full bg-fill">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    version.ours ? "bg-accent" : "bg-fg-4",
                  )}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(version.gap / 6.5, 0.01) * 100}%`,
                  }}
                  transition={{
                    delay: 0.3 + index * 0.2,
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                />
              </div>
              <span className="w-24 text-right text-slide text-fg tabular-nums">
                {percent(version.gap)}
              </span>
              <span className="w-16 text-right text-body text-fg-3 tabular-nums">
                {version.seconds}
              </span>
            </div>
          ))}
        </div>
        <div className="flex w-96 flex-col gap-6">
          <div>
            <p className="text-hero font-medium text-fg tabular-nums">
              20 de 20
            </p>
            <p className="text-slide text-fg-2">
              escenarios donde ningún método encontró algo más barato
            </p>
          </div>
          <div>
            <p className="text-title font-medium text-fg tabular-nums">
              6 · 14 · 0
            </p>
            <p className="text-slide text-fg-2">
              contra OR-Tools: le ganamos, empatamos, perdimos
            </p>
          </div>
          <div>
            <p className="text-title font-medium text-fg tabular-nums">
              767 a 913
            </p>
            <p className="text-slide text-fg-2">
              dónde está el óptimo de la práctica; el piso está demostrado
            </p>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}
