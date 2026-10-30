import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
};

export function EmptyState({ icon: Icon, title, children }: EmptyStateProps) {
  return (
    <div className="flex max-w-xl flex-col items-start gap-3 py-2">
      <span className="inline-flex size-10 items-center justify-center rounded-control border border-border bg-subtle">
        <Icon className="size-4 text-fg-3" />
      </span>
      <h2 className="text-card font-medium text-fg">{title}</h2>
      <div className="text-card text-fg-2">{children}</div>
    </div>
  );
}
