"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface HistoryEntry {
  overallScore: number;
  recordedAt: string;
}

interface FitScoreBreakdownProps {
  jobPostId: string | number;
}

export function FitScoreBreakdown({ jobPostId }: FitScoreBreakdownProps) {
  const [data, setData] = useState<FitScoreData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHow, setShowHow] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scoreRes, historyRes] = await Promise.all([
        fetch(`/api/jobs/${jobPostId}/fit-score`),
        fetch(`/api/jobs/${jobPostId}/fit-score/history`),
      ]);
      const scoreJson = await scoreRes.json();
      if (scoreJson.message && !scoreJson.overallScore) {
        setData(null);
      } else if (!scoreJson.error) {
        setData({
          overallScore: scoreJson.overallScore,
          skillsScore: scoreJson.skillsScore,
          experienceScore: scoreJson.experienceScore,
          educationScore: scoreJson.educationScore,
          keywordsScore: scoreJson.keywordsScore,
          skillGaps: scoreJson.skillGaps ?? [],
          experienceGaps: scoreJson.experienceGaps ?? [],
          keywordGaps: scoreJson.keywordGaps ?? [],
          strengths: scoreJson.strengths ?? [],
          cached: scoreJson.cached ?? false,
          computedAt: scoreJson.computedAt ?? new Date().toISOString(),
        });
      } else {
        setData(null);
      }
      if (historyRes.ok) {
        const historyJson = await historyRes.json();
        setHistory(Array.isArray(historyJson.history) ? historyJson.history.slice(0, 5) : []);
      } else {
        setHistory([]);
      }
    } catch {
      setData(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [jobPostId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fit score</CardTitle>
          <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-24 rounded bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Sign in as a job seeker to see your fit score for this job.</p>
        </CardContent>
      </Card>
    );
  }

  const allGaps = [
    ...data.skillGaps.map((g) => ({ ...g, category: "Skill" })),
    ...data.experienceGaps.map((g) => ({ ...g, category: "Experience" })),
    ...data.keywordGaps.map((g) => ({ ...g, category: "Keyword" })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fit score breakdown</CardTitle>
        <p className="text-sm text-muted-foreground">
          Overall: <strong>{data.overallScore}</strong>/100 · Last computed:{" "}
          {new Date(data.computedAt).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium">Sub-scores</p>
          <div className="grid gap-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Skills (40%)</span>
                <span>{data.skillsScore}%</span>
              </div>
              <Progress value={data.skillsScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Experience (30%)</span>
                <span>{data.experienceScore}%</span>
              </div>
              <Progress value={data.experienceScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Education (10%)</span>
                <span>{data.educationScore}%</span>
              </div>
              <Progress value={data.educationScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Keywords (20%)</span>
                <span>{data.keywordsScore}%</span>
              </div>
              <Progress value={data.keywordsScore} className="h-2" />
            </div>
          </div>
        </div>

        {allGaps.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Gaps to improve</p>
            <ul className="space-y-2">
              {allGaps.map((gap, i) => (
                <li
                  key={i}
                  className={cn(
                    "rounded border p-2 text-sm",
                    gap.importance === "critical" && "border-red-500/40 bg-red-500/5",
                    gap.importance === "important" && "border-amber-500/40 bg-amber-500/5",
                    gap.importance === "minor" && "border-border bg-muted/30"
                  )}
                >
                  <span className="text-xs text-muted-foreground uppercase">{gap.category}</span>
                  <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium ml-2", 
                    gap.importance === "critical" && "bg-red-500/20 text-red-700",
                    gap.importance === "important" && "bg-amber-500/20 text-amber-700",
                    gap.importance === "minor" && "bg-muted"
                  )}>
                    {gap.importance}
                  </span>
                  <p className="font-medium mt-1">{gap.item}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{gap.suggestion}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.strengths.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Strengths</p>
            <div className="flex flex-wrap gap-2">
              {data.strengths.map((s, i) => (
                <span
                  key={i}
                  className="rounded bg-green-500/10 text-green-700 px-2 py-1 text-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Score history (last 5)</p>
            <div className="flex items-end gap-1 h-12">
              {[...history].reverse().map((h, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0 rounded-t bg-primary/30 flex flex-col justify-end"
                  style={{ height: `${Math.max(8, (h.overallScore / 100) * 48)}px` }}
                  title={`${h.overallScore} on ${new Date(h.recordedAt).toLocaleDateString()}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Oldest ← → Newest</p>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setShowHow(!showHow)}
            className="text-sm text-primary hover:underline"
          >
            {showHow ? "Hide" : "How is this calculated?"}
          </button>
          {showHow && (
            <div className="mt-2 rounded border border-border bg-muted/30 p-3 text-sm text-muted-foreground space-y-2">
              <p><strong>Skills (40%):</strong> Match between your skills and the job’s must-have and nice-to-have skills.</p>
              <p><strong>Experience (30%):</strong> Your years of experience vs the role’s requirements; bonus for relevant job titles.</p>
              <p><strong>Education (10%):</strong> Your highest education level vs the role’s requirement.</p>
              <p><strong>Keywords (20%):</strong> Overlap between job keywords and your resume/skills.</p>
              <p>Overall = weighted average. Gaps show what to improve; strengths show what already matches.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
