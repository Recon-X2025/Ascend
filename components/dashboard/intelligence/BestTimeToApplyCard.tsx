"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DAYS: Array<{ key: string; label: string }> = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];
const PERIODS: Array<{ key: string; label: string }> = [
  { key: "morning", label: "6–12" },
  { key: "afternoon", label: "12–18" },
  { key: "evening", label: "18–24" },
];

const PERIOD_LABELS: Record<string, string> = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
};
const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

interface HeatmapData {
  periodHeatmap?: Record<string, { morning: number; afternoon: number; evening: number }>;
  bestPeriod?: { day: string; period: string; count: number } | null;
  totalJobs?: number;
}

interface BestTimeToApplyCardProps {
  targetRole: string | null;
  heatmap: HeatmapData | null;
}

export function BestTimeToApplyCard({
  targetRole,
  heatmap,
}: BestTimeToApplyCardProps) {
  const periodHeatmap = heatmap?.periodHeatmap ?? null;
  const bestPeriod = heatmap?.bestPeriod ?? null;
  const totalJobs = heatmap?.totalJobs ?? 0;
  const hasData = periodHeatmap && totalJobs >= 100;
  const maxVal = hasData
    ? Math.max(
        ...DAYS.flatMap((d) =>
          PERIODS.map((p) => periodHeatmap[d.key]?.[p.key as "morning" | "afternoon" | "evening"] ?? 0)
        )
      )
    : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Best Time to Apply
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {targetRole && hasData
            ? `When most ${targetRole} jobs are posted — based on ${totalJobs} job postings`
            : !targetRole
              ? "Set a target role to see when to apply"
              : "Not enough data yet for your target role. We'll show this once more jobs are posted."}
        </p>
      </CardHeader>
      <CardContent>
        {!targetRole ? (
          <p className="text-sm text-muted-foreground">
            Set a target role in your career context to see when to apply.
          </p>
        ) : !hasData ? (
          <p className="text-sm text-muted-foreground">
            Not enough data yet for {targetRole}. We&apos;ll show this once more
            jobs are posted.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-1 pr-2 text-muted-foreground w-10" />
                    {DAYS.map((d) => (
                      <th
                        key={d.key}
                        className="text-center py-1 text-muted-foreground font-normal"
                      >
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => (
                    <tr key={period.key}>
                      <td className="py-0.5 pr-2 text-muted-foreground align-middle">
                        {period.label}
                      </td>
                      {DAYS.map((day) => {
                        const v =
                          periodHeatmap[day.key]?.[
                            period.key as "morning" | "afternoon" | "evening"
                          ] ?? 0;
                        const opacity =
                          maxVal > 0 ? 0.1 + (v / maxVal) * 0.8 : 0.1;
                        return (
                          <td key={day.key} className="p-0.5">
                            <div
                              className={cn(
                                "rounded h-8 flex items-center justify-center bg-[#16A34A] text-foreground",
                                v > 0 && "text-white font-medium"
                              )}
                              style={{
                                opacity: v > 0 ? opacity : 0.08,
                              }}
                              title={`${v} jobs posted on ${DAY_LABELS[day.key] ?? day.key} ${PERIOD_LABELS[period.key] ?? period.key}`}
                            >
                              {v > 0 ? v : ""}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bestPeriod && (
              <p className="text-sm text-muted-foreground mt-3">
                Most jobs posted:{" "}
                {DAY_LABELS[bestPeriod.day] ?? bestPeriod.day}{" "}
                {PERIOD_LABELS[bestPeriod.period] ?? bestPeriod.period}s
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Apply within 24hrs of a job posting — early applicants are 3× more
              likely to be shortlisted.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
