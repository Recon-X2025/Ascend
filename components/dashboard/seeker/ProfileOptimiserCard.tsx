"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ProfileOptimiserResult {
  headline?: { suggestion?: string; reason?: string } | null;
  summary?: { suggestion?: string; reason?: string } | null;
  skillGaps?: Array<{ skill: string; frequencyPct: number; suggestion: string }>;
  bulletSuggestions?: Array<{ originalBullet: string; suggestedBullet: string; reason: string }>;
}

export function ProfileOptimiserCard() {
  const [result, setResult] = useState<ProfileOptimiserResult | null>(null);
  const [analysedAt, setAnalysedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [targetRole] = useState<string>("your target role");

  useEffect(() => {
    fetch("/api/ai/profile-optimise/result")
      .then((r) => r.json())
      .then((j) => {
        if (j.result) {
          setResult(j.result);
          setAnalysedAt(j.analysedAt ?? null);
        } else {
          setResult(null);
        }
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetch("/api/ai/profile-optimise", { method: "POST" })
      .then((r) => {
        if (r.ok) setTimeout(() => window.location.reload(), 3000);
        return r.json();
      })
      .then(() => {})
      .finally(() => setRefreshing(false));
  };

  const copySuggestion = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result || (!result.headline && !result.summary && (result.skillGaps?.length ?? 0) === 0 && (result.bulletSuggestions?.length ?? 0) === 0)) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold">Your profile for {targetRole}</h3>
          <p className="text-sm text-muted-foreground">
            Get AI suggestions to improve how your profile looks to recruiters.
          </p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Analysing…" : "Analyse profile"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const daysAgo = analysedAt
    ? Math.floor((Date.now() - new Date(analysedAt).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <h3 className="font-semibold">Your profile for {targetRole}</h3>
          {daysAgo != null && (
            <p className="text-xs text-muted-foreground">Last analysed: {daysAgo === 0 ? "today" : `${daysAgo} day(s) ago`}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.headline?.suggestion && (
          <div>
            <p className="text-sm font-medium">Headline</p>
            <p className="text-sm text-muted-foreground mt-1">{result.headline.suggestion}</p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copySuggestion(result.headline!.suggestion!)}>
                Copy suggestion
              </Button>
              <Button variant="link" size="sm" asChild>
                <Link href="/profile/edit#headline">Edit headline →</Link>
              </Button>
            </div>
          </div>
        )}
        {result.summary?.suggestion && (
          <div>
            <p className="text-sm font-medium">Summary</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{result.summary.suggestion}</p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copySuggestion(result.summary!.suggestion!)}>
                Copy suggestion
              </Button>
              <Button variant="link" size="sm" asChild>
                <Link href="/profile/edit#summary">Edit summary →</Link>
              </Button>
            </div>
          </div>
        )}
        {(result.skillGaps?.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-medium">Skill gaps</p>
            <ul className="mt-1 text-sm text-muted-foreground space-y-1">
              {result.skillGaps!.slice(0, 3).map((s, i) => (
                <li key={i}>{s.suggestion}</li>
              ))}
            </ul>
            <Button variant="link" size="sm" asChild className="mt-2 p-0 h-auto">
              <Link href="/profile/edit#skills">Edit skills →</Link>
            </Button>
          </div>
        )}
        {(result.bulletSuggestions?.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-medium">Experience bullets</p>
            <p className="text-xs text-muted-foreground mt-1">Suggestions for your weakest bullets</p>
            <Button variant="link" size="sm" asChild className="mt-2 p-0 h-auto">
              <Link href="/profile/edit#experience">Edit experience →</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
