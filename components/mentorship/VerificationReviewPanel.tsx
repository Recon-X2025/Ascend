"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VERIFICATION_REASON_CODES } from "@/lib/mentorship/verification-codes";
import type { VerificationDecision } from "@prisma/client";

type Doc = {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  accepted: boolean | null;
};

type AuditEntry = {
  decision: string;
  reasonCode: string;
  note: string | null;
  createdAt: string;
};

export type VerificationRow = {
  id: string;
  mentorProfileId: string;
  mentorUserId?: string;
  status: string;
  submittedAt: string | null;
  mentorName: string | null;
  mentorEmail: string | null;
  headline: string;
  linkedInUrl: string | null;
  documents: Doc[];
  auditLog: AuditEntry[];
  slaIndicator: "green" | "amber" | "red";
  hoursSinceSubmission: number;
};

interface VerificationReviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: VerificationRow | null;
  onDecisionSubmitted: () => void;
}

export function VerificationReviewPanel({
  open,
  onOpenChange,
  row,
  onDecisionSubmitted,
}: VerificationReviewPanelProps) {
  const [decision, setDecision] = useState<VerificationDecision | "">("");
  const [reasonCode, setReasonCode] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const resetForm = () => {
    setDecision("");
    setReasonCode("");
    setNote("");
    setConfirmOpen(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!row || !decision || !reasonCode) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/mentorship/verification/${row.id}/decide`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            reasonCode,
            note: note.trim() || undefined,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Failed to submit decision.");
        return;
      }
      resetForm();
      onDecisionSubmitted();
      handleClose(false);
    } finally {
      setSubmitting(false);
    }
  };

  const reasonCodesByDecision = () => {
    if (decision === "APPROVED") {
      return ["APPROVED_FULL", "APPROVED_PARTIAL"];
    }
    if (decision === "MORE_INFO_REQUESTED") {
      return [
        "ID_UNCLEAR",
        "EMPLOYMENT_MISMATCH",
        "LINKEDIN_MISMATCH",
        "ADDITIONAL_PROOF_REQUIRED",
      ];
    }
    if (decision === "REJECTED") {
      return [
        "FAKE_DOCUMENTS",
        "INELIGIBLE_EXPERIENCE",
        "DUPLICATE_ACCOUNT",
        "POLICY_VIOLATION",
      ];
    }
    return [];
  };

  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Review verification</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <p className="font-medium">{row.mentorName ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{row.mentorEmail ?? "—"}</p>
            <p className="text-sm text-muted-foreground mt-1">{row.headline}</p>
            {row.linkedInUrl && (
              <a
                href={row.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block mt-1"
              >
                LinkedIn profile →
              </a>
            )}
            {row.mentorUserId && (
              <a
                href={`/mentors/${row.mentorUserId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block mt-1"
              >
                View mentor profile →
              </a>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">Documents</Label>
            <ul className="mt-2 space-y-2">
              {row.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{d.type.replace(/_/g, " ")}</span>
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate max-w-[200px]"
                  >
                    {d.fileName}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {row.auditLog.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Previous decisions</Label>
              <ul className="mt-2 space-y-2">
                {row.auditLog.map((e, i) => (
                  <li key={i} className="text-sm rounded border p-2 bg-muted/30">
                    <span className="font-medium">{e.decision}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {VERIFICATION_REASON_CODES[e.reasonCode as keyof typeof VERIFICATION_REASON_CODES] ?? e.reasonCode}
                    </span>
                    {e.note && <p className="mt-1 text-muted-foreground">{e.note}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(e.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium">Decision</Label>
            <div className="flex gap-4">
              {(["APPROVED", "MORE_INFO_REQUESTED", "REJECTED"] as const).map((d) => (
                <label key={d} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    checked={decision === d}
                    onChange={() => {
                      setDecision(d);
                      setReasonCode("");
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {d === "APPROVED"
                      ? "Approve"
                      : d === "MORE_INFO_REQUESTED"
                      ? "Request more info"
                      : "Reject"}
                  </span>
                </label>
              ))}
            </div>

            {decision && (
              <>
                <div>
                  <Label className="text-sm font-medium">Reason (required)</Label>
                  <Select
                    value={reasonCode}
                    onValueChange={setReasonCode}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {reasonCodesByDecision().map((code) => (
                        <SelectItem key={code} value={code}>
                          {VERIFICATION_REASON_CODES[code as keyof typeof VERIFICATION_REASON_CODES]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Note to mentor (optional)</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Shown to the mentor"
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                {!confirmOpen ? (
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={!reasonCode || submitting}
                  >
                    Submit decision
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting…" : "Confirm"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
