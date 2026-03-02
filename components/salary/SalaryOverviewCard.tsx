import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatSalaryLPA } from "@/lib/salary/format";
import { DataSourceBadge } from "./DataSourceBadge";

interface CityRow {
  city: string;
  median: number;
  count: number;
}

interface SalaryOverviewCardProps {
  median: number;
  sourceLabel: string | null;
  submissionCount: number;
  jdSignalCount: number;
  cityBreakdown: CityRow[];
}

export function SalaryOverviewCard({
  median,
  sourceLabel,
  submissionCount,
  jdSignalCount,
  cityBreakdown,
}: SalaryOverviewCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-3">Median CTC</span>
          <DataSourceBadge sourceLabel={sourceLabel} />
        </div>
        <p className="text-3xl font-semibold text-ink mt-1">{formatSalaryLPA(median)}</p>
        <p className="text-xs text-ink-3 mt-1">
          {submissionCount > 0 && `${submissionCount} community reports`}
          {submissionCount > 0 && jdSignalCount > 0 && " · "}
          {jdSignalCount > 0 && `${jdSignalCount} job postings`}
        </p>
      </CardHeader>
      <CardContent>
        {cityBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-ink-3">
                  <th className="py-2 pr-4 font-medium">City</th>
                  <th className="py-2 pr-4 font-medium text-right">Median</th>
                  <th className="py-2 font-medium text-right">Data points</th>
                </tr>
              </thead>
              <tbody>
                {cityBreakdown.map((row) => (
                  <tr key={row.city} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-ink-2">{row.city}</td>
                    <td className="py-2 pr-4 text-right font-medium text-green-dark">
                      {formatSalaryLPA(row.median)}
                    </td>
                    <td className="py-2 text-right text-ink-3">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-3">No city breakdown available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
