"use client";

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DECLINE_OPTIONS = [
  "Not the right fit",
  "Capacity full",
  "Timeline mismatch",
  "Other",
];

type InboxApp = {
  id: string;
  status: string;
  submittedAt: string;
  expiresAt: string;
  mentorQuestion: string | null;
  menteeAnswer: string | null;
  matchReason: string;
  whyThisMentor: string;
  goalStatement: string;
  commitment: string;
  timeline: string;
  whatAlreadyTried: string;
  menteeName: string | null;
  menteeHeadline: string | null;
  menteeCurrentRole: string | null;
};

function daysUntil(d: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(d).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  );
}

export function MentorApplicationInbox() {
  const { data: applications, mutate } = useSWR<InboxApp[]>(
    "/api/mentorship/applications/inbox",
    fetcher
  );
  const [responding, setResponding] = useState<string | null>(null);
  const [question, setQuestion] = useState<Record<string, string>>({});
  const [declineReason, setDeclineReason] = useState<Record<string, string>>({});

  const pending = (applications ?? []).filter((a) =>
    ["PENDING", "QUESTION_ASKED"].includes(a.status)
  );

  const handleRespond = async (
    applicationId: string,
    action: "ACCEPT" | "DECLINE" | "ASK"
  ) => {
    setResponding(applicationId);
    try {
      const body: { action: string; question?: string; declineReason?: string } = {
        action,
      };
      if (action === "ASK") body.question = question[applicationId]?.trim().slice(0, 300);
      if (action === "DECLINE") body.declineReason = declineReason[applicationId] || "Other";

      const res = await fetch(`/api/mentorship/applications/${applicationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Failed to respond");
        return;
      }
      await mutate();
    } finally {
      setResponding(null);
    }
  };

  if (applications === undefined) {
    return <div className="animate-pulse h-32 rounded-xl bg-muted" />;
  }

  return (
    <section className="ascend-card p-6">
      <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
        Applications
        {pending.length > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-0.5">
            {pending.length}
          </span>
        )}
      </h2>

      {applications.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-2">No applications yet.</p>
      ) : (
        <div className="mt-4 space-y-6">
          {applications.map((app) => (
            <div
              key={app.id}
              className="border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{app.menteeName ?? "Mentee"}</p>
                  {(app.menteeHeadline || app.menteeCurrentRole) && (
                    <p className="text-sm text-muted-foreground">
                      {[app.menteeHeadline, app.menteeCurrentRole].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Submitted {new Date(app.submittedAt).toLocaleDateString()}
                  {["PENDING", "QUESTION_ASKED"].includes(app.status) && (
                    <> · {daysUntil(app.expiresAt)} days to respond</>
                  )}
                </span>
              </div>

              <p className="text-sm italic text-ink/90">{app.matchReason}</p>

              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium text-muted-foreground">Why this mentor: </span>
                  <p className="mt-0.5">{app.whyThisMentor}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Goal: </span>
                  <p className="mt-0.5">{app.goalStatement}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Commitment: </span>
                  <p className="mt-0.5">{app.commitment}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Timeline: </span>
                  <p className="mt-0.5">{app.timeline}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">What they&apos;ve tried: </span>
                  <p className="mt-0.5">{app.whatAlreadyTried}</p>
                </div>
              </div>

              {app.status === "QUESTION_ASKED" && app.mentorQuestion && (
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground">Your question</p>
                  <p className="text-sm italic">&ldquo;{app.mentorQuestion}&rdquo;</p>
                  {app.menteeAnswer && (
                    <>
                      <p className="text-xs font-medium text-muted-foreground mt-2">Mentee&apos;s answer</p>
                      <p className="text-sm">{app.menteeAnswer}</p>
                    </>
                  )}
                </div>
              )}

              {["PENDING", "QUESTION_ASKED"].includes(app.status) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Accept this application? This will begin the contract process.")) {
                        handleRespond(app.id, "ACCEPT");
                      }
                    }}
                    disabled={responding === app.id}
                    className="rounded-lg bg-green text-white px-3 py-1.5 text-sm font-medium hover:bg-green-dark disabled:opacity-50"
                  >
                    {responding === app.id ? "…" : "Accept"}
                  </button>
                  <select
                    value={declineReason[app.id] ?? ""}
                    onChange={(e) =>
                      setDeclineReason((r) => ({ ...r, [app.id]: e.target.value }))
                    }
                    className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
                  >
                    <option value="">Decline — choose reason</option>
                    {DECLINE_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  {declineReason[app.id] && (
                    <button
                      type="button"
                      onClick={() => handleRespond(app.id, "DECLINE")}
                      disabled={responding === app.id}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
                    >
                      Decline
                    </button>
                  )}
                  {app.status === "PENDING" && !app.mentorQuestion && (
                    <>
                      <input
                        type="text"
                        placeholder="Ask one question (max 300 chars)"
                        maxLength={300}
                        value={question[app.id] ?? ""}
                        onChange={(e) =>
                          setQuestion((q) => ({ ...q, [app.id]: e.target.value }))
                        }
                        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm w-64"
                      />
                      <button
                        type="button"
                        onClick={() => handleRespond(app.id, "ASK")}
                        disabled={responding === app.id || !(question[app.id]?.trim())}
                        className="rounded-lg border border-primary text-primary px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                      >
                        Ask question
                      </button>
                    </>
                  )}
                </div>
              )}

              {app.status === "ACCEPTED" && (
                <p className="text-sm text-green">Accepted — contract coming soon.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
