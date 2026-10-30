import type { ComponentProps } from "react";
import { cn } from "./cn.ts";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-control bg-fill motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}
