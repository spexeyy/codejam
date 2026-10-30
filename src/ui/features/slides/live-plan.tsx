import { LoaderCircle, Play } from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
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
import {
  audienceScenario,
  example,
  practice,
} from "@/ui/features/plan/datasets.ts";
import { RouteGrid } from "@/ui/features/plan/route-grid.tsx";
import { useSolver } from "@/ui/features/plan/use-solver.ts";

const number = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

type Choice = "practice" | "example" | "audience";

function vehicleRows(scenario: Scenario, plan: Plan) {
  const simulation = simulate(scenario, plan);
  if (!simulation.valid) throw new Error(simulation.errors.join("; "));
  return plan.routes.map((route) => {
    const visits = simulation.visits.filter(
      (visit) => visit.vehicle === route.vehicle,
    );
    const back = visits[visits.length - 1];
    return {
      id: route.vehicle,
      color: scenario.vehicles.findIndex(
        (vehicle) => vehicle.id === route.vehicle,
      ),
      orders: visits.filter((visit) => visit.status === "delivered").length,
      blocks: visits.reduce((sum, visit) => sum + visit.blocks, 0),
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
  const [choice, setChoice] = useState<Choice>("practice");
  const [audience, setAudience] = useState({ orders: 60, seed: 1 });
  const [current, setCurrent] = useState(initial);
  const [focus, setFocus] = useState<string>();
  const { state, solve } = useSolver();

  const { scenario, base } = current;
  const solution = state.status === "done" ? state.solution : undefined;
  const shown = solution?.best ?? base;
  const simulation = simulate(scenario, shown.plan);
  if (!simulation.valid) throw new Error(simulation.errors.join("; "));
  const rows = vehicleRows(scenario, shown.plan);

  const pickScenario = (next: Choice) => {
    const seed = next === "audience" ? audience.seed + 1 : audience.seed;
    const chosen =
      next === "practice"
        ? practice
        : next === "example"
          ? example
          : audienceScenario(audience.orders, seed);
    setChoice(next);
    setAudience({ ...audience, seed });
    setFocus(undefined);
    setCurrent(planned(chosen));
    solve(chosen);
  };

  return (
    <SlideFrame title="El plan, en vivo">
      <div className="flex h-full gap-10">
        <RouteGrid
          scenario={scenario}
          plan={shown.plan}
          size={500}
          focus={focus}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex items-center gap-2">
            {(
              [
                ["practice", `práctica · ${practice.orders.length} pedidos`],
                ["example", `ejemplo · ${example.orders.length} pedidos`],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                variant={choice === value ? "secondary" : "ghost"}
                onClick={() => pickScenario(value)}
              >
                {label}
              </Button>
            ))}
            <label className="flex items-center gap-2 text-body text-fg-2">
              <input
                type="number"
                min={5}
                max={400}
                value={audience.orders}
                onChange={(event) =>
                  setAudience({
                    orders: Number(event.target.value),
                    seed: audience.seed,
                  })
                }
                className="h-control w-20 rounded-control border border-border bg-surface px-2 text-body tabular-nums"
                aria-label="cantidad de pedidos del escenario del público"
              />
              pedidos
            </label>
            <Button variant="ghost" onClick={() => pickScenario("audience")}>
              al azar
            </Button>
            <Button
              variant="primary"
              className="ml-auto"
              onClick={() => solve(scenario)}
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

          <div className="flex items-end gap-6">
            <div>
              <p className="text-slide whitespace-nowrap text-fg-3">
                {solution ? "recocido simulado" : "inserción más barata"}
              </p>
              <p className="text-hero font-medium text-fg tabular-nums">
                {number.format(simulation.cost.total)}
              </p>
            </div>
            <div className="flex flex-col gap-1 pb-3 text-slide text-fg-2 tabular-nums">
              <span>
                {simulation.metrics.vehiclesUsed} de {scenario.vehicles.length}{" "}
                camionetas · {simulation.metrics.totalBlocks} cuadras
              </span>
              <span>
                vuelve la última a las {toClock(simulation.metrics.finish)}
                {simulation.unassigned.length > 0 &&
                  ` · ${simulation.unassigned.length} sin entregar`}
              </span>
              {solution && (
                <span className="text-ok-text">
                  {number.format(base.cost - solution.best.cost)} menos que la
                  inserción · {solution.seconds.toFixed(1).replace(".", ",")} s
                </span>
              )}
            </div>
          </div>

          <ul className="flex flex-col gap-1">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() =>
                    setFocus(focus === row.id ? undefined : row.id)
                  }
                  aria-pressed={focus === row.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-control px-3 py-1.5 text-left text-slide text-fg-2 tabular-nums",
                    focus === row.id && "bg-accent-soft",
                  )}
                >
                  <span
                    className={cn(
                      "size-3.5 rounded-full",
                      entityColor(row.color).solid,
                    )}
                  />
                  <span className="w-12 font-medium text-fg">{row.id}</span>
                  <span className="w-32">{row.orders} pedidos</span>
                  <span className="w-32">{row.blocks} cuadras</span>
                  <span>vuelve {toClock(row.back)}</span>
                </button>
              </li>
            ))}
          </ul>

          {solution && solution.best.history.length > 0 && (
            <div className="h-40 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={solution.best.history}
                  margin={{ left: 8, right: 8, top: 8 }}
                >
                  <CartesianGrid stroke="var(--color-row)" vertical={false} />
                  <XAxis dataKey="iteration" hide />
                  <YAxis
                    domain={[
                      Math.floor(solution.bound.cost),
                      Math.ceil(
                        Math.max(
                          ...solution.best.history.map(
                            (point) => point.current,
                          ),
                        ),
                      ),
                    ]}
                    ticks={[
                      Math.ceil(solution.bound.cost),
                      solution.best.cost,
                      solution.base.cost,
                    ]}
                    width={48}
                    tick={{ fill: "var(--color-fg-3)", fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine
                    y={solution.base.cost}
                    stroke="var(--color-fg-4)"
                    strokeDasharray="4 4"
                    label={{
                      value: "inserción",
                      fill: "var(--color-fg-3)",
                      fontSize: 13,
                      position: "insideTopRight",
                    }}
                  />
                  <ReferenceLine
                    y={solution.bound.cost}
                    stroke="var(--color-ok)"
                    strokeDasharray="4 4"
                    label={{
                      value: "cota inferior",
                      fill: "var(--color-ok-text)",
                      fontSize: 13,
                      position: "insideBottomRight",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="var(--color-fg-4)"
                    dot={false}
                    strokeWidth={1.5}
                    animationDuration={2500}
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
