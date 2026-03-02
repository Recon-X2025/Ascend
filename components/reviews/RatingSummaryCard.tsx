"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type Aggregate = {
  overallAvg: number;
  workLifeAvg: number;
  salaryAvg: number;
  cultureAvg: number;
  careerAvg: number;
  managementAvg: number;
  recommendPct: number;
  ceoApprovalPct: number | null;
  reviewCount: number;
};

interface RatingSummaryCardProps {
  companyId: string;
  companySlug: string;
  aggregate: Aggregate | null;
}

const BAR_LABELS: { key: keyof Aggregate; label: string }[] = [
  { key: "workLifeAvg", label: "Work-Life Balance" },
  { key: "cultureAvg", label: "Culture & Values" },
  { key: "careerAvg", label: "Career Growth" },
  { key: "salaryAvg", label: "Compensation" },
  { key: "managementAvg", label: "Management" },
];

export function RatingSummaryCard({ companyId, companySlug, aggregate }: RatingSummaryCardProps) {
  if (!aggregate) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">No ratings yet.</p>
        <Button asChild className="mt-4">
          <Link href={`/reviews/company/new?companyId=${companyId}`}>Share your experience</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-primary">{aggregate.overallAvg.toFixed(1)}</span>
          <span className="text-2xl text-primary">★</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/companies/${companySlug}`}>View company</Link>
          </Button>
          <Button asChild>
            <Link href={`/reviews/company/new?companyId=${companyId}`}>Share your experience →</Link>
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Based on {aggregate.reviewCount} reviews</p>

      <div className="space-y-2">
        {BAR_LABELS.map(({ key, label }) => {
          const value = aggregate[key];
          const num = typeof value === "number" ? value : 0;
          const pct = Math.round((num / 5) * 100);
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm w-40 shrink-0">{label}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-10 text-right">
                {num > 0 ? num.toFixed(1) : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 pt-2 border-t">
        <div>
          <span className="text-sm text-muted-foreground">Would recommend </span>
          <span className="font-medium">{aggregate.recommendPct}%</span>
        </div>
        {aggregate.ceoApprovalPct != null && (
          <div>
            <span className="text-sm text-muted-foreground">CEO approval </span>
            <span className="font-medium">{aggregate.ceoApprovalPct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
