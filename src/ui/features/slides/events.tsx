import { SlideFrame } from "@/ui/features/deck/deck.tsx";

// Una fila por evento, con los mismos datos que docs/eventos.md.
type Event = {
  name: string;
  change: string;
  solution: string;
  files: number;
  minutes: number;
};

const events: Event[] = [
  {
    name: "1 · Premium",
    change: "Cada minuto hasta entregar un pedido premium suma al costo.",
    solution:
      "Un término nuevo en el simulador; la búsqueda no cambió. Práctica: 1.402 (OR-Tools en 10 s: 1.447).",
    files: 7,
    minutes: 23,
  },
];

// Lo que nuestras propias mediciones nos obligaron a cambiar (docs/decisiones.md).
const corrections = [
  {
    found: "Hasta 4,9 % sobre el mejor, aun con 5× iteraciones",
    change: "Sumamos ruina y recreación",
    result: "peor caso: 0 %",
  },
  {
    found: "Con 200 pedidos no mejoraba la inserción",
    change: "Temperatura por pedido, no por costo total",
    result: "1.765 → 1.618",
  },
  {
    found: "El evento 1 nos hizo tocar 3 módulos",
    change: "Planificador y simulador comparten el costo",
    result: "costo en 1 archivo",
  },
];

export function Events() {
  return (
    <SlideFrame
      title="Cuando cambiaron las reglas"
      lead="Traducimos cada cambio al simulador; la búsqueda solo ve el costo."
    >
      {events.length === 0 ? (
        <p className="text-slide text-fg-3">
          Los eventos de la jornada se suman acá a medida que llegan.
        </p>
      ) : (
        <table className="w-full text-slide">
          <thead>
            <tr className="border-b border-divider text-left text-body text-fg-3">
              <th className="py-3 font-normal">evento</th>
              <th className="py-3 font-normal">qué cambió</th>
              <th className="py-3 font-normal">cómo lo resolvimos</th>
              <th className="py-3 pl-6 text-right font-normal">archivos</th>
              <th className="py-3 pl-6 text-right font-normal">minutos</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.name} className="border-b border-row align-top">
                <td className="py-4 pr-6 font-medium whitespace-nowrap text-fg">
                  {event.name}
                </td>
                <td className="py-4 pr-6 text-fg-2">{event.change}</td>
                <td className="py-4 pr-6 text-fg-2">{event.solution}</td>
                <td className="py-4 text-right text-fg tabular-nums">
                  {event.files}
                </td>
                <td className="py-4 text-right text-fg tabular-nums">
                  {event.minutes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h3 className="mt-8 text-lead font-medium text-fg">
        Lo que no salió y cómo lo cambiamos
      </h3>
      <ul className="mt-3 flex flex-col">
        {corrections.map((item) => (
          <li
            key={item.result}
            className="flex gap-6 border-b border-row py-3 text-slide"
          >
            <span className="flex-1 text-fg-2">{item.found}</span>
            <span className="flex-1 text-fg-2">{item.change}</span>
            <span className="w-56 shrink-0 text-right font-medium text-fg tabular-nums">
              {item.result}
            </span>
          </li>
        ))}
      </ul>
    </SlideFrame>
  );
}
