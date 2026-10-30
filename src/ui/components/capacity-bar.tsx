import { cn } from "./cn.ts";

type CapacityBarProps = {
  used: number;
  capacity: number;
  label: string;
  fillClass: string;
  detail?: string;
};

const percent = new Intl.NumberFormat("es-AR", {
  style: "percent",
  maximumFractionDigits: 0,
});

// Uso contra el máximo. Si se pasa, la barra se marca en rojo y el porcentaje lo dice.
export function CapacityBar({
  used,
  capacity,
  label,
  fillClass,
  detail,
}: CapacityBarProps) {
  const share = capacity > 0 ? used / capacity : 0;
  const over = share > 1;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <div
          className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-fill"
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={capacity}
          aria-valuenow={used}
        >
          <div
            className={cn("h-full rounded-full", over ? "bg-bad" : fillClass)}
            style={{ width: `${Math.min(share, 1) * 100}%` }}
          />
        </div>
        <span
          className={cn(
            "w-11 text-right text-label tabular-nums",
            over ? "text-bad-text" : "text-fg-3",
          )}
        >
          {percent.format(share)}
        </span>
      </div>
      {detail && <span className="text-label text-fg-3">{detail}</span>}
    </div>
  );
}
