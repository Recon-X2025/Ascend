"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FitGapItem {
  item: string;
  importance: "critical" | "important" | "minor";
  suggestion: string;
}

interface FitScoreData {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  keywordsScore: number;
  skillGaps: FitGapItem[];
  experienceGaps: FitGapItem[];
  keywordGaps: FitGapItem[];
  strengths: string[];
  cached: boolean;
  computedAt: string;
}

interface FitScoreCardProps {
  jobPostId: string | number;
  jobSlug?: string;
}

function scoreRingColor(score: number): string {
  if (score < 40) return "stroke-red-500";
  if (score < 60) return "stroke-amber-500";
  if (score < 80) return "stroke-yellow-500";
  return "stroke-green-500";
}

export function FitScoreCard({ jobPostId, jobSlug }: FitScoreCardProps) {
  const [data, setData] = useState<FitScoreData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGap, setExpandedGap] = useState<number | null>(null);

  const fetchScore = useCallback(
    async (refresh = false) => {
      setLoading(true);
      try {
        const url = `/api/jobs/${jobPostId}/fit-score${refresh ? "?refresh=true" : ""}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.score === null && json.message) {
          setMessage(json.message);
          setData(null);
          return;
        }
        if (json.error) {
          setMessage("Could not load fit score");
          setData(null);
          return;
        }
        setMessage(null);
        setData({
          overallScore: json.overallScore,
          skillsScore: json.skillsScore,
          experienceScore: json.experienceScore,
          educationScore: json.educationScore,
          keywordsScore: json.keywordsScore,
          skillGaps: json.skillGaps ?? [],
          experienceGaps: json.experienceGaps ?? [],
          keywordGaps: json.keywordGaps ?? [],
          strengths: json.strengths ?? [],
          cached: json.cached ?? false,
          computedAt: json.computedAt ?? new Date().toISOString(),
        });
      } catch {
        setMessage("Could not load fit score");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [jobPostId]
  );

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  if (loading && !data) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full border-4 border-muted bg-muted/50 animate-pulse" />
          </div>
          <p className="text-center text-sm text-muted-foreground">Your Fit Score</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {[40, 30, 10, 20].map((w) => (
            <div key={w} className="space-y-1">
              <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (message && !data) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="relative flex justify-center">
            <div className="h-20 w-20 rounded-full border-4 border-muted bg-muted/30 blur-sm" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-muted-foreground">
              —
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">{message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const allGaps = [...data.skillGaps, ...data.experienceGaps, ...data.keywordGaps].slice(0, 3);
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dash = (data.overallScore / 100) * circumference;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="relative flex justify-center">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <circle
              cx="48"
              cy="48"
              r={r}
              fill="none"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - dash}
              strokeLinecap="round"
              className={cn("transition-all duration-500", scoreRingColor(data.overallScore))}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
            {data.overallScore}
          </span>
        </div>
        <p className="text-center text-sm text-muted-foreground">Your Fit Score</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-muted-foreground">Skills (40%)</span>
              <span>{data.skillsScore}%</span>
            </div>
            <Progress value={data.skillsScore} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-muted-foreground">Experience (30%)</span>
              <span>{data.experienceScore}%</span>
            </div>
            <Progress value={data.experienceScore} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-muted-foreground">Education (10%)</span>
              <span>{data.educationScore}%</span>
            </div>
            <Progress value={data.educationScore} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-muted-foreground">Keywords (20%)</span>
              <span>{data.keywordsScore}%</span>
            </div>
            <Progress value={data.keywordsScore} className="h-1.5" />
          </div>
        </div>

        {allGaps.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Top gaps</p>
            <ul className="space-y-1">
              {allGaps.map((gap, i) => (
                <li key={i} className="text-xs">
                  <button
                    type="button"
                    onClick={() => setExpandedGap(expandedGap === i ? null : i)}
                    className="text-left w-full rounded border border-border bg-muted/30 px-2 py-1.5"
                  >
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium mr-1.5",
                        gap.importance === "critical" && "bg-red-500/20 text-red-700",
                        gap.importance === "important" && "bg-amber-500/20 text-amber-700",
                        gap.importance === "minor" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {gap.importance}
                    </span>
                    {gap.item}
                  </button>
                  {expandedGap === i && (
                    <p className="mt-1 pl-2 text-muted-foreground border-l-2 border-border">{gap.suggestion}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.strengths.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Strengths</p>
            <div className="flex flex-wrap gap-1">
              {data.strengths.slice(0, 3).map((s, i) => (
                <span
                  key={i}
                  className="rounded bg-green-500/10 text-green-700 px-2 py-0.5 text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 pt-1">
          <button
            type="button"
            onClick={() => fetchScore(true)}
            className="text-xs text-primary hover:underline"
          >
            Refresh score
          </button>
          <Link
            href={jobSlug ? `/jobs/${jobSlug}/optimise` : `/jobs/${jobPostId}/optimise`}
            className="text-xs text-primary hover:underline"
          >
            Optimise Resume for this Job →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
