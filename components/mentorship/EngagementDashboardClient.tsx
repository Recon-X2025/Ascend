"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))));

type Session = {
  id: string;
  sessionNumber: number;
  scheduledAt: string | null;
  status: string;
  sharedNotes: string | null;
  durationMinutes: number | null;
};
type Milestone = {
  id: string;
  milestoneNumber: number;
  type: string;
  dueDate: string;
  status: string;
  mentorAssessment: string | null;
  menteeAssessment: string | null;
};
type Document = {
  id: string;
  type: string;
  content: unknown;
  mentorSigned: boolean;
  menteeSigned: boolean;
} | null;

type EscrowPayload = {
  id: string;
  status: string;
  paymentMode?: string;
  fundedAt?: string | null;
  totalAmountPaise: number;
  tranches: Array<{
    id: string;
    trancheNumber: number;
    amountPaise: number;
    status: string;
    autoReleaseAt: string | null;
    milestoneId?: string | null;
  }>;
} | null;

type OutcomePayload = {
  id: string;
  status: string;
  outcomeAchieved: boolean;
  transitionType: string;
  claimedOutcome: string;
  mentorReflection: string | null;
  menteeNote: string | null;
  acknowledgementDeadline: string;
  opsDecision: string | null;
  opsNote: string | null;
  checkInStatus: string;
  checkInDueAt: string | null;
  checkInBadgeGranted: boolean;
} | null;

type Payload = {
  contract: {
    id: string;
    engagementType: string;
    engagementStart: string | null;
    engagementEnd: string | null;
    status: string;
  };
  sessions: Session[];
  milestones: Milestone[];
  goalDocument: Document;
  outcomeDocument: Document;
  progressPercent: number;
  outcome: OutcomePayload;
  escrow: EscrowPayload;
};

export function EngagementDashboardClient({
  contractId,
  initialData,
  isMentor,
}: {
  contractId: string;
  initialData: Payload;
  isMentor: boolean;
}) {
  const { data, mutate } = useSWR<Payload>(`/api/mentorship/engagements/${contractId}`, fetcher, {
    fallbackData: initialData,
  });
  const engagement = data ?? initialData;

  const [scheduleSessionId, setScheduleSessionId] = useState<string | null>(null);
  const [completeSessionId, setCompleteSessionId] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [completeDuration, setCompleteDuration] = useState("");
  const [completeSharedNotes, setCompleteSharedNotes] = useState("");
  const [completeMentorNotes, setCompleteMentorNotes] = useState("");
  const [filingMilestoneId, setFilingMilestoneId] = useState<string | null>(null);
  const [assessmentText, setAssessmentText] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [outcomeVerifyNote, setOutcomeVerifyNote] = useState("");
  const [outcomeDisputeNote, setOutcomeDisputeNote] = useState("");
  const [outcomeCheckinNote, setOutcomeCheckinNote] = useState("");
  const [outcomeSubmitting, setOutcomeSubmitting] = useState(false);
  const [confirmingTrancheId, setConfirmingTrancheId] = useState<string | null>(null);
  const [outcomeForm, setOutcomeForm] = useState({
    outcomeAchieved: true,
    transitionType: "",
    claimedOutcome: "",
    mentorReflection: "",
    testimonialConsent: false,
  });

  const daysRemaining = engagement.contract.engagementEnd
    ? Math.max(0, Math.ceil((new Date(engagement.contract.engagementEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  const handleSchedule = async () => {
    if (!scheduleSessionId || !scheduleAt) return;
    const res = await fetch(
      `/api/mentorship/engagements/${contractId}/sessions/${scheduleSessionId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule", scheduledAt: new Date(scheduleAt).toISOString() }),
      }
    );
    if (res.ok) {
      setScheduleSessionId(null);
      setScheduleAt("");
      mutate();
    }
  };

  const handleComplete = async () => {
    if (!completeSessionId || !completeDuration) return;
    const res = await fetch(
      `/api/mentorship/engagements/${contractId}/sessions/${completeSessionId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          durationMinutes: parseInt(completeDuration, 10),
          sharedNotes: completeSharedNotes || undefined,
          mentorNotes: completeMentorNotes || undefined,
        }),
      }
    );
    if (res.ok) {
      setCompleteSessionId(null);
      setCompleteDuration("");
      setCompleteSharedNotes("");
      setCompleteMentorNotes("");
      mutate();
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm("Cancel this session?")) return;
    const res = await fetch(
      `/api/mentorship/engagements/${contractId}/sessions/${sessionId}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) }
    );
    if (res.ok) mutate();
  };

  const handleFileMilestone = async () => {
    if (!filingMilestoneId || !assessmentText.trim()) return;
    const res = await fetch(`/api/mentorship/engagements/milestones/${filingMilestoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "file", assessment: assessmentText.trim().slice(0, 500) }),
    });
    if (res.ok) {
      setFilingMilestoneId(null);
      setAssessmentText("");
      mutate();
    }
  };

  const handleConfirmTranche = async (trancheId: string) => {
    setConfirmingTrancheId(trancheId);
    try {
      const res = await fetch(`/api/mentorship/escrow/tranches/${trancheId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) mutate();
    } finally {
      setConfirmingTrancheId(null);
    }
  };

  return (
    <>
      {engagement.contract.status === "PAUSED" && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          This engagement has been paused by platform operations. Contact support if you have questions.
        </div>
      )}
      <div className="mb-6">
        <Link href="/mentorship/dashboard" className="text-green font-body text-sm hover:underline">
          ← Dashboard
        </Link>
      </div>

      {/* EngagementHeader */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-medium px-2 py-1 rounded bg-green/10 text-green">
            {engagement.contract.engagementType}
          </span>
          {engagement.contract.engagementStart && (
            <span className="text-sm text-ink-3">
              Started {new Date(engagement.contract.engagementStart).toLocaleDateString()}
            </span>
          )}
          {engagement.contract.engagementEnd && (
            <span className="text-sm text-ink-3">
              Ends {new Date(engagement.contract.engagementEnd).toLocaleDateString()}
              {daysRemaining !== null && ` · ${daysRemaining} days left`}
            </span>
          )}
        </div>
        <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-green rounded-full transition-all"
            style={{ width: `${engagement.progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-ink-3 mt-1">{engagement.progressPercent}% complete (sessions)</p>
      </div>

      {/* Escrow status (M-6) */}
      {engagement.escrow && (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="font-display font-semibold text-ink mb-2">Payment & escrow</h2>
          {engagement.escrow.paymentMode === "FULL_UPFRONT" &&
          (engagement.escrow.status === "COMPLETED" || engagement.escrow.status === "FUNDED") ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-green">Full payment received ✓</p>
              <p className="text-sm text-ink-3">
                ₹{(engagement.escrow.totalAmountPaise / 100).toLocaleString()}
                {engagement.escrow.fundedAt && (
                  <> · {new Date(engagement.escrow.fundedAt).toLocaleDateString()}</>
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-ink-4/20">
                  {engagement.escrow.status.replace(/_/g, " ")}
                </span>
                <span className="text-sm text-ink-3">
                  ₹{(engagement.escrow.totalAmountPaise / 100).toLocaleString()} held
                </span>
              </div>
              {engagement.contract.status === "ACTIVE" && engagement.escrow.status === "PENDING_PAYMENT" && !isMentor && (
                <Link href={`/mentorship/engagements/${contractId}/payment`}>
                  <button type="button" className="text-sm font-medium text-green hover:underline">
                    Complete payment
                  </button>
                </Link>
              )}
            </>
          )}
          {engagement.escrow.tranches && engagement.escrow.tranches.length > 0 && (
            <div className="mt-2 text-xs text-ink-3 space-y-1">
              {engagement.escrow.tranches.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-2">
                  <span>Tranche {t.trancheNumber}: ₹{(t.amountPaise / 100).toLocaleString()} — {t.status.replace(/_/g, " ")}</span>
                  {t.status === "PENDING_RELEASE" && !isMentor && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleConfirmTranche(t.id)}
                        disabled={confirmingTrancheId === t.id}
                        className="text-green hover:underline font-medium"
                      >
                        Confirm
                      </button>
                      {(t as { milestoneId?: string }).milestoneId ? (
                        <Link
                          href={`/mentorship/engagements/${contractId}/milestones/${(t as { milestoneId: string }).milestoneId}/dispute`}
                          className="text-amber-600 hover:underline"
                        >
                          Dispute
                        </Link>
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SessionTimeline */}
      <section className="mb-8">
        <h2 className="font-display font-semibold text-ink mb-3">Sessions</h2>
        <ul className="space-y-3">
          {engagement.sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <span className="font-medium">Session {s.sessionNumber}</span>
                <span className="text-ink-3 text-sm ml-2">
                  {s.scheduledAt
                    ? new Date(s.scheduledAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "Not yet scheduled"}
                </span>
                <span
                  className={`ml-2 text-xs font-medium px-2 py-0.5 rounded ${
                    s.status === "COMPLETED"
                      ? "bg-green/10 text-green"
                      : s.status === "CANCELLED"
                        ? "bg-ink-4/20 text-ink-3"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {s.status}
                </span>
                {s.status === "COMPLETED" && s.sharedNotes && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedNotes((prev) => {
                          const next = new Set(Array.from(prev));
                          if (next.has(s.id)) next.delete(s.id);
                          else next.add(s.id);
                          return next;
                        })
                      }
                      className="text-sm text-green hover:underline"
                    >
                      {expandedNotes.has(s.id) ? "Hide" : "Show"} shared notes
                    </button>
                    {expandedNotes.has(s.id) && (
                      <p className="text-sm text-ink-3 mt-1">{s.sharedNotes}</p>
                    )}
                  </div>
                )}
                {s.status === "COMPLETED" && s.durationMinutes != null && (
                  <p className="text-xs text-ink-4 mt-1">{s.durationMinutes} min</p>
                )}
              </div>
              {(s.status === "SCHEDULED" || s.status === "IN_PROGRESS") && s.scheduledAt && (
                <a
                  href={`/mentorship/sessions/${s.id}/join`}
                  className="text-sm font-medium text-green hover:underline"
                >
                  Join
                </a>
              )}
              {isMentor && s.status === "SCHEDULED" && (
                <div className="flex gap-2">
                  {!s.scheduledAt && (
                    <button
                      type="button"
                      onClick={() => setScheduleSessionId(s.id)}
                      className="text-sm font-medium text-green hover:underline"
                    >
                      Schedule
                    </button>
                  )}
                  {s.scheduledAt && new Date(s.scheduledAt) <= new Date() && (
                    <button
                      type="button"
                      onClick={() => setCompleteSessionId(s.id)}
                      className="text-sm font-medium text-green hover:underline"
                    >
                      Mark complete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCancelSession(s.id)}
                    className="text-sm font-medium text-ink-3 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* MilestonePanel */}
      <section className="mb-8">
        <h2 className="font-display font-semibold text-ink mb-3">Milestones</h2>
        <div className="space-y-4">
          {engagement.milestones.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-1 rounded bg-ink-4/20 text-ink">
                  {m.type.replace(/_/g, " ")}
                </span>
                <span className="text-sm text-ink-3">
                  Due {new Date(m.dueDate).toLocaleDateString()}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    m.status === "COMPLETE"
                      ? "bg-green/10 text-green"
                      : m.status === "MENTOR_FILED" || m.status === "MENTEE_FILED"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-ink-4/20 text-ink-3"
                  }`}
                >
                  {m.status.replace(/_/g, " ")}
                </span>
              </div>
              {m.status === "COMPLETE" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {m.mentorAssessment && (
                    <p><strong>Mentor:</strong> {m.mentorAssessment}</p>
                  )}
                  {m.menteeAssessment && (
                    <p><strong>Mentee:</strong> {m.menteeAssessment}</p>
                  )}
                </div>
              )}
              {m.status !== "COMPLETE" && (
                <>
                  {(m.status === "PENDING" || (m.status === "MENTEE_FILED" && isMentor) || (m.status === "MENTOR_FILED" && !isMentor)) && (
                    <>
                      {filingMilestoneId === m.id ? (
                        <div className="mt-2">
                          <textarea
                            value={assessmentText}
                            onChange={(e) => setAssessmentText(e.target.value)}
                            placeholder="Your assessment (max 500 chars)"
                            className="w-full border rounded p-2 text-sm min-h-[80px]"
                            maxLength={500}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={handleFileMilestone}
                              className="btn-primary px-3 py-1.5 text-sm rounded"
                            >
                              Submit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFilingMilestoneId(null);
                                setAssessmentText("");
                              }}
                              className="px-3 py-1.5 text-sm rounded border"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setFilingMilestoneId(m.id)}
                          className="text-sm font-medium text-green hover:underline mt-2"
                        >
                          File your assessment
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* DocumentSection */}
      <section className="mb-8">
        <h2 className="font-display font-semibold text-ink mb-3">Documents</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="font-medium text-ink">Goal document</h3>
            {engagement.goalDocument ? (
              <p className="text-sm text-ink-3 mt-1">
                {engagement.goalDocument.mentorSigned && engagement.goalDocument.menteeSigned
                  ? "Both signed"
                  : `${engagement.goalDocument.mentorSigned ? "Mentor" : "Mentee"} signed`}
                {((isMentor && !engagement.goalDocument.mentorSigned) ||
                  (!isMentor && !engagement.goalDocument.menteeSigned)) && (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      // POST /api/mentorship/documents/[documentId]/sign
                      fetch(`/api/mentorship/documents/${engagement.goalDocument!.id}/sign`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "sign" }),
                      }).then((r) => { if (r.ok) mutate(); });
                    }}
                    className="ml-2 text-green hover:underline"
                  >
                    Sign document
                  </a>
                )}
              </p>
            ) : (
              <p className="text-sm text-ink-3 mt-1">
                Create after Session 1 is complete (mentor only).
              </p>
            )}
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="font-medium text-ink">Outcome document</h3>
            {engagement.outcomeDocument ? (
              <p className="text-sm text-ink-3 mt-1">
                {engagement.outcomeDocument.mentorSigned && engagement.outcomeDocument.menteeSigned
                  ? "Both signed"
                  : "Pending signature(s)"}
                {((isMentor && !engagement.outcomeDocument.mentorSigned) ||
                  (!isMentor && !engagement.outcomeDocument.menteeSigned)) && (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      fetch(`/api/mentorship/documents/${engagement.outcomeDocument!.id}/sign`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "sign" }),
                      }).then((r) => { if (r.ok) mutate(); });
                    }}
                    className="ml-2 text-green hover:underline"
                  >
                    Sign document
                  </a>
                )}
              </p>
            ) : (
              <p className="text-sm text-ink-3 mt-1">
                Created after Final milestone is complete (mentor).
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Outcome section (M-10) — after FINAL complete or engagement end passed */}
      {(engagement.milestones.some((m) => m.type === "FINAL" && m.status === "COMPLETE") ||
        (engagement.contract.engagementEnd && new Date(engagement.contract.engagementEnd) <= new Date())) && (
        <section className="mb-8">
          <h2 className="font-display font-semibold text-ink mb-3">Outcome</h2>
          {!engagement.outcome ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              {isMentor ? (
                <>
                  <p className="text-sm text-ink-3 mb-3">
                    The engagement has concluded. Submit your outcome claim to get credit for this mentorship.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOutcomeModalOpen(true)}
                    className="btn-primary px-4 py-2 rounded"
                  >
                    Submit outcome claim
                  </button>
                </>
              ) : (
                <p className="text-sm text-ink-3">Your mentor may submit an outcome claim. You will then have 7 days to confirm or dispute.</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    engagement.outcome.status === "VERIFIED"
                      ? "bg-green/10 text-green"
                      : engagement.outcome.status === "DISPUTED"
                        ? "bg-amber-100 text-amber-800"
                        : engagement.outcome.status === "UNACKNOWLEDGED"
                          ? "bg-ink-4/20 text-ink-3"
                          : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {engagement.outcome.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm"><strong>{engagement.outcome.transitionType}</strong></p>
              <p className="text-sm text-ink-3">{engagement.outcome.claimedOutcome}</p>
              {engagement.outcome.status === "PENDING_MENTEE" && !isMentor && (
                <p className="text-sm text-ink-3">Your mentor has submitted this claim. Confirm or dispute within 7 days.</p>
              )}
              {engagement.outcome.status === "PENDING_MENTEE" && isMentor && (
                <p className="text-sm text-ink-3">Waiting for mentee to confirm or dispute by {new Date(engagement.outcome.acknowledgementDeadline).toLocaleDateString()}.</p>
              )}
              {engagement.outcome.status === "PENDING_MENTEE" && !isMentor && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={async () => {
                      setOutcomeSubmitting(true);
                      const res = await fetch(`/api/mentorship/outcomes/${engagement.outcome!.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "verify", note: outcomeVerifyNote || undefined }),
                      });
                      if (res.ok) { mutate(); setOutcomeVerifyNote(""); }
                      setOutcomeSubmitting(false);
                    }}
                    disabled={outcomeSubmitting}
                    className="btn-primary px-3 py-1.5 text-sm rounded"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (outcomeDisputeNote.trim().length < 20) return;
                      setOutcomeSubmitting(true);
                      const res = await fetch(`/api/mentorship/outcomes/${engagement.outcome!.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "dispute", note: outcomeDisputeNote.trim() }),
                      });
                      if (res.ok) { mutate(); setOutcomeDisputeNote(""); }
                      setOutcomeSubmitting(false);
                    }}
                    disabled={outcomeSubmitting || outcomeDisputeNote.trim().length < 20}
                    className="px-3 py-1.5 text-sm rounded border border-amber-500 text-amber-700"
                  >
                    Dispute
                  </button>
                  <textarea
                    placeholder="Optional note for confirm; or required for dispute (min 20 chars)"
                    value={outcomeVerifyNote || outcomeDisputeNote}
                    onChange={(e) => { setOutcomeVerifyNote(e.target.value); setOutcomeDisputeNote(e.target.value); }}
                    className="w-full border rounded p-2 text-sm min-h-[60px] mt-2"
                    maxLength={500}
                  />
                </div>
              )}
              {engagement.outcome.status === "VERIFIED" && (
                <div className="rounded-lg bg-green/10 p-3">
                  <p className="font-medium text-green">Outcome verified ✓</p>
                  {engagement.outcome.menteeNote && <p className="text-sm text-ink-3 mt-1">{engagement.outcome.menteeNote}</p>}
                </div>
              )}
              {engagement.outcome.status === "VERIFIED" &&
                engagement.outcome.checkInStatus === "PENDING" &&
                engagement.outcome.checkInDueAt &&
                new Date(engagement.outcome.checkInDueAt) <= new Date() &&
                !isMentor && (
                  <div className="pt-2">
                    <p className="text-sm text-ink-3 mb-2">How are you doing? Submit your 6-month update.</p>
                    <textarea
                      value={outcomeCheckinNote}
                      onChange={(e) => setOutcomeCheckinNote(e.target.value)}
                      placeholder="Your update (e.g. role, progress)"
                      className="w-full border rounded p-2 text-sm min-h-[60px] mb-2"
                      maxLength={2000}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!outcomeCheckinNote.trim()) return;
                        setOutcomeSubmitting(true);
                        const res = await fetch(`/api/mentorship/outcomes/${engagement.outcome!.id}/checkin`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ note: outcomeCheckinNote.trim() }),
                        });
                        if (res.ok) { mutate(); setOutcomeCheckinNote(""); }
                        setOutcomeSubmitting(false);
                      }}
                      disabled={outcomeSubmitting || !outcomeCheckinNote.trim()}
                      className="btn-primary px-3 py-1.5 text-sm rounded"
                    >
                      Submit 6-month update
                    </button>
                  </div>
                )}
              {engagement.outcome.status === "DISPUTED" && (
                <p className="text-sm text-amber-700">Under review — our team will review within 5 business days.</p>
              )}
              {engagement.outcome.status === "OPS_REVIEWED" && engagement.outcome.opsDecision && (
                <p className="text-sm"><strong>Decision:</strong> {engagement.outcome.opsDecision}. {engagement.outcome.opsNote ?? ""}</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Outcome submission modal (mentor) */}
      {outcomeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-semibold mb-4">Submit outcome claim</h3>
            <label className="block text-sm font-medium mb-1">Did the mentee achieve their goal?</label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={outcomeForm.outcomeAchieved}
                  onChange={() => setOutcomeForm((f) => ({ ...f, outcomeAchieved: true }))}
                />
                Yes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!outcomeForm.outcomeAchieved}
                  onChange={() => setOutcomeForm((f) => ({ ...f, outcomeAchieved: false }))}
                />
                No
              </label>
            </div>
            <label className="block text-sm font-medium mb-1">Transition type (e.g. Software Engineer → Product Manager) *</label>
            <input
              value={outcomeForm.transitionType}
              onChange={(e) => setOutcomeForm((f) => ({ ...f, transitionType: e.target.value.slice(0, 100) }))}
              className="w-full border rounded p-2 mb-4"
              placeholder="e.g. Software Engineer → Product Manager"
              maxLength={100}
            />
            <label className="block text-sm font-medium mb-1">What was achieved? *</label>
            <textarea
              value={outcomeForm.claimedOutcome}
              onChange={(e) => setOutcomeForm((f) => ({ ...f, claimedOutcome: e.target.value.slice(0, 500) }))}
              className="w-full border rounded p-2 mb-4 min-h-[80px]"
              maxLength={500}
            />
            <label className="block text-sm font-medium mb-1">Your reflection (optional)</label>
            <textarea
              value={outcomeForm.mentorReflection}
              onChange={(e) => setOutcomeForm((f) => ({ ...f, mentorReflection: e.target.value.slice(0, 500) }))}
              className="w-full border rounded p-2 mb-4 min-h-[60px]"
              maxLength={500}
            />
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={outcomeForm.testimonialConsent}
                onChange={(e) => setOutcomeForm((f) => ({ ...f, testimonialConsent: e.target.checked }))}
              />
              <span className="text-sm">May Ascend feature this outcome as a testimonial?</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!outcomeForm.transitionType.trim() || !outcomeForm.claimedOutcome.trim() || outcomeSubmitting}
                onClick={async () => {
                  setOutcomeSubmitting(true);
                  const res = await fetch("/api/mentorship/outcomes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      contractId,
                      outcomeAchieved: outcomeForm.outcomeAchieved,
                      transitionType: outcomeForm.transitionType.trim(),
                      claimedOutcome: outcomeForm.claimedOutcome.trim(),
                      mentorReflection: outcomeForm.mentorReflection.trim() || undefined,
                      testimonialConsent: outcomeForm.testimonialConsent,
                    }),
                  });
                  if (res.ok) { setOutcomeModalOpen(false); setOutcomeForm({ outcomeAchieved: true, transitionType: "", claimedOutcome: "", mentorReflection: "", testimonialConsent: false }); mutate(); }
                  setOutcomeSubmitting(false);
                }}
                className="btn-primary px-4 py-2 rounded"
              >
                Submit
              </button>
              <button type="button" onClick={() => setOutcomeModalOpen(false)} className="px-4 py-2 rounded border">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule modal */}
      {scheduleSessionId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-xl p-6 max-w-md w-full">
            <h3 className="font-display font-semibold mb-4">Schedule session</h3>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="w-full border rounded p-2 mb-4"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleSchedule} className="btn-primary px-4 py-2 rounded">
                Confirm
              </button>
              <button
                type="button"
                onClick={() => { setScheduleSessionId(null); setScheduleAt(""); }}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete modal */}
      {completeSessionId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-xl p-6 max-w-md w-full">
            <h3 className="font-display font-semibold mb-4">Mark session complete</h3>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <input
              type="number"
              min={1}
              max={480}
              value={completeDuration}
              onChange={(e) => setCompleteDuration(e.target.value)}
              className="w-full border rounded p-2 mb-4"
            />
            <label className="block text-sm font-medium mb-1">Shared notes (visible to both)</label>
            <textarea
              value={completeSharedNotes}
              onChange={(e) => setCompleteSharedNotes(e.target.value)}
              className="w-full border rounded p-2 mb-4 min-h-[60px]"
            />
            <label className="block text-sm font-medium mb-1">Private mentor notes</label>
            <textarea
              value={completeMentorNotes}
              onChange={(e) => setCompleteMentorNotes(e.target.value)}
              className="w-full border rounded p-2 mb-4 min-h-[60px]"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleComplete} className="btn-primary px-4 py-2 rounded">
                Confirm
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompleteSessionId(null);
                  setCompleteDuration("");
                  setCompleteSharedNotes("");
                  setCompleteMentorNotes("");
                }}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
