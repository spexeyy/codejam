import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Deck, type Slide } from "./features/deck/deck.tsx";
import { Architecture } from "./features/slides/architecture.tsx";
import { Benchmark } from "./features/slides/benchmark.tsx";
import { Cover } from "./features/slides/cover.tsx";
import { Events } from "./features/slides/events.tsx";
import { Fleet } from "./features/slides/fleet.tsx";
import { Limits } from "./features/slides/limits.tsx";
import { LivePlan } from "./features/slides/live-plan.tsx";
import { Method } from "./features/slides/method.tsx";
import { Problem } from "./features/slides/problem.tsx";
import { Team } from "./features/slides/team.tsx";
import "./styles/index.css";

// El orden del pitch: el problema, la demo, cómo funciona, las decisiones con números,
// cómo nos adaptamos, cómo está hecho, cómo trabajamos y qué nos falta.
const slides: Slide[] = [
  { title: "QuickDrop", Component: Cover },
  { title: "El problema", Component: Problem },
  { title: "El plan, en vivo", Component: LivePlan },
  { title: "Cómo lo resolvemos", Component: Method },
  { title: "¿Cuántas camionetas sacar?", Component: Fleet },
  { title: "¿Qué tan bueno es?", Component: Benchmark },
  { title: "Cuando cambiaron las reglas", Component: Events },
  { title: "Un solo núcleo, dos salidas", Component: Architecture },
  { title: "Cómo trabajamos", Component: Team },
  { title: "Lo que nos falta", Component: Limits },
];

const root = document.getElementById("root");
if (!root) throw new Error("index.html no tiene el elemento #root");

createRoot(root).render(
  <StrictMode>
    <Deck slides={slides} />
  </StrictMode>,
);
