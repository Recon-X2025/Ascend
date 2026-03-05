"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Eye, User, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import type { CompletionResult, CompletionBreakdown } from "@/lib/profile/completion";

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))));

const MILESTONE_LABELS: Record<string, string> = {
  NONE: "Getting started",
  QUARTER: "25% — Good start",
  HALF: "50% — Halfway there",
  THREE_QUARTERS: "75% — Almost there",
  COMPLETE: "100% — Complete",
};

const SECTION_LABELS: Record<keyof CompletionBreakdown, string> = {
  personalInfo: "Personal info",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  resume: "Resume",
  preferences: "Preferences",
  extras: "Extras",
};

const SECTION_WEIGHTS: Record<keyof CompletionBreakdown, number> = {
  personalInfo: 20,
  experience: 25,
  education: 10,
  skills: 15,
  resume: 15,
  preferences: 10,
  extras: 5,
};

interface ProfileViewInsight {
  companyName: string;
  count: number;
}
interface ProfileViewInsightsResult {
  totalViews: number;
  byCompany: ProfileViewInsight[];
  canSeeCompanyNames: boolean;
}

interface ProfileStrengthCardProps {
  /** Fallback when API not yet loaded */
  initialCompletionScore?: number;
  profileViews?: number;
  headline?: string | null;
  profileViewInsights?: ProfileViewInsightsResult | null;
}

export function ProfileStrengthCard({
  initialCompletionScore = 0,
  profileViews = 0,
  headline,
  profileViewInsights,
}: ProfileStrengthCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { data } = useSWR<{ success: boolean; data: { completion: CompletionResult; profileViews?: number } }>(
    "/api/profile/strength",
    fetcher,
    {
      fallbackData: {
        success: true,
        data: {
          completion: {
            total: initialCompletionScore,
            milestone: "NONE",
            nextStep: "Add a headline",
            breakdown: {
              personalInfo: 0,
              experience: 0,
              education: 0,
              skills: 0,
              resume: 0,
              preferences: 0,
              extras: 0,
            },
            missing: [],
          },
          profileViews: profileViews,
        },
      },
    }
  );

  const completion = data?.data?.completion;
  const score = completion?.total ?? initialCompletionScore;
  const views = data?.data?.profileViews ?? profileViews;

  const scoreColor =
    score >= 80 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500";

  const breakdown = completion?.breakdown;
  const nextStep = completion?.nextStep ?? "";
  const milestone = completion?.milestone ?? "NONE";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <User className="h-4 w-4" /> Profile strength
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-xs text-muted-foreground">Strength</span>
            <span className={`text-2xl font-bold ${scoreColor}`}>{score}%</span>
          </div>
          <div className="relative">
            <Progress value={score} className="h-2" />
            {/* Milestone markers */}
            <div className="absolute inset-0 flex pointer-events-none">
              {[25, 50, 75, 100].map((m) => (
                <div
                  key={m}
                  className="absolute top-0 w-px h-2 bg-muted-foreground/30"
                  style={{ left: `${m}%` }}
                />
              ))}
            </div>
          </div>
          {milestone !== "NONE" && (
            <div className="flex items-center gap-1.5 mt-2">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {MILESTONE_LABELS[milestone] ?? milestone}
              </span>
            </div>
          )}
          {nextStep && (
            <p className="text-xs text-muted-foreground mt-1.5">
              Next: {nextStep}
            </p>
          )}
          {score < 80 && (
            <Link
              href="/profile/edit"
              className="text-xs text-primary mt-2 block hover:underline"
            >
              Complete your profile →
            </Link>
          )}
        </div>

        {breakdown && (
          <div className="pt-1 border-t border-border">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showBreakdown ? <ChevronUp className="h-3" /> : <ChevronDown className="h-3" />}
              Section breakdown
            </button>
            {showBreakdown && (
              <div className="mt-2 space-y-1.5">
                {(Object.keys(SECTION_LABELS) as (keyof CompletionBreakdown)[]).map((key) => {
                  const pts = breakdown[key] ?? 0;
                  const max = SECTION_WEIGHTS[key] ?? 0;
                  const pct = max > 0 ? Math.round((pts / max) * 100) : 0;
                  return (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <span className="w-24 text-muted-foreground">{SECTION_LABELS[key]}</span>
                      <Progress value={pct} className="h-1 flex-1 max-w-[120px]" />
                      <span className="text-muted-foreground">{pts}/{max}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground italic">
          Stronger profiles get better job matches
        </p>

        <div className="pt-1 border-t border-border space-y-1">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{views}</span> profile views
            </span>
          </div>
          {profileViewInsights?.canSeeCompanyNames && profileViewInsights.byCompany.length > 0 && (
            <div className="text-xs text-muted-foreground pl-6 space-y-0.5">
              {profileViewInsights.byCompany.slice(0, 3).map((c) => (
                <div key={c.companyName}>
                  {c.count} from {c.companyName}
                </div>
              ))}
            </div>
          )}
          {profileViewInsights && !profileViewInsights.canSeeCompanyNames && views > 0 && (
            <Link href="/settings" className="text-xs text-primary pl-6 block hover:underline">
              Upgrade to see who viewed
            </Link>
          )}
        </div>

        {headline && (
          <p className="text-xs text-muted-foreground truncate">{headline}</p>
        )}
      </CardContent>
    </Card>
  );
}
