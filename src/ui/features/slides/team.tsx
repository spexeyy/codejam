import { motion } from "motion/react";
import { SlideFrame } from "@/ui/features/deck/deck.tsx";

// La jornada como pasó, con los horarios de nuestras mediciones y commits.
const timeline = [
  {
    time: "15:08",
    text: "Leímos la guía y el simulador; medimos cuántas camionetas convienen",
  },
  {
    time: "15:28",
    text: "Primer plan válido, con el mismo costo que el simulador oficial",
  },
  {
    time: "15:40",
    text: "Auditoría: OR-Tools, cota inferior y 20 escenarios nuevos",
  },
  {
    time: "15:50",
    text: "El benchmark mostró un problema; la ruina y recreación lo resolvió",
  },
  { time: "16:20", text: "Repositorio en GitHub con los tests en verde" },
  { time: "16:50", text: "Presentación con el planificador corriendo en vivo" },
  { time: "17:00", text: "Escala: con 200 pedidos, de 1.765 a 1.618" },
  {
    time: "17:06",
    text: "Evento 1, premium: 23 minutos, sin tocar la búsqueda",
  },
  { time: "17:38", text: "Entrega Base: 3 planes válidos (924, 925 y 862)" },
];

const roles = [
  {
    name: "Ignacio Bertola",
    text: "Decisiones técnicas, dirección del desarrollo y revisión de cada cambio antes de entrar.",
  },
  {
    name: "Felix de Felice",
    text: "Presentación, ensayo y pruebas de la demo como usuario.",
  },
  {
    name: "IA",
    text: "Escribió la mayor parte del código con nuestras reglas. Nada entró sin revisión.",
  },
];

export function Team() {
  return (
    <SlideFrame title="Cómo trabajamos">
      <div className="flex gap-14">
        <ol className="flex flex-1 flex-col gap-3">
          {timeline.map((item, index) => (
            <motion.li
              key={item.time}
              className="flex gap-5 text-slide"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.12, duration: 0.3 }}
            >
              <span className="w-16 shrink-0 font-medium text-fg tabular-nums">
                {item.time}
              </span>
              <span className="text-fg-2">{item.text}</span>
            </motion.li>
          ))}
        </ol>
        <div className="flex w-96 flex-col gap-6">
          {roles.map((role) => (
            <div key={role.name} className="flex flex-col gap-1">
              <span className="text-lead font-medium text-fg">{role.name}</span>
              <span className="text-slide text-fg-2">{role.text}</span>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  );
}
