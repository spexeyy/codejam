import { solveAll, type SolveRequest, type SolverMessage } from "./solver.ts";

const post = (message: SolverMessage) => self.postMessage(message);

self.onmessage = (event: MessageEvent<SolveRequest>) => {
  const solution = solveAll(
    event.data.scenario,
    event.data.options,
    (plan, cost) => post({ type: "improve", plan, cost }),
  );
  post({ type: "done", solution });
};
