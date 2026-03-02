"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const INDUSTRY_AVG_RESPONSE_RATE = 15;

interface AppPerformance {
  applied: number;
  viewed?: number | null;
  shortlisted: number;
  rejected: number;
  responseRate?: number | null;
  avgDaysToResponse?: number | null;
  shortlistRate?: number | null;
}

interface ApplicationPerformanceCardProps {
  appPerformance: AppPerformance | null;
}

export function ApplicationPerformanceCard({
  appPerformance,
}: ApplicationPerformanceCardProps) {
  const applied = appPerformance?.applied ?? 0;
  const responseRate = appPerformance?.responseRate ?? null;
  const avgDays = appPerformance?.avgDaysToResponse ?? null;
  const shortlistRate = appPerformance?.shortlistRate ?? null;
  const empty = applied === 0;
  const sparse = applied > 0 && applied < 5;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Application Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {empty ? (
          <>
            <p className="text-sm text-muted-foreground">
              Apply to jobs to start tracking your performance.
            </p>
            <Link
              href="/jobs"
              className="inline-block mt-3 text-sm text-[#16A34A] hover:underline"
            >
              Browse jobs →
            </Link>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 px-3 py-3">
                <div className="text-2xl font-bold">{applied}</div>
                <div className="text-xs text-muted-foreground">Applied</div>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-3">
                <div className="text-2xl font-bold">
                  {responseRate != null ? `${Math.round(responseRate)}%` : "—"}
                </div>
                <div className="text-xs text-muted-foreground">Response Rate</div>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-3">
                <div className="text-2xl font-bold">
                  {avgDays != null ? avgDays : "—"}
                </div>
                <div className="text-xs text-muted-foreground">Avg Days to Response</div>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-3">
                <div className="text-2xl font-bold">
                  {shortlistRate != null ? `${Math.round(shortlistRate)}%` : "—"}
                </div>
                <div className="text-xs text-muted-foreground">Shortlist Rate</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Industry average response rate: ~{INDUSTRY_AVG_RESPONSE_RATE}%
            </p>
            {responseRate != null && responseRate > INDUSTRY_AVG_RESPONSE_RATE && (
              <p className="text-sm text-[#16A34A] mt-1">You&apos;re above average 🎯</p>
            )}
            {responseRate != null && responseRate < INDUSTRY_AVG_RESPONSE_RATE && (
              <p className="text-sm text-muted-foreground mt-1">
                Tip: tailor your resume to each JD using the Resume Optimiser.{" "}
                <Link href="/resume/build" className="text-[#16A34A] hover:underline">
                  Optimise your resume →
                </Link>
              </p>
            )}
            {sparse && (
              <p className="text-xs text-muted-foreground mt-2">
                Stats become more meaningful after 10+ applications.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
