import { motion } from "motion/react";
import {
  RELOAD,
  type Plan,
  type Point,
  type Scenario,
} from "@/domain/types.ts";
import { entityColor } from "@/ui/components/entity-color.ts";

type RouteGridProps = {
  scenario: Scenario;
  plan?: Plan;
  size: number;
  // Vehículo resaltado: los demás se atenúan.
  focus?: string;
  // Los pedidos aparecen de a uno, para presentar el problema.
  reveal?: boolean;
};

const LABELS = [0, 5, 10, 15];
const AXIS = 34;
const EDGE = 14;

// La ciudad de QuickDrop: una grilla de cuadras con el origen abajo a la izquierda. Los
// recorridos van por las calles (primero en x, después en y) porque la distancia es
// Manhattan: una línea recta entre dos pedidos mentiría sobre lo que se recorre. Cada tramo
// pasa exactamente por las esquinas de la grilla, sin correrse.
export function RouteGrid({
  scenario,
  plan,
  size,
  focus,
  reveal = false,
}: RouteGridProps) {
  const { world } = scenario;
  const cell =
    (size - AXIS - EDGE) / Math.max(world.width - 1, world.height - 1);
  const px = (p: Point) => AXIS + p.x * cell;
  const py = (p: Point) => EDGE + (world.height - 1 - p.y) * cell;
  // El color sigue el orden de las rutas del plan (primera, segunda...), no el número de la
  // camioneta: así dos rutas nunca quedan con tonos parecidos aunque usen V2 y V4.
  const colorOf = (vehicle: string) => {
    const index =
      plan?.routes.findIndex((route) => route.vehicle === vehicle) ?? -1;
    if (index < 0) throw new Error(`el plan no tiene la camioneta ${vehicle}`);
    return index;
  };
  const orders = new Map(scenario.orders.map((order) => [order.id, order]));
  const visit = new Map<number, { color: number; order: number }>();
  plan?.routes.forEach((route) => {
    let count = 0;
    for (const stop of route.stops) {
      if (stop === RELOAD) continue;
      count += 1;
      visit.set(stop, { color: colorOf(route.vehicle), order: count });
    }
  });
  const radius = Math.max(6, cell * 0.36);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="mapa de la ciudad con los recorridos"
    >
      {Array.from({ length: world.width }, (_, x) => (
        <line
          key={`x${x}`}
          x1={px({ x, y: 0 })}
          x2={px({ x, y: 0 })}
          y1={py({ x, y: world.height - 1 })}
          y2={py({ x, y: 0 })}
          className="stroke-row"
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: world.height }, (_, y) => (
        <line
          key={`y${y}`}
          y1={py({ x: 0, y })}
          y2={py({ x: 0, y })}
          x1={px({ x: 0, y })}
          x2={px({ x: world.width - 1, y })}
          className="stroke-row"
          strokeWidth={1}
        />
      ))}
      {LABELS.filter((n) => n < world.width).map((n) => (
        <text
          key={`lx${n}`}
          x={px({ x: n, y: 0 })}
          y={py({ x: 0, y: 0 }) + AXIS - 8}
          textAnchor="middle"
          className="fill-fg-4 text-label tabular-nums"
        >
          {n}
        </text>
      ))}
      {LABELS.filter((n) => n < world.height).map((n) => (
        <text
          key={`ly${n}`}
          x={AXIS - 20}
          y={py({ x: 0, y: n })}
          dy="0.35em"
          textAnchor="end"
          className="fill-fg-4 text-label tabular-nums"
        >
          {n}
        </text>
      ))}

      {plan?.routes.map((route) => {
        const corners: Point[] = [world.depot];
        for (const stop of route.stops) {
          const target =
            stop === RELOAD ? world.depot : orders.get(stop)?.position;
          const last = corners[corners.length - 1];
          if (!target || !last) continue;
          corners.push({ x: target.x, y: last.y }, target);
        }
        const last = corners[corners.length - 1];
        if (last) corners.push({ x: world.depot.x, y: last.y }, world.depot);
        const d = corners
          .map((p, i) => `${i === 0 ? "M" : "L"}${px(p)},${py(p)}`)
          .join(" ");
        return (
          <motion.path
            key={`${route.vehicle}-${route.stops.join(",")}`}
            d={d}
            fill="none"
            stroke={`var(${entityColor(colorOf(route.vehicle)).token})`}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{
              pathLength: 1,
              opacity: focus && focus !== route.vehicle ? 0.15 : 1,
            }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        );
      })}

      {scenario.orders.map((order, index) => {
        const assigned = visit.get(order.id);
        const dimmed =
          focus && assigned && plan?.routes[assigned.color]?.vehicle !== focus;
        const size = plan ? radius : radius * 0.7;
        const shape = {
          fill: assigned
            ? `var(${entityColor(assigned.color).token})`
            : plan
              ? "var(--color-surface)"
              : "var(--color-fg-3)",
          stroke:
            plan && !assigned ? "var(--color-bad)" : "var(--color-surface)",
          strokeWidth: 1.5,
          strokeDasharray: plan && !assigned ? "3 2" : undefined,
        };
        return (
          <motion.g
            key={order.id}
            initial={reveal ? { opacity: 0, scale: 0.6 } : false}
            animate={{ opacity: dimmed ? 0.25 : 1, scale: 1 }}
            transition={{
              delay: reveal ? 0.2 + index * 0.025 : 0,
              duration: 0.25,
            }}
            style={{
              transformOrigin: `${px(order.position)}px ${py(order.position)}px`,
            }}
          >
            <title>{`pedido ${order.id}${order.premium ? " premium" : ""} · (${order.position.x}, ${order.position.y}) · ${order.weight} kg`}</title>
            {/* Evento 1: los premium son rombos. La forma dice la prioridad; el color, la camioneta. */}
            {order.premium ? (
              <rect
                x={px(order.position) - size * 0.85}
                y={py(order.position) - size * 0.85}
                width={size * 1.7}
                height={size * 1.7}
                rx={2}
                transform={`rotate(45 ${px(order.position)} ${py(order.position)})`}
                {...shape}
              />
            ) : (
              <circle
                cx={px(order.position)}
                cy={py(order.position)}
                r={size}
                {...shape}
              />
            )}
            {assigned && radius >= 8 && (
              <text
                x={px(order.position)}
                y={py(order.position)}
                dy="0.35em"
                textAnchor="middle"
                className="fill-on-accent text-label font-medium tabular-nums"
              >
                {assigned.order}
              </text>
            )}
          </motion.g>
        );
      })}

      <rect
        x={px(world.depot) - 12}
        y={py(world.depot) - 12}
        width={24}
        height={24}
        rx={5}
        className="fill-fg"
      />
      <text
        x={px(world.depot)}
        y={py(world.depot)}
        dy="0.35em"
        textAnchor="middle"
        className="fill-on-accent text-label font-medium"
      >
        D
      </text>
    </svg>
  );
}
