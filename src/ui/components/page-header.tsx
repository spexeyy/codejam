import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  // Fecha, jornada y estado de la última ejecución, en una línea.
  meta: ReactNode;
  // El resumen en una frase: lo primero que se lee.
  summary?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, meta, summary, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex min-h-control items-start justify-between gap-6">
        <h1 className="pt-1.5 text-page font-medium text-fg">{title}</h1>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      <p className="flex items-center gap-2 text-label text-fg-3">
        <CalendarDays className="size-4" aria-hidden />
        {meta}
      </p>
      {summary && <p className="text-card text-fg-2">{summary}</p>}
    </header>
  );
}
