import { formatSalaryLPA } from "@/lib/salary/format";

interface CityRow {
  city: string;
  median: number;
  costIndex: number | null;
  adjustedMedian: number;
}

interface CityComparisonTableProps {
  rows: CityRow[];
  className?: string;
}

export function CityComparisonTable({ rows, className }: CityComparisonTableProps) {
  if (rows.length === 0) return null;
  return (
    <div className={className}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-ink-3">
            <th className="py-2 pr-4 font-medium">City</th>
            <th className="py-2 pr-4 font-medium text-right">Median salary</th>
            <th className="py-2 pr-4 font-medium text-right">Cost index</th>
            <th className="py-2 font-medium text-right">Purchasing power (adj.)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.city} className="border-b border-border/50">
              <td className="py-2 pr-4 text-ink-2">{row.city}</td>
              <td className="py-2 pr-4 text-right">{formatSalaryLPA(row.median)}</td>
              <td className="py-2 pr-4 text-right text-ink-3">
                {row.costIndex != null ? row.costIndex : "—"}
              </td>
              <td className="py-2 text-right font-medium text-green-dark">
                {formatSalaryLPA(row.adjustedMedian)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
