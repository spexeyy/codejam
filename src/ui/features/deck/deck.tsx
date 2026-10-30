import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

export type Slide = { title: string; Component: ComponentType };

const WIDTH = 1280;
const HEIGHT = 720;

function slideFromHash(count: number): number {
  const number = Number(window.location.hash.replace("#", ""));
  return Number.isInteger(number) && number >= 1 && number <= count
    ? number - 1
    : 0;
}

function fitScale(): number {
  return Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
}

// La presentación es la misma app: cada diapositiva es un componente y algunas corren el
// planificador en vivo. Se maneja con las flechas, la barra espaciadora o un control remoto.
export function Deck({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(() => slideFromHash(slides.length));
  const [scale, setScale] = useState(fitScale);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onResize = () => setScale(fitScale());
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      const forward = ["ArrowRight", "PageDown", " "].includes(event.key);
      const back = ["ArrowLeft", "PageUp"].includes(event.key);
      if (!forward && !back) return;
      event.preventDefault();
      setIndex((current) =>
        Math.min(slides.length - 1, Math.max(0, current + (forward ? 1 : -1))),
      );
    };
    const onHash = () => setIndex(slideFromHash(slides.length));
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", onHash);
    };
  }, [slides.length]);

  useEffect(() => {
    window.history.replaceState(null, "", `#${index + 1}`);
  }, [index]);

  const current = slides[index];
  if (!current) throw new Error(`no hay diapositiva ${index + 1}`);
  const { Component } = current;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-sunken">
      <div
        className="relative shrink-0 overflow-hidden bg-main"
        style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})` }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={index}
            aria-label={current.title}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -16 }}
            transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Component />
          </motion.section>
        </AnimatePresence>
        <footer className="absolute inset-x-12 bottom-6 flex items-center gap-4 text-label text-fg-3">
          <span>QuickDrop · CodeJam UNViMe 2026</span>
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-fill">
            <div
              className="h-full bg-fg-3 transition-[width] duration-300"
              style={{ width: `${((index + 1) / slides.length) * 100}%` }}
            />
          </div>
          <span className="tabular-nums">
            {index + 1} / {slides.length}
          </span>
        </footer>
      </div>
    </div>
  );
}

// Marco común: título arriba a la izquierda y el contenido debajo, con los mismos márgenes.
export function SlideFrame({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col px-12 pt-10 pb-16">
      <h2 className="text-title font-medium text-fg">{title}</h2>
      {lead && <p className="mt-3 max-w-4xl text-lead text-fg-2">{lead}</p>}
      <div className="mt-8 min-h-0 flex-1">{children}</div>
    </div>
  );
}
