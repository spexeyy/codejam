import { useEffect, useRef, useState } from "react";
import type { Scenario } from "@/domain/types.ts";
import type { Solution } from "./solver.ts";

export type SolverState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; solution: Solution }
  | { status: "failed"; message: string };

// Corre el planificador en un worker. Si se pide otro escenario antes de terminar, el
// anterior se descarta.
export function useSolver() {
  const [state, setState] = useState<SolverState>({ status: "idle" });
  const worker = useRef<Worker | null>(null);

  useEffect(() => () => worker.current?.terminate(), []);

  const solve = (scenario: Scenario) => {
    worker.current?.terminate();
    const next = new Worker(new URL("./solver.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = next;
    setState({ status: "running" });
    next.onmessage = (event: MessageEvent<Solution>) => {
      setState({ status: "done", solution: event.data });
      next.terminate();
    };
    next.onerror = (event) => {
      setState({ status: "failed", message: event.message });
      next.terminate();
    };
    next.postMessage(scenario);
  };

  return { state, solve };
}
