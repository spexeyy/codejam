import { LoaderCircle, Play } from "lucide-react";
import { useState } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { toClock } from "@/domain/clock.ts";
import { simulate } from "@/domain/simulate.ts";
import type { Plan, Scenario } from "@/domain/types.ts";
import { defaultOptions, strategyById } from "@/planner/strategies.ts";
import { Button } from "@/ui/components/button.tsx";
import { cn } from "@/ui/components/cn.ts";
import { entityColor } from "@/ui/components/entity-color.ts";
import { SlideFrame } from "@/ui/features/deck/deck.tsx";
import { eventOne, practice } from "@/ui/features/plan/datasets.ts";
import { RouteGrid } from "@/ui/features/plan/route-grid.tsx";
import { useSolver } from "@/ui/features/plan/use-solver.ts";

const number = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

const choices = [
  { scenario: practice, label: "práctica" },
  { scenario: eventOne, label: "con premium (evento 1)" },
] as const;

function vehicleRows(scenario: Scenario, plan: Plan) {
  const simulation = simulate(scenario, plan);
  if (!simulation.valid) throw new Error(simulation.errors.join("; "));
  return plan.routes.map((route, index) => {
    const visits = simulation.visits.filter(
      (visit) => visit.vehicle === route.vehicle,
    );
    const back = visits[visits.length - 1];
    return {
      id: route.vehicle,
      color: index,
      orders: visits.filter((visit) => visit.status === "delivered").length,
      back: back ? back.arrival : scenario.world.departure,
    };
  });
}

function planned(scenario: Scenario) {
  return {
    scenario,
    base: strategyById("insercion").solve(scenario, defaultOptions),
  };
}

const initial = planned(practice);

export function LivePlan() {
  const [current, setCurrent] = useState(initial);
  const [focus, setFocus] = useState<string>();
  const { state, solve } = useSolver();

  const { scenario, base } = current;
  const solution = state.status === "done" ? state.solution : undefined;
  const latest = state.status === "running" ? state.latest : undefined;
  const plan = solution?.best.plan ?? latest?.plan ?? base.plan;
  const simulation = simulate(scenario, plan);
  if (!simulation.valid) throw new Error(simulation.errors.join("; "));
  const rows = vehicleRows(scenario, plan);

  // La escala de las barras sale del primer plan y no cambia al optimizar: así se ve cuánto
  // antes vuelven las camionetas.
  const start = scenario.world.departure;
  const baseFinish = Math.max(
    ...vehicleRows(scenario, base.plan).map((row) => row.back),
  );
  const end = Math.ceil(baseFinish / 60) * 60;
  const width = (minute: number) =>
    `${((minute - start) / (end - start)) * 100}%`;

  const pick = (next: Scenario) => {
    setFocus(undefined);
    setCurrent(planned(next));
    solve(next, defaultOptions);
  };

  return (
    <SlideFrame title="El plan, en vivo">
      <div className="flex h-full gap-10">
        <RouteGrid
          scenario={scenario}
          plan={plan}
          size={520}
          focus={focus}
          numbered={false}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex items-center gap-2">
            {choices.map((choice) => (
              <Button
                key={choice.label}
                variant={scenario === choice.scenario ? "secondary" : "ghost"}
                onClick={() => pick(choice.scenario)}
              >
                {choice.label}
              </Button>
            ))}
            <Button
              variant="primary"
              className="ml-auto"
              onClick={() => solve(scenario, defaultOptions)}
              disabled={state.status === "running"}
            >
              {state.status === "running" ? (
                <LoaderCircle className="animate-spin" aria-hidden />
              ) : (
                <Play aria-hidden />
              )}
              {state.status === "running" ? "buscando…" : "Optimizar"}
            </Button>
          </div>

          <div>
            <p className="text-slide text-fg-3">
              {solution
                ? "costo después de optimizar"
                : latest
                  ? "buscando: el mejor plan hasta ahora"
                  : "costo del primer plan"}
            </p>
            <div className="flex items-baseline gap-5">
              {(solution ?? latest) && (
                <span className="text-title text-fg-4 tabular-nums line-through">
                  {number.format(base.cost)}
                </span>
              )}
              <span className="text-hero font-medium text-fg tabular-nums">
                {number.format(simulation.cost.total)}
              </span>
              {solution && (
                <span className="rounded-full bg-ok-soft px-4 py-1 text-slide font-medium text-ok-text tabular-nums">
                  −{number.format(base.cost - solution.best.cost)} en{" "}
                  {solution.seconds.toFixed(1).replace(".", ",")} s
                </span>
              )}
            </div>
            <p className="mt-1 text-slide text-fg-2 tabular-nums">
              {simulation.metrics.vehiclesUsed} de {scenario.vehicles.length}{" "}
              camionetas · {simulation.metrics.delivered} de{" "}
              {simulation.metrics.orders} pedidos entregados
              {simulation.metrics.premiumTotal > 0 &&
                ` · ${simulation.metrics.premiumTotal} premium`}
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() =>
                    setFocus(focus === row.id ? undefined : row.id)
                  }
                  aria-pressed={focus === row.id}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-control px-3 py-2 text-left text-slide tabular-nums",
                    focus === row.id && "bg-accent-soft",
                  )}
                >
                  <span className="w-10 font-medium text-fg">{row.id}</span>
                  <span className="relative h-3 flex-1 rounded-full bg-fill">
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700",
                        entityColor(row.color).solid,
                      )}
                      style={{ width: width(row.back) }}
                    />
                  </span>
                  <span className="w-56 text-fg-2">
                    {row.orders} pedidos · {toClock(row.back)}
                  </span>
                </button>
              </li>
            ))}
            <li className="flex gap-4 px-3 text-label text-fg-3 tabular-nums">
              <span className="w-10" />
              <span className="flex flex-1 justify-between">
                <span>sale {toClock(start)}</span>
                <span>{toClock(end)}</span>
              </span>
              <span className="w-56">pedidos · vuelve</span>
            </li>
          </ul>

          {solution && solution.best.history.length > 0 && (
            <div className="h-32 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={solution.best.history}
                  margin={{ left: 8, right: 8, top: 8 }}
                >
                  <YAxis
                    domain={[
                      Math.floor(solution.bound.cost),
                      Math.ceil(solution.base.cost * 1.03),
                    ]}
                    allowDataOverflow
                    hide
                  />
                  <ReferenceLine
                    y={solution.base.cost}
                    stroke="var(--color-fg-4)"
                    strokeDasharray="4 4"
                    label={{
                      value: `primer plan ${number.format(solution.base.cost)}`,
                      fill: "var(--color-fg-3)",
                      fontSize: 14,
                      position: "insideTopRight",
                    }}
                  />
                  <ReferenceLine
                    y={solution.bound.cost}
                    stroke="var(--color-ok)"
                    strokeDasharray="4 4"
                    label={{
                      value: `ningún plan baja de ${number.format(Math.ceil(solution.bound.cost))}`,
                      fill: "var(--color-ok-text)",
                      fontSize: 14,
                      position: "insideBottomRight",
                    }}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="best"
                    stroke="var(--color-accent)"
                    dot={false}
                    strokeWidth={3}
                    animationDuration={2500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {state.status === "failed" && (
            <p className="text-slide text-bad-text">
              No se pudo optimizar: {state.message}
            </p>
          )}
        </div>
      </div>
    </SlideFrame>
  );
}
