import { useState } from "react";
import { cn } from "@/ui/components/cn.ts";
import { SlideFrame } from "@/ui/features/deck/deck.tsx";

const steps = [
  {
    video: "/videos/insercion.mp4",
    title: "Inserción más barata",
    text: "Cada pedido va donde menos sube el costo.",
    result: "941",
    detail: "en 0,01 s",
  },
  {
    video: "/videos/recocido.mp4",
    title: "Recocido simulado",
    text: "Millones de cambios; a veces acepta empeorar para no trabarse.",
    result: "913",
    detail: "en 6 s",
  },
  {
    video: "/videos/ruina.mp4",
    title: "Ruina y recreación",
    text: "Vacía una zona entera y la rearma.",
    result: "0 %",
    detail: "peor caso (era 4,9 %)",
  },
];

// Los videos duran unos 30 s; al doble entran en el tiempo de la diapositiva.
const PLAYBACK_RATE = 2;

export function Method() {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  if (!step) throw new Error(`no hay paso ${current}`);
  return (
    <SlideFrame title="Cómo lo resolvemos">
      <div className="flex h-full gap-10">
        <ol className="flex w-112 flex-col gap-3 pb-6">
          {steps.map((item, index) => (
            <li key={item.title} className="flex-1">
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-pressed={current === index}
                className={cn(
                  "flex h-full w-full items-center gap-5 rounded-card border px-5 py-4 text-left transition-colors",
                  current === index
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface hover:bg-subtle",
                )}
              >
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-lead font-medium text-fg">
                    {index + 1}. {item.title}
                  </span>
                  <span className="text-slide text-fg-2">{item.text}</span>
                </span>
                <span className="flex flex-col items-end">
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
