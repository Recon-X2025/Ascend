"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AggregateRow {
  jobTitle: string;
  median: number;
  p25: number;
  p75: number;
  count: number;
  year?: number;
}

interface SalaryAggregateTableProps {
  companyId: string;
  available: boolean;
  aggregates: AggregateRow[] | null;
  message?: string;
}

function formatINR(n: number) {
  if (n >= 10_00_000) return `${(n / 10_00_000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toLocaleString();
}

export function SalaryAggregateTable({
  companyId,
  available,
  aggregates,
  message,
}: SalaryAggregateTableProps) {
  if (!available || !aggregates?.length) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">
          {message ?? "Salary data will appear here once enough submissions are received."}
        </p>
        <Button asChild className="mt-4">
          <Link href={`/reviews/salary/new?companyId=${companyId}`}>Add your salary →</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/reviews/salary/new?companyId=${companyId}`}>Add your salary →</Link>
        </Button>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Job Title</th>
              <th className="text-right p-3 font-medium">Median CTC</th>
              <th className="text-right p-3 font-medium">Range (P25–P75)</th>
              <th className="text-right p-3 font-medium">Count</th>
              <th className="text-right p-3 font-medium">Year</th>
            </tr>
          </thead>
          <tbody>
            {aggregates.map((row, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-3">{row.jobTitle}</td>
                <td className="p-3 text-right">₹{formatINR(row.median)}</td>
                <td className="p-3 text-right">
                  ₹{formatINR(row.p25)} – ₹{formatINR(row.p75)}
                </td>
                <td className="p-3 text-right">{row.count}</td>
                <td className="p-3 text-right">{row.year ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Salaries are self-reported and anonymised. Individual submissions are never disclosed.
      </p>
    </div>
  );
}
