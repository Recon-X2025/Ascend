import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatSalaryLPA } from "@/lib/salary/format";

interface TopPayerRow {
  companyId: string;
  companyName: string;
  companySlug: string | null;
  medianSalary: number;
  count: number;
}

interface TopPayersCardProps {
  topPayers: TopPayerRow[];
}

export function TopPayersCard({ topPayers }: TopPayersCardProps) {
  if (topPayers.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-ink">Top paying companies</h3>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {topPayers.map((row) => (
            <li key={row.companyId} className="flex items-center justify-between gap-4">
              <Link
                href={row.companySlug ? `/companies/${row.companySlug}` : "#"}
                className="text-sm font-medium text-green-dark hover:underline truncate"
              >
                {row.companyName}
              </Link>
              <span className="text-sm font-medium text-ink shrink-0">
                {formatSalaryLPA(row.medianSalary)}
              </span>
              <span className="text-xs text-ink-3 shrink-0">{row.count} reports</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
