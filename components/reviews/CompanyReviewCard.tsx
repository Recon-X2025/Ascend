"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpfulVote } from "./HelpfulVote";
import { ReportButton } from "@/components/common/ReportButton";

interface CompanyReviewCardProps {
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
  /** When true, show report button (authenticated non-owner). */
  canReport?: boolean;
}

function formatDate(employmentStart: string | null, employmentEnd: string | null, createdAt: string) {
  if (employmentStart) {
    const parts = [employmentStart];
    if (employmentEnd) parts.push(employmentEnd);
    return parts.join(" – ");
  }
  return new Date(createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function CompanyReviewCard({
  id,
  headline,
  employmentStatus,
  jobTitle,
  employmentStart,
  employmentEnd,
  overallRating,
  pros,
  cons,
  advice,
  helpfulCount,
  unhelpfulCount,
  createdAt,
  canReport = false,
}: CompanyReviewCardProps) {
  const statusLabel = employmentStatus === "CURRENT" ? "Current" : "Former";
  const titleLabel = `${statusLabel} ${jobTitle}`;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg">{headline || "Review"}</h3>
          <ReportButton
            targetType="COMPANY_REVIEW"
            targetId={id}
            canReport={canReport}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="text-primary">{"★".repeat(Math.round(overallRating))}</span>
          <Badge variant="secondary" className="font-normal">
            {titleLabel}
          </Badge>
          <span>{formatDate(employmentStart, employmentEnd, createdAt)}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Pros</p>
          <p className="text-sm mt-1">{pros}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Cons</p>
          <p className="text-sm mt-1">{cons}</p>
        </div>
        {advice && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Advice to management</p>
            <p className="text-sm mt-1">{advice}</p>
          </div>
        )}
        <HelpfulVote
          reviewId={id}
          reviewType="company"
          helpfulCount={helpfulCount}
          unhelpfulCount={unhelpfulCount}
        />
      </CardContent>
    </Card>
  );
}
