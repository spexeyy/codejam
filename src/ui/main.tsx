import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Deck, type Slide } from "./features/deck/deck.tsx";
import { Benchmark } from "./features/slides/benchmark.tsx";
import { Cover } from "./features/slides/cover.tsx";
import { Fleet } from "./features/slides/fleet.tsx";
import { LivePlan } from "./features/slides/live-plan.tsx";
import { Problem } from "./features/slides/problem.tsx";
import "./styles/index.css";

const slides: Slide[] = [
  { title: "QuickDrop", Component: Cover },
  { title: "El problema", Component: Problem },
  { title: "El plan, en vivo", Component: LivePlan },
  { title: "¿Cuántas camionetas sacar?", Component: Fleet },
  { title: "¿Qué tan bueno es?", Component: Benchmark },
];

const root = document.getElementById("root");
if (!root) throw new Error("index.html no tiene el elemento #root");

createRoot(root).render(
  <StrictMode>
    <Deck slides={slides} />
  </StrictMode>,
);
