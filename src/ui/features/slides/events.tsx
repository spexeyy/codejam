import { SlideFrame } from "@/ui/features/deck/deck.tsx";

// Los mismos datos que docs/eventos.md: llegó a las 17:06 y a las 17:21 daba el costo oficial.
const premium = [
  ["qué cambió", "Cada minuto que espera un pedido premium suma al costo."],
  ["qué hicimos", "Sumamos ese término al simulador; la búsqueda no cambió."],
  ["resultado", "1.402 en la práctica; OR-Tools de Google, en 10 s, 1.447."],
  [
    "qué aprendimos",
    "Tocamos 3 módulos, uno de más: ahora el costo se calcula en un solo lugar.",
  ],
] as const;

export function Events() {
  return (
    <SlideFrame
      title="Cuando cambiaron las reglas"
      lead="Traducimos cada cambio al simulador; la búsqueda solo ve el costo."
    >
      <section className="flex items-center gap-6">
        <div className="flex flex-1 flex-col gap-3">
          <h3 className="text-lead font-medium text-fg">
            Evento 1 · pedidos premium
          </h3>
          {premium.map(([label, text]) => (
            <p key={label} className="flex gap-4 text-slide">
              <span className="w-40 shrink-0 whitespace-nowrap text-fg-3">
                {label}
              </span>
              <span className="text-fg-2">{text}</span>
            </p>
          ))}
        </div>
        <div className="flex w-48 shrink-0 flex-col items-end text-right">
          <span className="text-title font-medium whitespace-nowrap text-fg tabular-nums">
            15 min
          </span>
          <span className="text-body text-fg-3">
            hasta calcular igual que el simulador oficial
          </span>
        </div>
      </section>
    </SlideFrame>
  );
}
