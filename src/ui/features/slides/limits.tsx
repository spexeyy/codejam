import { SlideFrame } from "@/ui/features/deck/deck.tsx";

const limits = [
  {
    title: "No sabemos cuán cerca estamos del óptimo",
    text: "Sabemos que está entre 767 y 913. La cota es floja cuando hay varias rutas; con programación lineal se podría ajustar.",
  },
  {
    title: "Escenarios mucho más grandes tardan",
    text: "Con 40 pedidos son 6 s; con 200, el presupuesto completo tarda más de un minuto. Las corridas se podrían repartir en varios núcleos.",
  },
  {
    title: "Dependemos de nuestra traducción del simulador",
    text: "Cada evento que lo cambia hay que traducirlo. Lo controlamos comparando los dos simuladores en planes al azar.",
  },
];

export function Limits() {
  return (
    <SlideFrame title="Lo que nos falta">
      <div className="grid grid-cols-3 gap-6">
        {limits.map((limit) => (
          <div key={limit.title} className="flex flex-col gap-3">
            <span className="text-lead font-medium text-fg">{limit.title}</span>
            <span className="text-slide text-fg-2">{limit.text}</span>
          </div>
        ))}
      </div>
      <p className="mt-16 text-lead text-fg">
        Gracias.{" "}
        <span className="text-fg-3">
          El código está en github.com/spexeyy/codejam.
        </span>
      </p>
    </SlideFrame>
  );
}
