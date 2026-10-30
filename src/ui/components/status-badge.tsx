import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "./cn.ts";

const statusBadgeVariants = cva(
  "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-label font-medium",
  {
    variants: {
      status: {
        neutral: "bg-fill text-fg-2",
        ok: "bg-ok-soft text-ok-text",
        warn: "bg-warn-soft text-warn-text",
        bad: "bg-bad-soft text-bad-text",
      },
    },
    defaultVariants: { status: "neutral" },
  },
);

const dotColor = {
  neutral: "bg-fg-4",
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
};

type StatusBadgeProps = ComponentProps<"span"> &
  VariantProps<typeof statusBadgeVariants>;

export function StatusBadge({
  className,
  status,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", dotColor[status ?? "neutral"])}
      />
      {children}
    </span>
  );
}
