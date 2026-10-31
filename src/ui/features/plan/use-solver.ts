import { useEffect, useRef, useState } from "react";
import type { Scenario } from "@/domain/types.ts";
import type { SolveOptions } from "@/planner/strategies.ts";
import type { Improvement, Solution, SolverMessage } from "./solver.ts";

export type SolverState =
  | { status: "idle" }
  | { status: "running"; latest?: Improvement }
  | { status: "done"; solution: Solution }
  | { status: "failed"; message: string };

// El recocido encuentra casi todas sus mejoras en el primer segundo. Las mostramos de a una
// con este intervalo para que se vea cómo cambia el plan mientras la búsqueda sigue.
const STEP_MS = 450;

// Corre el planificador en un worker. Si se pide otro escenario antes de terminar, el
// anterior se descarta.
export function useSolver() {
  const [state, setState] = useState<SolverState>({ status: "idle" });
  const worker = useRef<Worker | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const stop = () => {
    worker.current?.terminate();
    window.clearInterval(timer.current);
  };

  useEffect(() => stop, []);

  const solve = (scenario: Scenario, options: SolveOptions) => {
    stop();
    const next = new Worker(new URL("./solver.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = next;
    const pending: Improvement[] = [];
    let finished: Solution | undefined;
    setState({ status: "running" });
    timer.current = window.setInterval(() => {
      const latest = pending.shift();
      if (latest) {
        setState({ status: "running", latest });
      } else if (finished) {
        window.clearInterval(timer.current);
        setState({ status: "done", solution: finished });
      }
    }, STEP_MS);
    next.onmessage = (event: MessageEvent<SolverMessage>) => {
      if (event.data.type === "improve") {
        pending.push(event.data);
        return;
      }
      finished = event.data.solution;
      next.terminate();
    };
    next.onerror = (event) => {
      stop();
      setState({ status: "failed", message: event.message });
    };
    next.postMessage({ scenario, options });
  };

  return { state, solve };
}
