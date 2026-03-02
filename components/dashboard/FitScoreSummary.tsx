"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FitScoreBadge } from "@/components/jobs/FitScoreBadge";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface FitScoreEntry {
  jobPostId: number;
  jobTitle: string;
  companyName: string | null;
  slug: string;
  overallScore: number;
  computedAt: string;
  trend: "up" | "down" | "stable" | null;
}

export function FitScoreSummary() {
  const [scores, setScores] = useState<FitScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/fit-scores")
      .then((r) => r.json())
      .then((j) => {
        if (j.scores && Array.isArray(j.scores)) {
          setScores(j.scores.slice(0, 5));
        } else {
          setScores([]);
        }
      })
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Recent Fit Scores</CardTitle>
        <p className="text-sm text-muted-foreground">
          Jobs you’ve viewed with a computed fit score
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : scores.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No fit scores yet. Open a job to see how well you match.
          </p>
        ) : (
          <ul className="space-y-3">
            {scores.map((s) => (
              <li
                key={s.jobPostId}
                className="flex items-center justify-between gap-2 rounded border border-border p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{s.jobTitle}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.companyName ?? "Company"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.trend === "up" && <ArrowUp className="h-4 w-4 text-green-500" />}
                  {s.trend === "down" && <ArrowDown className="h-4 w-4 text-red-500" />}
                  {s.trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                  <FitScoreBadge score={s.overallScore} size="sm" />
                  <Link
                    href={"/jobs/" + s.slug}
                    className="text-xs text-primary hover:underline"
                  >
                    View Job
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link href="/jobs?saved=true">
          <Button variant="outline" size="sm" className="w-full">
            Compute scores for saved jobs
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
