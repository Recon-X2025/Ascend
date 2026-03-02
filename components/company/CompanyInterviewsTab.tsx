"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CompanyInterviewsTab({ slug }: { slug: string }) {
  const [data, setData] = useState<{ reviews: Array<{ id: string; jobTitle: string; experience: string; difficulty: string; process: string; sampleQuestions: string[]; durationDays: number | null; createdAt: string }>; totalCount: number; experienceBreakdown: { positive: number; neutral: number; negative: number }; avgDifficulty: number; offerRate: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/companies/${slug}/interviews?page=${page}&limit=10`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [slug, page]);

  if (loading || !data) return <p className="mt-6 text-muted-foreground">Loading...</p>;
  const totalPages = Math.ceil(data.totalCount / 10) || 1;
  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Interview experiences</h2>
        <Button asChild><Link href={`/companies/${slug}/interviews/new`}>Share Interview Experience</Link></Button>
      </div>
      <Card><CardContent className="pt-6">
        <p className="text-sm">Positive: {data.experienceBreakdown.positive} · Neutral: {data.experienceBreakdown.neutral} · Negative: {data.experienceBreakdown.negative}</p>
        <p className="text-sm mt-1">Avg difficulty: {data.avgDifficulty} · Offer rate: {data.offerRate}%</p>
      </CardContent></Card>
      <div className="space-y-4">
        {data.reviews.map((r) => (
          <Card key={r.id}><CardContent className="pt-6">
            <p className="font-medium">{r.jobTitle} · {r.experience} · Difficulty {r.difficulty}</p>
            <p className="text-sm text-muted-foreground mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
            <p className="mt-2 text-sm">{r.process}</p>
            {r.sampleQuestions.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Sample questions: {r.sampleQuestions.join("; ")}</p>}
          </CardContent></Card>
        ))}
      </div>
      {totalPages > 1 && <div className="flex justify-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button></div>}
    </div>
  );
}
