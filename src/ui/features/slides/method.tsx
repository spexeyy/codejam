import { useState } from "react";
import { cn } from "@/ui/components/cn.ts";
import { SlideFrame } from "@/ui/features/deck/deck.tsx";

const steps = [
  {
    video: "/videos/insercion.mp4",
    title: "Inserción más barata",
    text: "Cada pedido va donde menos sube el costo total. Probamos con 1 a 5 camionetas y nos quedamos con la más barata.",
    result: "941 en 0,01 s",
  },
  {
    video: "/videos/recocido.mp4",
    title: "Recocido simulado",
    text: "Prueba cambios chicos y a veces acepta empeorar, para no quedar atrapado. Iteraciones fijas y semilla: el mismo dataset da siempre el mismo plan.",
    result: "913 en 6 s",
  },
  {
    video: "/videos/ruina.mp4",
    title: "Ruina y recreación",
    text: "Saca una camioneta entera o un grupo de pedidos vecinos y los vuelve a insertar. Es lo que le permite cerrar un vehículo de una vez.",
    result: "peor caso: de 4,9 % a 0 %",
  },
];

export function Method() {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  if (!step) throw new Error(`no hay paso ${current}`);
  return (
    <SlideFrame title="Cómo lo resolvemos">
      <div className="flex h-full gap-12">
        <ol className="flex w-120 flex-col gap-3">
          {steps.map((item, index) => (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-pressed={current === index}
                className={cn(
                  "flex w-full flex-col gap-2 rounded-card border px-5 py-4 text-left transition-colors",
                  current === index
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface hover:bg-subtle",
                )}
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="text-lead font-medium text-fg">
                    {index + 1}. {item.title}
                  </span>
                  <span className="text-body whitespace-nowrap text-fg-3 tabular-nums">
                    {item.result}
                  </span>
                </span>
                <span className="text-body text-fg-2">{item.text}</span>
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
            className="min-h-0 flex-1 rounded-card border border-border bg-surface object-contain"
          />
          <figcaption className="text-body text-fg-3">
            Ilustración con puntos al azar, tomada de nuestro video explicativo.
          </figcaption>
        </figure>
      </div>
    </SlideFrame>
  );
}
