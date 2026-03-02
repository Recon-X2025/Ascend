"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { RatingSummaryCard } from "@/components/reviews/RatingSummaryCard";
import { CompanyReviewCard } from "@/components/reviews/CompanyReviewCard";

interface CompanyReviewsSectionProps {
  companyId: string;
  companySlug: string;
}

type Sort = "recent" | "helpful" | "rating_high" | "rating_low";

export function CompanyReviewsSection({ companyId, companySlug }: CompanyReviewsSectionProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<{
    reviews: Array<{
      id: string;
      headline: string;
      employmentStatus: string;
      jobTitle: string;
      employmentStart: string | null;
      employmentEnd: string | null;
      overallRating: number;
      pros: string;
      cons: string;
      advice: string | null;
      helpfulCount: number;
      unhelpfulCount: number;
      createdAt: string;
    }>;
    totalCount: number;
    aggregate: {
      overallAvg: number;
      workLifeAvg: number;
      salaryAvg: number;
      cultureAvg: number;
      careerAvg: number;
      managementAvg: number;
      recommendPct: number;
      ceoApprovalPct: number | null;
      reviewCount: number;
    } | null;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<Sort>("recent");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews/company?companyId=${companyId}&page=${page}&limit=10&sort=${sort}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [companyId, page, sort]);

  if (loading && !data) return <p className="text-muted-foreground mt-6">Loading...</p>;

  const aggregate = data?.aggregate ?? null;
  const reviews = data?.reviews ?? [];
  const totalPages = data ? Math.ceil(data.totalCount / 10) : 0;

  return (
    <div className="mt-6 space-y-6">
      <RatingSummaryCard
        companyId={companyId}
        companySlug={companySlug}
        aggregate={aggregate}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <div className="flex gap-2">
          {(["recent", "helpful", "rating_high", "rating_low"] as const).map((s) => (
            <Button
              key={s}
              variant={sort === s ? "default" : "outline"}
              size="sm"
              onClick={() => setSort(s)}
            >
              {s === "recent"
                ? "Most Recent"
                : s === "helpful"
                  ? "Most Helpful"
                  : s === "rating_high"
                    ? "Highest Rated"
                    : "Lowest Rated"}
            </Button>
          ))}
        </div>
      </div>
      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Be the first to review this company.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <CompanyReviewCard
              key={r.id}
              id={r.id}
              headline={r.headline}
              employmentStatus={r.employmentStatus}
              jobTitle={r.jobTitle}
              employmentStart={r.employmentStart}
              employmentEnd={r.employmentEnd}
              overallRating={r.overallRating}
              pros={r.pros}
              cons={r.cons}
              advice={r.advice}
              helpfulCount={r.helpfulCount}
              unhelpfulCount={r.unhelpfulCount}
              createdAt={r.createdAt}
              canReport={!!session?.user?.id}
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
