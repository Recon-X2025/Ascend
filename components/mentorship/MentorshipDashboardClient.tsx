"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => (r.ok ? r.json() : undefined))
    .catch(() => undefined);

type Session = {
  id: string;
  status: string;
  sessionGoal: string;
  sessionFormat: string;
  scheduledAt: string | null;
  meetingLink: string | null;
  mentee?: { name: string | null };
  mentor?: { name: string | null };
  createdAt: string;
};

export function MentorshipDashboardClient() {
  const [tab, setTab] = useState<"mentor" | "mentee">("mentor");
  const [actingId, setActingId] = useState<string | null>(null);

  const { data: me } = useSWR<{ isMentor: boolean }>("/api/mentorship/me", fetcher);
  const { data: activeEngagement } = useSWR<{
    engagement: {
      contractId: string;
      engagementType: string;
      engagementStart: string | null;
      engagementEnd: string | null;
      nextSession: { sessionNumber: number; scheduledAt: string | null } | null;
      nextMilestone: { type: string; dueDate: string } | null;
    } | null;
  }>("/api/mentorship/engagements/active", fetcher);
  const { data: verification } = useSWR<{ status?: string; nextReviewDue?: string | null; verifiedAt?: string | null }>(
    me?.isMentor ? "/api/mentorship/verification/status" : null,
    async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) return undefined;
      return data;
    }
  );
  const verificationStatus = verification?.status;
  const hasVerificationStatus = typeof verificationStatus === "string";
  const { data: mentorSessions, mutate: mutateMentor } = useSWR<{ sessions?: Session[] } | undefined>(
    tab === "mentor" ? "/api/mentorship/sessions?role=mentor" : null,
    fetcher
  );
  const { data: menteeSessions, mutate: mutateMentee } = useSWR<{ sessions?: Session[] } | undefined>(
    tab === "mentee" ? "/api/mentorship/sessions?role=mentee" : null,
    fetcher
  );

  const sessions = tab === "mentor" ? (mentorSessions?.sessions ?? []) : (menteeSessions?.sessions ?? []);

  const actOnSession = async (sessionId: string, action: string) => {
    setActingId(sessionId);
    try {
      const res = await fetch(`/api/mentorship/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed");
      await mutateMentor();
      await mutateMentee();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-extrabold text-2xl text-ink">Mentorship dashboard</h1>
          {me?.isMentor ? (
            <Link href="/mentorship" className="text-green font-body text-sm hover:underline">
              Discover mentors
            </Link>
          ) : (
            <Link href="/mentorship/become-mentor" className="btn-primary px-4 py-2 rounded-lg text-sm">
              Become a mentor
            </Link>
          )}
        </div>

        {me?.isMentor && tab === "mentor" && hasVerificationStatus && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  verificationStatus === "VERIFIED"
                    ? "bg-green/10 text-green"
                    : verificationStatus === "PENDING"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                }`}
              >
                {verificationStatus.replace(/_/g, " ")}
              </span>
              {verificationStatus === "VERIFIED" && verification?.nextReviewDue && (
                <span className="text-sm text-ink-3">
                  Valid until {new Date(verification.nextReviewDue).toLocaleDateString()}
                </span>
              )}
              {verificationStatus === "PENDING" && (
                <span className="text-sm text-ink-3">Under review — we&apos;ll notify you within 48 hours.</span>
              )}
            </div>
            {(verificationStatus === "UNVERIFIED" || verificationStatus === "REVERIFICATION_REQUIRED") && (
              <Link
                href="/mentorship/verify"
                className="btn-primary px-4 py-2 rounded-lg text-sm"
              >
                Verify profile
              </Link>
            )}
          </div>
        )}

        {activeEngagement?.engagement && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6">
            <h2 className="font-display font-semibold text-ink mb-2">Active engagement</h2>
            <p className="font-body text-sm text-ink-3 mb-2">
              {activeEngagement.engagement.engagementType} ·{" "}
              {activeEngagement.engagement.nextSession
                ? `Session ${activeEngagement.engagement.nextSession.sessionNumber} — ${
                    activeEngagement.engagement.nextSession.scheduledAt
                      ? new Date(activeEngagement.engagement.nextSession.scheduledAt).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "Unscheduled"
                  }`
                : "No upcoming session"}
              {activeEngagement.engagement.nextMilestone && (
                <> · Next milestone: {activeEngagement.engagement.nextMilestone.type} due{" "}
                  {new Date(activeEngagement.engagement.nextMilestone.dueDate).toLocaleDateString()}
                </>
              )}
            </p>
            <Link
              href={`/mentorship/engagements/${activeEngagement.engagement.contractId}`}
              className="btn-primary px-4 py-2 rounded-lg text-sm inline-block"
            >
              Go to engagement
            </Link>
          </div>
        )}

        {me?.isMentor ? (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setTab("mentor")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === "mentor" ? "bg-green text-white" : "bg-[var(--surface)] border border-[var(--border)]"
              }`}
            >
              As a mentor
            </button>
            <button
              type="button"
              onClick={() => setTab("mentee")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === "mentee" ? "bg-green text-white" : "bg-[var(--surface)] border border-[var(--border)]"
              }`}
            >
              As a mentee
            </button>
          </div>
        ) : (
          <p className="font-body text-ink-3 mb-6">
            Sessions you request will appear here. <Link href="/mentorship" className="text-green hover:underline">Find a mentor</Link>.
          </p>
        )}

        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-ink-3 font-body">
              No sessions yet.
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-body text-sm text-ink-3">
                      {tab === "mentor" ? s.mentee?.name ?? "Mentee" : s.mentor?.name ?? "Mentor"}
                    </p>
                    <p className="font-body text-ink mt-1 line-clamp-2">{s.sessionGoal}</p>
                    <p className="font-body text-xs text-ink-4 mt-2">
                      {s.status} · {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                    {tab === "mentor" && s.status === "REQUESTED" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => actOnSession(s.id, "accept")}
                          disabled={actingId === s.id}
                          className="text-sm font-medium text-green hover:underline disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => actOnSession(s.id, "decline")}
                          disabled={actingId === s.id}
                          className="text-sm font-medium text-ink-3 hover:underline disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      s.status === "REQUESTED"
                        ? "bg-amber-100 text-amber-800"
                        : s.status === "COMPLETED"
                        ? "bg-green/10 text-green"
                        : "bg-[var(--surface-2)] text-ink-3"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                {s.meetingLink && (
                  <a
                    href={s.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-green font-body text-sm hover:underline"
                  >
                    Join meeting →
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
