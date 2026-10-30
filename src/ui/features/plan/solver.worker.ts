import type { Scenario } from "@/domain/types.ts";
import { solveAll } from "./solver.ts";

self.onmessage = (event: MessageEvent<Scenario>) => {
  self.postMessage(solveAll(event.data));
};
