import type { LucideIcon } from "lucide-react";
import { Card } from "./card.tsx";
import { cn } from "./cn.ts";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  total?: string;
  // Fracción de 0 a 1 para la barra; sin valor, la tarjeta no tiene barra.
  share?: number;
  tone?: "ok" | "neutral";
  // La comparación que le da sentido al número ("+5 respecto de la estrategia base").
  note: string;
};

const percent = new Intl.NumberFormat("es-AR", {
  style: "percent",
  maximumFractionDigits: 0,
});

export function MetricCard({
  icon: Icon,
  label,
  value,
  total,
  share,
  tone = "neutral",
  note,
}: MetricCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-control border border-divider bg-subtle">
          <Icon className="size-4 text-fg-3" aria-hidden />
        </span>
        <span className="text-label text-fg-2">{label}</span>
      </div>
      <p className="tabular-nums">
        <span className="text-metric font-medium text-fg">{value}</span>
        {total && <span className="text-page text-fg-3"> / {total}</span>}
      </p>
      {share !== undefined && (
        <div className="flex items-center gap-2.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill">
            <div
              className={cn(
                "h-full rounded-full",
                tone === "ok" ? "bg-ok" : "bg-fg-3",
              )}
              style={{ width: `${Math.min(share, 1) * 100}%` }}
            />
          </div>
          <span className="text-label text-fg-3 tabular-nums">
            {percent.format(share)}
          </span>
        </div>
      )}
      <p className="text-label text-fg-3">{note}</p>
    </Card>
  );
}
