import { useState } from "react";
import { cn } from "@/ui/components/cn.ts";
import { SlideFrame } from "@/ui/features/deck/deck.tsx";

const steps = [
  {
    video: "/videos/insercion.mp4",
    title: "Inserción más barata",
    what: "Cada pedido va donde menos sube el costo.",
    why: "Un plan válido en 0,01 s: siempre hay algo que entregar.",
    result: "941",
    detail: "punto de partida",
  },
  {
    video: "/videos/recocido.mp4",
    title: "Recocido simulado",
    what: "Millones de cambios chicos: mover o intercambiar pedidos.",
    why: "La inserción no se corrige; aceptar empeorar evita trabarse.",
    result: "913",
    detail: "−28 en 6 s",
  },
  {
    video: "/videos/ruina.mp4",
    title: "Ruina y recreación",
    what: "Vacía una camioneta o una zona y reinserta sus pedidos.",
    why: "Con cambios chicos no cerraba camionetas: hasta 4,9 % arriba.",
    result: "0 %",
    detail: "peor caso, era 4,9 %",
  },
];

// Los videos duran unos 30 s; al doble entran en el tiempo de la diapositiva.
const PLAYBACK_RATE = 2;

export function Method() {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  if (!step) throw new Error(`no hay paso ${current}`);
  return (
    <SlideFrame
      title="Cómo lo resolvemos"
      lead="Cada paso arregla un problema que medimos en el anterior."
    >
      <div className="flex h-full gap-8">
        <ol className="flex basis-2/3 flex-col gap-3">
          {steps.map((item, index) => (
            <li key={item.title} className="flex-1">
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-pressed={current === index}
                className={cn(
                  "flex h-full w-full items-center gap-6 rounded-card border px-5 py-3 text-left transition-colors",
                  current === index
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface hover:bg-subtle",
                )}
              >
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-slide font-medium text-fg">
                    {index + 1}. {item.title}
                  </span>
                  <span className="flex gap-3 text-card">
                    <span className="w-20 shrink-0 whitespace-nowrap text-fg-3">
                      qué hace
                    </span>
                    <span className="text-fg-2">{item.what}</span>
                  </span>
                  <span className="flex gap-3 text-card">
                    <span className="w-20 shrink-0 whitespace-nowrap text-fg-3">
                      por qué
                    </span>
                    <span className="text-fg-2">{item.why}</span>
                  </span>
                </span>
                <span className="flex w-32 shrink-0 flex-col items-end">
                  <span className="text-title font-medium text-fg tabular-nums">
                    {item.result}
                  </span>
                  <span className="text-body whitespace-nowrap text-fg-3">
                    {item.detail}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <figure className="flex min-h-0 flex-1 flex-col gap-2">
          <video
            key={step.video}
            src={step.video}
            autoPlay
            muted
            loop
            playsInline
            onLoadedMetadata={(event) => {
              event.currentTarget.playbackRate = PLAYBACK_RATE;
            }}
            className="min-h-0 flex-1 rounded-card border border-border bg-surface object-contain"
          />
          <figcaption className="text-label text-fg-3">
            Ilustración con puntos al azar.
          </figcaption>
        </figure>
      </div>
    </SlideFrame>
  );
}
