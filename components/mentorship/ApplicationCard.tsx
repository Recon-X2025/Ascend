"use client";

import { useState } from "react";
import { WordCountTextarea } from "./WordCountTextarea";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  QUESTION_ASKED: "bg-blue-100 text-blue-800 border-blue-200",
  ACCEPTED: "bg-green-100 text-green-800 border-green-200",
  DECLINED: "bg-muted text-muted-foreground border-border",
  EXPIRED: "bg-muted text-muted-foreground border-border",
  WITHDRAWN: "bg-muted text-muted-foreground border-border",
};

function daysUntil(d: string): number {
  const exp = new Date(d).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((exp - now) / (24 * 60 * 60 * 1000)));
}

type App = {
  id: string;
  status: string;
  submittedAt: string;
  expiresAt: string;
  mentorName: string | null;
  mentorUserId: string;
  matchReason: string;
};

export function ApplicationCard({
  application,
  onWithdraw,
  onAnswerSubmit,
}: {
  application: App & { mentorQuestion?: string | null; menteeAnswer?: string | null };
  onWithdraw?: (id: string) => Promise<void>;
  onAnswerSubmit?: (id: string, answer: string) => Promise<void>;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const days = daysUntil(application.expiresAt);
  const isUrgent = days <= 2;

  const handleWithdraw = async () => {
    if (!onWithdraw || !confirm("Withdraw this application?")) return;
    setSubmitting(true);
    try {
      await onWithdraw(application.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAnswerSubmit || !answer.trim()) return;
    setSubmitting(true);
    try {
      await onAnswerSubmit(application.id, answer);
      setAnswer("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ascend-card p-6 border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink">{application.mentorName ?? "Mentor"}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{application.matchReason}</p>
        </div>
        <span
          className={`inline-block px-2 py-1 rounded border text-xs font-medium ${
            STATUS_STYLES[application.status] ?? "bg-muted"
          }`}
        >
          {application.status.replace("_", " ")}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Submitted {new Date(application.submittedAt).toLocaleDateString()}
        {(application.status === "PENDING" || application.status === "QUESTION_ASKED") && (
          <span className={isUrgent ? "text-destructive ml-2" : "ml-2"}>
            · Expires in {days} day{days !== 1 ? "s" : ""}
          </span>
        )}
      </p>

      {application.status === "QUESTION_ASKED" && application.mentorQuestion && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-sm font-medium text-ink">Mentor&apos;s question</p>
          <p className="text-sm text-ink mt-1 italic">&ldquo;{application.mentorQuestion}&rdquo;</p>
          {application.menteeAnswer ? (
            <p className="text-sm text-muted-foreground mt-2">Your answer: {application.menteeAnswer.slice(0, 200)}…</p>
          ) : (
            <form onSubmit={handleAnswer} className="mt-3">
              <WordCountTextarea
                value={answer}
                onChange={setAnswer}
                minWords={50}
                maxWords={500}
                placeholder="Your answer (50–500 words)"
                rows={4}
              />
              <button
                type="submit"
                disabled={submitting || answer.trim().split(/\s+/).filter(Boolean).length < 50}
                className="mt-2 rounded-lg bg-green text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Submit answer"}
              </button>
            </form>
          )}
        </div>
      )}

      {application.status === "ACCEPTED" && (
        <p className="mt-3 text-sm text-green">Engagement starting — contract coming soon.</p>
      )}
      {application.status === "DECLINED" && (
        <p className="mt-3 text-sm text-muted-foreground">
          Not the right fit at this time. A new match may be available.
        </p>
      )}
      {application.status === "EXPIRED" && (
        <p className="mt-3 text-sm text-muted-foreground">
          No response received. A new match may be available.
        </p>
      )}

      {(application.status === "PENDING" || application.status === "QUESTION_ASKED") && onWithdraw && (
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={submitting}
          className="mt-4 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          Withdraw application
        </button>
      )}
    </div>
  );
}
