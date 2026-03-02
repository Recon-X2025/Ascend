"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  SESSION_DID_NOT_HAPPEN: "Session did not happen",
  BELOW_MINIMUM_DURATION: "Below minimum duration",
  STENO_NOT_GENERATED: "Steno not generated",
  OFF_PLATFORM_SOLICITATION: "Off-platform solicitation",
  COMMITMENTS_NOT_MET: "Commitments not met",
};

export function AdminDisputeResolveClient({
  dispute,
}: {
  dispute: {
    id: string;
    contractId: string;
    mentor: { id: string; name: string | null; email: string | null };
    mentee: { id: string; name: string | null; email: string | null };
    milestone: { milestoneNumber: number; type: string };
    tranche: { trancheNumber: number; amountPaise: number; status: string };
    category: string;
    description: string;
    status: string;
    outcome: string | null;
    opsNote: string | null;
    evidence: Array<{ evidenceType: string; content: unknown }>;
    createdAt: string;
    resolvedAt: string | null;
  };
}) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<"UPHELD" | "REJECTED" | "REJECTED_INVALID">("REJECTED");
  const [opsNote, setOpsNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canResolve = dispute.status === "PENDING_OPS";
  const isAutoResolved = dispute.status === "AUTO_RESOLVED";

  const handleResolve = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/mentorship/disputes/${dispute.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, opsNote }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to resolve");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/admin/mentorship" className="text-sm text-green hover:underline">
        ← Mentorship Ops
      </Link>
      <h1 className="text-xl font-semibold">Dispute {dispute.id.slice(0, 8)}…</h1>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Mentor: {dispute.mentor.name ?? dispute.mentor.email}</p>
          <p>Mentee: {dispute.mentee.name ?? dispute.mentee.email}</p>
          <p>Milestone {dispute.milestone.milestoneNumber} · Tranche {dispute.tranche.trancheNumber} · ₹{(dispute.tranche.amountPaise / 100).toLocaleString()}</p>
          <p>Category: {CATEGORY_LABELS[dispute.category] ?? dispute.category}</p>
          <p>Status: <span className="font-medium">{dispute.status}</span> {dispute.outcome && `· ${dispute.outcome}`}</p>
          <p className="mt-2">{dispute.description}</p>
        </CardContent>
      </Card>

      {dispute.evidence?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Evidence</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-48 bg-[var(--surface-2)] p-2 rounded">
              {JSON.stringify(dispute.evidence, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {canResolve && !isAutoResolved && (
        <Card>
          <CardHeader><CardTitle>Resolve</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as "UPHELD" | "REJECTED" | "REJECTED_INVALID")}
                className="w-full p-2 border rounded"
              >
                <option value="UPHELD">Upheld (refund to mentee)</option>
                <option value="REJECTED">Rejected (release to mentor)</option>
                <option value="REJECTED_INVALID">Rejected invalid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ops note (optional)</label>
              <textarea
                value={opsNote}
                onChange={(e) => setOpsNote(e.target.value)}
                className="w-full p-2 border rounded min-h-[60px]"
                maxLength={5000}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleResolve} disabled={submitting}>
              {submitting ? "Resolving..." : "Resolve dispute"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isAutoResolved && (
        <p className="text-sm text-amber-600">This dispute was auto-resolved. Ops cannot override.</p>
      )}
    </div>
  );
}
