import { CircleAlert } from "lucide-react";

type ErrorStateProps = {
  title: string;
  issues: string[];
  hint: string;
};

// Qué falló, campo por campo, y qué hacer para arreglarlo.
export function ErrorState({ title, issues, hint }: ErrorStateProps) {
  return (
    <div className="flex flex-col gap-3" role="alert">
      <div className="flex items-center gap-2 text-bad-text">
        <CircleAlert className="size-4" aria-hidden />
        <h2 className="text-card font-medium">{title}</h2>
      </div>
      <ul className="flex flex-col gap-1 font-mono text-body text-fg">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      <p className="text-body text-fg-2">{hint}</p>
    </div>
  );
}
