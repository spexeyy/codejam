import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button.tsx";
import { CapacityBar } from "./capacity-bar.tsx";
import { cn } from "./cn.ts";
import { entityColor } from "./entity-color.ts";

type EntityCardProps = {
  name: string;
  colorIndex: number;
  summary: string;
  usage: { used: number; capacity: number; label: string };
  details: { icon: LucideIcon; text: string }[];
  action?: { label: string; selectedLabel: string; onToggle: () => void };
  selected?: boolean;
  // Lo que se muestra al seleccionar (por ejemplo, el orden de paradas).
  children?: ReactNode;
};

// Una entidad principal (vehículo, camión, operario) con su color, sus números y su uso.
export function EntityCard({
  name,
  colorIndex,
  summary,
  usage,
  details,
  action,
  selected = false,
  children,
}: EntityCardProps) {
  const color = entityColor(colorIndex);
  return (
    <article
      className={cn(
        "flex flex-col gap-2.5 border-b border-row px-5 py-4 transition-colors last:border-0",
        selected && "bg-accent-soft",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className={cn("size-3 shrink-0 rounded-full", color.solid)} />
        <h3 className="text-card font-medium text-fg">{name}</h3>
        <span className="text-body text-fg-2 tabular-nums">{summary}</span>
        {action && (
          <Button
            size="sm"
            className="ml-auto"
            aria-pressed={selected}
            aria-label={
              selected ? action.selectedLabel : `${action.label} de ${name}`
            }
            onClick={action.onToggle}
          >
            {selected ? action.selectedLabel : action.label}
          </Button>
        )}
      </div>
      <CapacityBar
        used={usage.used}
        capacity={usage.capacity}
        label={usage.label}
        fillClass={color.solid}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-fg-3">
        {details.map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 tabular-nums">
            <Icon className="size-4" aria-hidden />
            {text}
          </span>
        ))}
      </div>
      {selected && children}
    </article>
  );
}
