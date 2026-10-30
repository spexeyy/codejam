import { strategyById, defaultOptions } from "@/planner/strategies.ts";
import { practice } from "@/ui/features/plan/datasets.ts";
import { RouteGrid } from "@/ui/features/plan/route-grid.tsx";

// La inserción tarda milisegundos: alcanza para que la portada ya muestre un plan real.
const coverPlan = strategyById("insercion").solve(
  practice,
  defaultOptions,
).plan;

export function Cover() {
  return (
    <div className="flex h-full items-center gap-12 px-16 pb-10">
      <div className="flex flex-1 flex-col gap-8">
        <p className="text-slide text-fg-3">CodeJam UNViMe 2026 · Nivel 3</p>
        <h1 className="text-hero font-medium text-fg">QuickDrop</h1>
        <p className="max-w-xl text-lead text-fg-2">
          El plan de reparto de cada mañana: qué camioneta lleva cada pedido, en
          qué orden, y cuántas conviene sacar del depósito.
        </p>
        <p className="text-slide text-fg-3">
          Ignacio Bertola · Felix de Felice
        </p>
      </div>
      <div className="opacity-80">
        <RouteGrid scenario={practice} plan={coverPlan} size={520} />
      </div>
    </div>
  );
}
