"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FitScoreBadge } from "@/components/jobs/FitScoreBadge";
import { cn } from "@/lib/utils";

type Status = "SUBMITTED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW_SCHEDULED" | "OFFERED" | "REJECTED" | "WITHDRAWN";

interface ApplicationCardProps {
  id: string;
  jobTitle: string;
  jobSlug: string;
  companyName: string | null;
  companyLogo: string | null;
  submittedAt: string;
  status: Status;
  fitScoreSnapshot: number | null;
  resumeVersionName: string | null;
  onWithdraw: (id: string) => void;
  withdrawLoading?: boolean;
}

const STATUS_STYLES: Record<Status, string> = {
  SUBMITTED: "bg-muted text-muted-foreground",
  UNDER_REVIEW: "bg-blue-500/20 text-blue-700",
  SHORTLISTED: "bg-green-500/20 text-green-700",
  INTERVIEW_SCHEDULED: "bg-purple-500/20 text-purple-700",
  OFFERED: "bg-amber-500/20 text-amber-700",
  REJECTED: "bg-red-500/20 text-red-700",
  WITHDRAWN: "bg-muted text-muted-foreground",
};

function formatDaysAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export function ApplicationCard({
  id,
  jobTitle,
  jobSlug,
  companyName,
  submittedAt,
  status,
  fitScoreSnapshot,
  resumeVersionName,
  onWithdraw,
  withdrawLoading,
}: ApplicationCardProps) {
  const canWithdraw = status === "SUBMITTED" || status === "UNDER_REVIEW";
  const [appliedLabel, setAppliedLabel] = useState<string>(() =>
    submittedAt ? submittedAt.slice(0, 10) : "—"
  );
  useEffect(() => {
    setAppliedLabel(formatDaysAgo(submittedAt));
  }, [submittedAt]);

  return (
    <div className="ascend-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="min-w-0 flex-1">
        <Link href={`/jobs/${jobSlug}`} className="font-medium text-foreground hover:underline line-clamp-2">
          {jobTitle}
        </Link>
        <p className="text-sm text-muted-foreground mt-0.5">{companyName ?? "Company"}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span suppressHydrationWarning>Applied {appliedLabel}</span>
          <span
            className={cn(
              "rounded px-2 py-0.5 font-medium",
              STATUS_STYLES[status]
            )}
          >
            {status.replace(/_/g, " ")}
          </span>
          {fitScoreSnapshot != null && (
            <FitScoreBadge score={fitScoreSnapshot} size="sm" />
          )}
          {resumeVersionName && (
            <span className="rounded bg-muted px-1.5 py-0.5">Resume: {resumeVersionName}</span>
          )}
        </div>
      </div>
      {canWithdraw && (
        <Button
          variant="outline"
          size="sm"
          disabled={withdrawLoading}
          onClick={() => onWithdraw(id)}
        >
          Withdraw
        </Button>
      )}
    </div>
  );
}
