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
    change:
      "Algunos pedidos son premium: cada minuto hasta su entrega suma al costo.",
    solution:
      "Un término nuevo en el simulador. La búsqueda no cambió: adelanta sola a los premium.",
    files: 7,
    minutes: 20,
  },
];

export function Events() {
  return (
    <SlideFrame
      title="Cuando cambiaron las reglas"
      lead="Cada evento cambia el simulador. Nosotros cambiamos su traducción y, si hace falta, un movimiento de la búsqueda."
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
              <th className="py-3 text-right font-normal">archivos</th>
              <th className="py-3 text-right font-normal">minutos</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.name} className="border-b border-row align-top">
                <td className="py-4 pr-6 font-medium text-fg">{event.name}</td>
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
    </SlideFrame>
  );
}
