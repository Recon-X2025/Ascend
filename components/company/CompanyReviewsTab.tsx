"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CompanyReviewsTabProps {
  slug: string;
}

export function CompanyReviewsTab({ slug }: CompanyReviewsTabProps) {
  const [data, setData] = useState<{
    reviews: Array<{ id: string; overallRating: number; pros: string; cons: string; advice: string | null; recommend: boolean; helpfulCount: number; notHelpfulCount: number; createdAt: string; reviewer: { name: string; image: string | null }; jobTitle: string }>;
    totalCount: number;
    averageRating: number;
    ratingBreakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
    subRatings: { workLife: number | null; salary: number | null; culture: number | null; career: number | null; management: number | null };
  } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/companies/${slug}/reviews?page=${page}&limit=10`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [slug, page]);

  if (loading || !data) return <p className="mt-6 text-muted-foreground">Loading...</p>;
  const totalPages = Math.ceil(data.totalCount / 10) || 1;
  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <Button asChild><Link href={`/companies/${slug}/reviews/new`}>Write a Review</Link></Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-2xl font-semibold">⭐ {data.averageRating.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Based on {data.totalCount} reviews</p>
          <div className="flex gap-4 mt-2 text-sm">
            {([5, 4, 3, 2, 1] as const).map((n) => (
              <span key={n}>{n} ★: {data.ratingBreakdown[n]}</span>
            ))}
          </div>
          {data.subRatings && (
            <div className="mt-2 text-sm text-muted-foreground">
              Work-life: {data.subRatings.workLife ?? "—"} | Salary: {data.subRatings.salary ?? "—"} | Culture: {data.subRatings.culture ?? "—"}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="space-y-4">
        {data.reviews.map((r) => (
          <Card key={r.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{r.reviewer.name} · {r.jobTitle}</p>
                  <p className="text-sm text-muted-foreground">⭐ {r.overallRating} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline">Helpful ({r.helpfulCount})</Button>
                  <Button size="sm" variant="outline">Not helpful ({r.notHelpfulCount})</Button>
                </div>
              </div>
              <p className="mt-2 text-sm"><strong>Pros:</strong> {r.pros}</p>
              <p className="mt-1 text-sm"><strong>Cons:</strong> {r.cons}</p>
              {r.advice && <p className="mt-1 text-sm"><strong>Advice:</strong> {r.advice}</p>}
              {r.recommend && <p className="mt-1 text-xs text-muted-foreground">Recommends</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
