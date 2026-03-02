"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FACTOR_LABELS: Record<string, string> = {
  completeness: "Profile Completeness",
  keywordDensity: "Keyword Match",
  recency: "Recency",
  applicationActivity: "Application Activity",
  socialProof: "Social Proof",
};

interface VisibilityScoreCardProps {
  visibility: {
    score: number;
    factors: Record<string, number>;
    recommendations: string[];
  } | null;
  stale?: boolean;
  computedDaysAgo?: number | null;
}

export function VisibilityScoreCard({
  visibility,
  stale,
  computedDaysAgo,
}: VisibilityScoreCardProps) {
  const score = visibility?.score ?? 0;
  const ringColor =
    score >= 71 ? "text-[#16A34A]" : score >= 41 ? "text-amber-500" : "text-red-500";
  const label =
    score >= 71 ? "Strong" : score >= 41 ? "Fair" : "Needs work";
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Profile Visibility Score
          </CardTitle>
          {(stale || (computedDaysAgo != null && computedDaysAgo > 0)) && (
            <span className="text-xs text-muted-foreground">
              {stale
                ? "Refreshing…"
                : `Last updated ${computedDaysAgo} day${computedDaysAgo === 1 ? "" : "s"} ago`}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {visibility ? (
          <>
            <div className="flex flex-col items-center mb-4">
              <div className="relative inline-flex items-center justify-center">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn("transition-[stroke-dashoffset] duration-700", ringColor)}
                  />
                </svg>
                <span
                  className={cn(
                    "absolute text-xl font-bold",
                    ringColor
                  )}
                >
                  {score}
                </span>
              </div>
              <span className="text-sm text-muted-foreground mt-1">{label}</span>
            </div>
            <div className="space-y-2">
              {Object.entries(visibility.factors).map(([key, value]) => {
                if (key === "recommendations") return null;
                const v = typeof value === "number" ? value : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-muted-foreground">
                        {FACTOR_LABELS[key] ?? key}
                      </span>
                      <span>{v}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#16A34A] rounded-full transition-all duration-500"
                        style={{ width: `${v}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {visibility.recommendations?.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {visibility.recommendations.slice(0, 3).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            )}
            <Link
              href="/profile/edit"
              className="inline-block mt-3 text-sm text-[#16A34A] hover:underline"
            >
              Edit profile →
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete your profile to see your visibility score.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
