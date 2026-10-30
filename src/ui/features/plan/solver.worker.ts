import { solveAll, type SolveRequest } from "./solver.ts";

self.onmessage = (event: MessageEvent<SolveRequest>) => {
  self.postMessage(solveAll(event.data.scenario, event.data.options));
};
