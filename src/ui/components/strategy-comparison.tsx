import { StatusBadge } from "./status-badge.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table.tsx";

export type StrategyRow = {
  id: string;
  label: string;
  values: Record<string, string>;
};

type StrategyComparisonProps = {
  columns: { key: string; label: string }[];
  rows: StrategyRow[];
  // Qué fila es mejor lo decide el dominio con su objetivo; acá solo se marca.
  bestId: string;
  shownId: string;
  conclusion: string;
  onShow: (id: string) => void;
};

export function StrategyComparison({
  columns,
  rows,
  bestId,
  shownId,
  conclusion,
  onShow,
}: StrategyComparisonProps) {
  return (
    <div className="flex flex-col">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estrategia</TableHead>
            {columns.map((column) => (
              <TableHead key={column.key} className="text-right">
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.id === shownId ? "selected" : undefined}
              className="cursor-pointer"
              onClick={() => onShow(row.id)}
            >
              <TableCell>
                <button
                  type="button"
                  aria-pressed={row.id === shownId}
                  className="flex flex-col items-start gap-1 text-left"
                  onClick={(event) => {
                    event.stopPropagation();
                    onShow(row.id);
                  }}
                >
                  {row.label}
                  {row.id === bestId && (
                    <StatusBadge status="ok">mejor</StatusBadge>
                  )}
                </button>
              </TableCell>
              {columns.map((column) => (
                <TableCell key={column.key} className="text-right">
                  {row.values[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t border-divider px-5 py-3 text-body text-fg-2">
        {conclusion}
      </p>
    </div>
  );
}
