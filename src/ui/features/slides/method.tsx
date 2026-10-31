import { useState } from "react";
import { cn } from "@/ui/components/cn.ts";
import { SlideFrame } from "@/ui/features/deck/deck.tsx";

const steps = [
  {
    video: "/videos/insercion.mp4",
    title: "Inserción más barata",
    what: "Pone cada pedido donde menos sube el costo.",
    gain: "Un plan válido en 0,01 s.",
    cost: "No corrige lo que decidió: queda 6,5 % arriba del mejor.",
    result: "941",
    detail: "punto de partida",
  },
  {
    video: "/videos/recocido.mp4",
    title: "Recocido simulado",
    what: "Millones de cambios chicos; acepta empeorar para no trabarse.",
    gain: "Baja de 941 a 913 en la práctica.",
    cost: "Hasta 4,9 % arriba del mejor, aun con 5 veces más tiempo.",
    result: "913",
    detail: "−28 en la práctica",
  },
  {
    video: "/videos/ruina.mp4",
    title: "Ruina y recreación",
    what: "Vacía una camioneta o una zona y reubica sus pedidos.",
    gain: "Llega al mejor plan en los 20 escenarios de prueba.",
    cost: "Tarda 6 s en vez de 1,8 s; en cada entrega hay minutos.",
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
      <div className="flex h-full gap-6">
        <ol className="flex flex-1 flex-col gap-3">
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
                  {(
                    [
                      ["qué hace", item.what],
                      ["qué logra", item.gain],
                      ["qué cuesta", item.cost],
                    ] as const
                  ).map(([label, text]) => (
                    <span key={label} className="flex gap-3 text-card">
                      <span className="w-24 shrink-0 whitespace-nowrap text-fg-3">
                        {label}
                      </span>
                      <span className="text-fg-2">{text}</span>
                    </span>
                  ))}
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
        <figure className="flex w-96 shrink-0 flex-col justify-center gap-2 bg-main">
          {/* Los videos traen fondo claro y un borde de 1 px: el darken los funde con la
              diapositiva y la escala esconde el borde. */}
          <div className="overflow-hidden">
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
              className="w-full scale-102 mix-blend-darken"
            />
          </div>
          <figcaption className="text-label text-fg-3">
            Ilustración con puntos al azar.
          </figcaption>
        </figure>
      </div>
    </SlideFrame>
  );
}
