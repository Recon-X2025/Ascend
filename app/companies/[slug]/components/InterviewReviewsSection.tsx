"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InterviewReviewCard } from "@/components/reviews/InterviewReviewCard";

interface InterviewReviewsSectionProps {
  companyId: string;
  companySlug: string;
}

export function InterviewReviewsSection({ companyId, companySlug }: InterviewReviewsSectionProps) {
  const [data, setData] = useState<{
    reviews: Array<{
      id: string;
      headline: string;
      jobTitle: string;
      interviewYear: number | null;
      interviewResult: string | null;
      difficulty: string;
      experience: string;
      overallRating: number;
      processDesc: string;
      questions: string | null;
      tips: string | null;
      helpfulCount: number;
      unhelpfulCount: number;
      createdAt: string;
    }>;
    totalCount: number;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews/interview?companyId=${companyId}&page=${page}&limit=10`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [companyId, page]);

  if (loading && !data) return <p className="text-muted-foreground mt-6">Loading...</p>;

  const reviews = data?.reviews ?? [];
  const totalPages = data ? Math.ceil(data.totalCount / 10) : 0;

  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/companies/${companySlug}`}>View company</Link>
        </Button>
        <Button asChild>
          <Link href={`/reviews/interview/new?companyId=${companyId}`}>
            Share your interview experience →
          </Link>
        </Button>
      </div>
      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No interview reviews yet. Be the first to share your experience.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <InterviewReviewCard
              key={r.id}
              id={r.id}
              headline={r.headline}
              jobTitle={r.jobTitle}
              interviewYear={r.interviewYear}
              interviewResult={r.interviewResult}
              difficulty={r.difficulty}
              experience={r.experience}
              overallRating={r.overallRating}
              processDesc={r.processDesc}
              questions={r.questions}
              tips={r.tips}
              helpfulCount={r.helpfulCount}
              unhelpfulCount={r.unhelpfulCount}
              createdAt={r.createdAt}
            />
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
