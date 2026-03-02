"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FitScoreBadge } from "@/components/jobs/FitScoreBadge";
import { cn } from "@/lib/utils";

type Status = "SUBMITTED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW_SCHEDULED" | "OFFERED" | "REJECTED" | "WITHDRAWN";

interface ApplicantCardProps {
  id: string;
  applicantName: string | null;
  applicantAvatar: string | null;
  applicantHeadline: string | null;
  applicantLocation: string | null;
  applicantProfileUrl: string | null;
  fitScoreSnapshot: number | null;
  submittedAt: string;
  status: Status;
  onViewApplication: (id: string) => void;
  onStatusChange?: (id: string, newStatus: Status) => void;
  onOpenFitExplainer?: (id: string) => void;
  onOpenScorecard?: (id: string) => void;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview" },
  { value: "OFFERED", label: "Offered" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_STYLES: Record<Status, string> = {
  SUBMITTED: "bg-muted text-muted-foreground",
  UNDER_REVIEW: "bg-blue-500/20 text-blue-700",
  SHORTLISTED: "bg-green-500/20 text-green-700",
  INTERVIEW_SCHEDULED: "bg-purple-500/20 text-purple-700",
  OFFERED: "bg-amber-500/20 text-amber-700",
  REJECTED: "bg-red-500/20 text-red-700",
  WITHDRAWN: "bg-muted text-muted-foreground",
};

export function ApplicantCard({
  id,
  applicantName,
  applicantAvatar,
  applicantHeadline,
  applicantLocation,
  fitScoreSnapshot,
  submittedAt,
  status,
  onViewApplication,
  onStatusChange,
  onOpenFitExplainer,
  onOpenScorecard,
}: ApplicantCardProps) {
  const canChangeStatus = status !== "WITHDRAWN" && status !== "OFFERED" && status !== "REJECTED";

  return (
    <div className="ascend-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={applicantAvatar ?? undefined} />
          <AvatarFallback>{(applicantName ?? "A").slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium truncate">{applicantName ?? "Applicant"}</p>
          {applicantHeadline && <p className="text-sm text-muted-foreground truncate">{applicantHeadline}</p>}
          {applicantLocation && <p className="text-xs text-muted-foreground">{applicantLocation}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {fitScoreSnapshot != null && (
          <>
            <FitScoreBadge score={fitScoreSnapshot} size="sm" />
            {onOpenFitExplainer && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => onOpenFitExplainer(id)}
              >
                Why {fitScoreSnapshot}%?
              </button>
            )}
          </>
        )}
        <span className="text-xs text-muted-foreground">
          {new Date(submittedAt).toLocaleDateString()}
        </span>
        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_STYLES[status])}>
          {status.replace(/_/g, " ")}
        </span>
        {canChangeStatus && onStatusChange && (
          <select
            className="rounded border border-input bg-background px-2 py-1 text-xs"
            value=""
            onChange={(e) => {
              const v = e.target.value as Status;
              if (v) onStatusChange(id, v);
              e.target.value = "";
            }}
          >
            <option value="">Change status</option>
            {STATUS_OPTIONS.filter((o) => o.value !== status).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
        {onOpenScorecard && (
          <Button variant="ghost" size="sm" onClick={() => onOpenScorecard(id)}>
            Scorecard
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onViewApplication(id)}>
          View Application
        </Button>
      </div>
    </div>
  );
}
