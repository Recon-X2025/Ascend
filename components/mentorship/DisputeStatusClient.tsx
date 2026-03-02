"use client";

import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  SESSION_DID_NOT_HAPPEN: "Session did not happen",
  BELOW_MINIMUM_DURATION: "Below minimum duration",
  STENO_NOT_GENERATED: "Steno not generated",
  OFF_PLATFORM_SOLICITATION: "Off-platform solicitation",
  COMMITMENTS_NOT_MET: "Commitments not met",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_EVIDENCE: "Gathering evidence...",
  EVIDENCE_ASSEMBLED: "Evidence assembled",
  AUTO_RESOLVING: "Resolving...",
  AUTO_RESOLVED: "Auto-resolved",
  PENDING_OPS: "Under review",
  RESOLVED: "Resolved",
};

const OUTCOME_LABELS: Record<string, string> = {
  UPHELD: "Upheld (refund to you)",
  REJECTED: "Rejected (release to mentor)",
  REJECTED_INVALID: "Rejected (invalid)",
};

export function DisputeStatusClient({
  dispute,
  isMentee,
  engagementUrl,
}: {
  dispute: {
    id: string;
    contractId: string;
    milestoneNumber: number;
    trancheNumber: number;
    amountPaise: number;
    trancheStatus: string;
    category: string;
    description: string;
    status: string;
    outcome: string | null;
    opsNote: string | null;
    createdAt: string;
    resolvedAt: string | null;
    filedByUserId: string;
  };
  isMentee: boolean;
  engagementUrl: string;
}) {
  return (
    <div className="space-y-6">
      <Link href={engagementUrl} className="text-sm text-green hover:underline">
        ← Back to engagement
      </Link>
      <h1 className="text-xl font-semibold">Dispute status</h1>

      <div className="rounded-xl border p-4 space-y-2">
        <p className="text-sm text-ink-3">
          Milestone {dispute.milestoneNumber} · Tranche {dispute.trancheNumber} · ₹
          {(dispute.amountPaise / 100).toLocaleString()}
        </p>
        <p className="text-sm font-medium">
          {CATEGORY_LABELS[dispute.category] ?? dispute.category}
        </p>
        <p className="text-sm text-ink-3">{dispute.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-ink-4/20">
            {STATUS_LABELS[dispute.status] ?? dispute.status}
          </span>
          {dispute.outcome && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                dispute.outcome === "UPHELD" ? "bg-green/20 text-green" : "bg-amber-500/20 text-amber-700"
              }`}
            >
              {OUTCOME_LABELS[dispute.outcome] ?? dispute.outcome}
            </span>
          )}
        </div>
        {dispute.opsNote && (
          <p className="text-sm text-ink-3 mt-2 italic">Ops note: {dispute.opsNote}</p>
        )}
        <p className="text-xs text-ink-4">
          Filed {new Date(dispute.createdAt).toLocaleString()}
          {dispute.resolvedAt &&
            ` · Resolved ${new Date(dispute.resolvedAt).toLocaleString()}`}
        </p>
      </div>

      {isMentee && dispute.status === "PENDING_OPS" && (
        <p className="text-sm text-ink-3">
          Our team will review your dispute within 5 business days.
        </p>
      )}
    </div>
  );
}
