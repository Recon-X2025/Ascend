"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ApplicationStatus } from "@/lib/applications/types";

interface ApplicationDetail {
  id: string;
  applicantName: string | null;
  applicantHeadline: string | null;
  applicantProfileUrl: string | null;
  coverLetter: string | null;
  responses: unknown;
  resumeVersion: { id: string; name: string } | null;
  fitScoreSnapshot: number | null;
  submittedAt: string;
  status: ApplicationStatus;
  recruiterNotes: string | null;
}

interface ApplicationDrawerProps {
  applicationId: string | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export function ApplicationDrawer({
  applicationId,
  open,
  onClose,
  onStatusUpdated,
}: ApplicationDrawerProps) {
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!applicationId || !open) {
      setDetail(null);
      return;
    }
    fetch(`/api/applications/${applicationId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setDetail(data);
          setNotes(data.recruiterNotes ?? "");
        } else {
          setDetail(null);
        }
      })
      .catch(() => setDetail(null));
  }, [applicationId, open]);

  const handleSaveNotes = () => {
    if (!applicationId || savingNotes) return;
    setSavingNotes(true);
    fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recruiterNotes: notes }),
    })
      .then(() => onStatusUpdated())
      .finally(() => setSavingNotes(false));
  };

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!applicationId) return;
    const res = await fetch(`/api/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setDetail((d) => (d ? { ...d, status: data.status } : null));
      onStatusUpdated();
    }
  };

  const responses = detail?.responses as Array<{ question: string; answer: string }> | undefined;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Application details</SheetTitle>
        </SheetHeader>
        {detail && (
          <div className="mt-6 space-y-4">
            <div>
              <p className="font-medium">{detail.applicantName ?? "Applicant"}</p>
              {detail.applicantHeadline && (
                <p className="text-sm text-muted-foreground">{detail.applicantHeadline}</p>
              )}
              {detail.applicantProfileUrl && (
                <a
                  href={detail.applicantProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View profile →
                </a>
              )}
            </div>
            {detail.resumeVersion && (
              <p className="text-sm">Resume attached: {detail.resumeVersion.name}</p>
            )}
            {detail.fitScoreSnapshot != null && (
              <p className="text-sm">Fit score at application: {detail.fitScoreSnapshot}/100</p>
            )}
            <p className="text-xs text-muted-foreground">
              Applied {new Date(detail.submittedAt).toLocaleString()}
            </p>
            {detail.coverLetter && (
              <div>
                <Label>Cover letter</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap rounded border border-border p-2 bg-muted/30">
                  {detail.coverLetter}
                </p>
              </div>
            )}
            {Array.isArray(responses) && responses.length > 0 && (
              <div>
                <Label>Screening responses</Label>
                <ul className="mt-1 space-y-2">
                  {responses.map((r, i) => (
                    <li key={i} className="text-sm rounded border border-border p-2 bg-muted/30">
                      <p className="font-medium text-muted-foreground">{r.question}</p>
                      <p className="mt-0.5">{r.answer}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <Label>Recruiter notes (internal)</Label>
              <textarea
                className="mt-1 w-full min-h-[100px] rounded border border-input bg-background px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
              />
              {savingNotes && <p className="text-xs text-muted-foreground">Saving…</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {["UNDER_REVIEW", "SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFERED", "REJECTED"].map(
                (s) => (
                  <Button
                    key={s}
                    variant={detail.status === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(s as ApplicationStatus)}
                  >
                    {s.replace(/_/g, " ")}
                  </Button>
                )
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
