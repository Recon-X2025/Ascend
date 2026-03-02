import { Star } from "lucide-react";
import type { CompanyRatingAggregate } from "@/lib/companies/ratings";

interface RatingSummaryCardProps {
  aggregate: CompanyRatingAggregate | null;
}

const LABELS: Record<string, string> = {
  workLifeAvg: "Work-Life",
  salaryAvg: "Salary",
  cultureAvg: "Culture",
  careerAvg: "Career Growth",
  managementAvg: "Management",
};

function Bar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function RatingSummaryCard({ aggregate }: RatingSummaryCardProps) {
  if (!aggregate) {
    return (
      <div className="ascend-card p-4">
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      </div>
    );
  }

  const { overallAvg, reviewCount, recommendPct, ceoApprovalPct } = aggregate;
  const subRatings = [
    { key: "workLifeAvg", label: LABELS.workLifeAvg, value: aggregate.workLifeAvg },
    { key: "salaryAvg", label: LABELS.salaryAvg, value: aggregate.salaryAvg },
    { key: "cultureAvg", label: LABELS.cultureAvg, value: aggregate.cultureAvg },
    { key: "careerAvg", label: LABELS.careerAvg, value: aggregate.careerAvg },
    { key: "managementAvg", label: LABELS.managementAvg, value: aggregate.managementAvg },
  ];

  return (
    <div className="ascend-card p-4 space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-3xl font-bold">{overallAvg}</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${i <= Math.round(overallAvg) ? "fill-amber-400 text-amber-400" : "text-muted"}`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">({reviewCount} reviews)</span>
      </div>
      <div className="space-y-2">
        {subRatings.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-24 text-xs text-muted-foreground">{label}</span>
            <Bar value={value} />
            <span className="text-xs w-8">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-sm">
        <span>Recommend: {recommendPct}%</span>
        {ceoApprovalPct != null && <span>CEO Approval: {ceoApprovalPct}%</span>}
      </div>
    </div>
  );
}
