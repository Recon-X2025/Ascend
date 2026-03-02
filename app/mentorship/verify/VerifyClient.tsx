"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { VerificationStatusBanner } from "@/components/mentorship/VerificationStatusBanner";
import { DocumentUploadZone } from "@/components/mentorship/DocumentUploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => (r.ok ? r.json() : undefined))
    .catch(() => undefined);

type DecisionEntry = {
  decision: string;
  reasonCode: string;
  note: string | null;
  createdAt: string;
};

type StatusResponse = {
  status: string;
  submittedAt: string | null;
  documents: { id: string; type: string; fileName: string; uploadedAt: string; accepted: boolean | null }[];
  linkedInUrl: string | null;
  nextReviewDue: string | null;
  verifiedAt: string | null;
  lastDecision: DecisionEntry | null;
  auditLog?: DecisionEntry[];
};

const LINKEDIN_PATTERN = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i;

export function VerifyClient() {
  const { data, mutate } = useSWR<StatusResponse | undefined>(
    "/api/mentorship/verification/status",
    fetcher
  );
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [linkedInSaving, setLinkedInSaving] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (data?.linkedInUrl) setLinkedInUrl(data.linkedInUrl);
  }, [data?.linkedInUrl]);

  const status = data?.status ?? "UNVERIFIED";
  const showUploads = status === "UNVERIFIED" || status === "REVERIFICATION_REQUIRED";

  const govDocs = (data?.documents ?? []).filter((d) => d.type === "GOVERNMENT_ID");
  const employmentDocs = (data?.documents ?? []).filter((d) => d.type === "EMPLOYMENT_PROOF");
  const hasGovernmentId = govDocs.length > 0;
  const hasEmploymentOrLinkedIn = employmentDocs.length > 0 || !!(data?.linkedInUrl?.trim());
  const canSubmit = hasGovernmentId && hasEmploymentOrLinkedIn;

  const saveLinkedIn = async () => {
    const trimmed = linkedInUrl.trim();
    if (trimmed && !LINKEDIN_PATTERN.test(trimmed)) return;
    setLinkedInSaving(true);
    try {
      const res = await fetch("/api/mentorship/verification/linkedin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedInUrl: trimmed || "" }),
      });
      if (res.ok) await mutate();
    } finally {
      setLinkedInSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitLoading(true);
    setSubmitSuccess(false);
    try {
      const res = await fetch("/api/mentorship/verification/submit", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "Submission failed.");
        return;
      }
      setSubmitSuccess(true);
      await mutate();
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-extrabold text-2xl text-ink">Mentor verification</h1>
          <Link href="/mentorship/dashboard" className="text-green font-body text-sm hover:underline">
            Dashboard
          </Link>
        </div>

        <VerificationStatusBanner
          status={status as "UNVERIFIED" | "PENDING" | "VERIFIED" | "REVERIFICATION_REQUIRED"}
          verifiedAt={data?.verifiedAt}
          nextReviewDue={data?.nextReviewDue}
        />

        {showUploads && (
          <>
            <section>
              <h2 className="font-semibold text-ink mb-3">Documents</h2>
              <div className="space-y-4">
                <DocumentUploadZone
                  label="Government ID"
                  documentType="GOVERNMENT_ID"
                  existingDocs={govDocs}
                  onUploadComplete={mutate}
                />
                <DocumentUploadZone
                  label="Employment proof"
                  documentType="EMPLOYMENT_PROOF"
                  existingDocs={employmentDocs}
                  onUploadComplete={mutate}
                />
              </div>
            </section>

            <section>
              <h2 className="font-semibold text-ink mb-2">LinkedIn profile URL</h2>
              <p className="text-sm text-ink-3 mb-2">
                Required if you don&apos;t upload employment proof. Must match https://linkedin.com/in/username
              </p>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  onBlur={saveLinkedIn}
                  className="max-w-md"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={saveLinkedIn}
                  disabled={linkedInSaving}
                >
                  {linkedInSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </section>

            <section>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitLoading}
              >
                {submitLoading ? "Submitting…" : "Submit for verification"}
              </Button>
              {submitSuccess && (
                <p className="mt-2 text-sm text-green-600">Submitted. We&apos;ll review within 48 hours.</p>
              )}
            </section>
          </>
        )}

        {(data?.auditLog?.length ?? 0) > 0 && (
          <section>
            <h2 className="font-semibold text-ink mb-3">Previous decisions</h2>
            <ul className="space-y-2">
              {(data?.auditLog ?? []).map((entry, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
                >
                  <span className="font-medium">{entry.decision}</span>
                  <span className="text-ink-3"> · {entry.reasonCode}</span>
                  {entry.note && <p className="mt-1 text-ink-3">{entry.note}</p>}
                  <p className="mt-1 text-xs text-ink-4">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
