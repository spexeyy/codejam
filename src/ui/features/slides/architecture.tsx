import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { SlideFrame } from "@/ui/features/deck/deck.tsx";

const pipeline = [
  { name: "Dataset", detail: "JSON, CSV o el .zip de la web" },
  { name: "Lectura", detail: "valida cada campo como el simulador" },
  { name: "Simulador", detail: "traducido de Python a TypeScript" },
  { name: "Planificador", detail: "inserción, recocido y cota" },
];

const outputs = [
  { name: "Consola", detail: "escribe el plan de cada entrega" },
  { name: "Navegador", detail: "esta presentación, en un worker" },
];

const guarantees = [
  "120 planes al azar dan el mismo costo en nuestro simulador y en el oficial.",
  "El planificador recorre las rutas con la misma función que el simulador: optimiza el costo con el que nos evalúan.",
  "Cuando cambian las reglas, cambia el simulador; la búsqueda no se toca.",
];

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.3 },
});

function Box({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex w-52 flex-col gap-1 rounded-card border border-border bg-surface px-5 py-4 shadow-card">
      <span className="text-lead font-medium text-fg">{name}</span>
      <span className="text-body text-fg-2">{detail}</span>
    </div>
  );
}

export function Architecture() {
  return (
    <SlideFrame
      title="Un solo núcleo, dos salidas"
      lead="El mismo código arma el plan que entregamos y el que ves en pantalla."
    >
      <div className="flex flex-col gap-10">
        <div className="flex items-center gap-3">
          {pipeline.map((box, index) => (
            <motion.div
              key={box.name}
              className="flex items-center gap-3"
              {...enter(0.2 + index * 0.2)}
            >
              {index > 0 && (
                <ArrowRight className="size-5 text-fg-4" aria-hidden />
              )}
              <Box {...box} />
            </motion.div>
          ))}
          <motion.div className="flex items-center gap-3" {...enter(1)}>
            <ArrowRight className="size-5 text-fg-4" aria-hidden />
            <div className="flex flex-col gap-3">
              {outputs.map((box) => (
                <Box key={box.name} {...box} />
              ))}
            </div>
          </motion.div>
        </div>
        <ul className="flex flex-col gap-3">
          {guarantees.map((line, index) => (
            <motion.li
              key={line}
              className="flex gap-3 text-slide text-fg-2"
              {...enter(1.3 + index * 0.2)}
            >
              <span className="mt-3 size-1.5 shrink-0 rounded-full bg-fg-3" />
              {line}
            </motion.li>
          ))}
        </ul>
      </div>
    </SlideFrame>
  );
}
