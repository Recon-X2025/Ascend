"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  MENTOR_TRANSITION_LABELS,
  MENTOR_FOCUS_LABELS,
  SESSION_FORMAT_LABELS,
} from "@/lib/mentorship/labels";
import type { MentorTransition, MentorFocusArea, SessionFormat } from "@prisma/client";

type MentorProfile = {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
  currentRole: string;
  currentCompany: string | null;
  previousRole: string | null;
  transitionType: MentorTransition | null;
  yearsOfExperience: number;
  currentCity: string | null;
  previousCity: string | null;
  crossBorderExperience: boolean;
  countriesWorkedIn: string[];
  mentoringStyles: string[];
  sessionFormats: SessionFormat[];
  languages: string[];
  focusAreas: MentorFocusArea[];
  totalSessions: number;
  totalMentees: number;
  averageRating: number | null;
  featuredTestimonial: string | null;
  isVerified: boolean;
  availability: { dayOfWeek: number; startTime: string; endTime: string; timezone: string }[];
  tier?: string;
};

export function MentorProfileClient({ mentorId }: { mentorId: string }) {
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sessionGoal, setSessionGoal] = useState("");
  const [sessionFormat, setSessionFormat] = useState<SessionFormat>("VIDEO_CALL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/mentorship/mentors/${mentorId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setProfile(null);
        else setProfile(data);
      })
      .finally(() => setLoading(false));
  }, [mentorId]);

  const { data: outcomeStats } = useSWR<{
    verifiedOutcomeCount: number;
    totalEngagements: number;
    avgTimeToOutcomeDays: number | null;
    outcomeTypes: string[];
    recentTestimonials: { claimedOutcome: string; transitionType: string; verifiedAt: string | null }[];
  }>(profile?.userId ? `/api/mentorship/outcomes/mentor/${profile.userId}` : null, (url: string) => fetch(url).then((r) => r.json()));

  const handleRequestSession = async () => {
    if (sessionGoal.length < 50 || sessionGoal.length > 500) {
      setError("Please write 50–500 characters about what you want from this session.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/mentorship/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorProfileId: mentorId,
          sessionGoal,
          sessionFormat,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setPanelOpen(false);
      setSessionGoal("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to request session");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-green border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4 py-12 text-center">
        <p className="font-body text-ink-3">Mentor not found.</p>
        <Link href="/mentorship" className="text-green mt-4 inline-block">← Back to Mentorship</Link>
      </div>
    );
  }

  const transitionLabel = profile.transitionType
    ? MENTOR_TRANSITION_LABELS[profile.transitionType]
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/mentorship" className="text-green font-body text-sm hover:underline">
          ← Back to Mentorship
        </Link>

        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex gap-6">
            <div className="w-20 h-20 rounded-full bg-green/20 flex items-center justify-center font-display font-bold text-2xl text-green shrink-0">
              {profile.name?.slice(0, 1).toUpperCase() ?? "?"}
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl text-ink">{profile.name ?? "Mentor"}</h1>
              <p className="font-body text-ink-3 mt-1">
                {profile.currentRole}
                {profile.currentCompany ? ` at ${profile.currentCompany}` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {transitionLabel && (
                  <span className="inline-block font-body text-sm px-2 py-1 rounded border border-green/30 text-green">
                    {transitionLabel}
                  </span>
                )}
                {profile.tier === "ELITE" && (
                  <span className="inline-block font-body text-sm px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 font-medium">
                    Elite Mentor ⭐
                  </span>
                )}
                {profile.tier === "ESTABLISHED" && (
                  <span className="inline-block font-body text-sm px-2 py-1 rounded bg-green/10 text-green font-medium">
                    Established Mentor
                  </span>
                )}
              </div>
              {profile.averageRating != null && (
                <p className="mt-2 font-body text-sm text-ink-3">★ {profile.averageRating.toFixed(1)} · {profile.totalSessions} sessions · {profile.totalMentees} mentees helped</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-display font-semibold text-ink mb-2">Focus areas</h2>
            <div className="flex flex-wrap gap-2">
              {profile.focusAreas.map((f) => (
                <span
                  key={f}
                  className="font-body text-sm px-2 py-1 rounded border border-[var(--border)] text-ink-3"
                >
                  {MENTOR_FOCUS_LABELS[f]}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h2 className="font-display font-semibold text-ink mb-2">Session formats</h2>
            <p className="font-body text-sm text-ink-3">
              {profile.sessionFormats.map((f) => SESSION_FORMAT_LABELS[f]).join(" · ")}
            </p>
          </div>

          {outcomeStats && outcomeStats.verifiedOutcomeCount > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <h2 className="font-display font-semibold text-ink mb-2">Verified outcomes</h2>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-1 rounded bg-green/10 text-green">
                  {outcomeStats.verifiedOutcomeCount} verified outcome{outcomeStats.verifiedOutcomeCount !== 1 ? "s" : ""}
                </span>
                {outcomeStats.avgTimeToOutcomeDays != null && (
                  <span className="font-body text-sm text-ink-3">
                    Avg. {Math.round(outcomeStats.avgTimeToOutcomeDays)} days to verified outcome
                  </span>
                )}
              </div>
              {outcomeStats.outcomeTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {outcomeStats.outcomeTypes.map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded border border-[var(--border)] text-ink-3">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {outcomeStats.recentTestimonials?.length > 0 && (
                <div className="space-y-3">
                  {outcomeStats.recentTestimonials.map((t, i) => (
                    <blockquote key={i} className="font-body text-sm text-ink-3 italic border-l-2 border-green pl-4">
                      &ldquo;{t.claimedOutcome}&rdquo;
                      <footer className="text-xs text-ink-4 mt-1 not-italic">{t.transitionType}{t.verifiedAt ? ` · ${new Date(t.verifiedAt).toLocaleDateString()}` : ""}</footer>
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          )}

          {profile.featuredTestimonial && (
            <blockquote className="mt-6 font-body text-sm text-ink-3 italic border-l-2 border-green pl-4">
              &ldquo;{profile.featuredTestimonial}&rdquo;
            </blockquote>
          )}

          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="mt-6 btn-primary px-6 py-3 rounded-lg font-medium"
          >
            Request a session
          </button>
        </div>
      </div>

      {panelOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={() => setPanelOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-[var(--surface)] border-l border-[var(--border)] p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold text-lg text-ink">Request a session</h3>
            <p className="font-body text-sm text-ink-3 mt-1">with {profile.name ?? "this mentor"}</p>

            <label className="block font-body font-medium text-ink mt-4 mb-2">
              What do you want to get from this session? (50–500 chars)
            </label>
            <textarea
              value={sessionGoal}
              onChange={(e) => setSessionGoal(e.target.value)}
              placeholder="e.g. I'm switching from engineering to product and would like to understand how you made the transition..."
              rows={4}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 font-body text-ink"
            />

            <label className="block font-body font-medium text-ink mt-4 mb-2">Preferred format</label>
            <div className="flex flex-wrap gap-2">
              {(["VIDEO_CALL", "VOICE_CALL", "ASYNC_CHAT"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSessionFormat(f)}
                  className={`px-3 py-2 rounded-lg text-sm font-body ${
                    sessionFormat === f
                      ? "bg-green text-white"
                      : "bg-[var(--bg)] border border-[var(--border)] text-ink"
                  }`}
                >
                  {SESSION_FORMAT_LABELS[f]}
                </button>
              ))}
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="px-4 py-2 rounded-lg border border-[var(--border)] font-body"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestSession}
                disabled={submitting}
                className="btn-primary px-4 py-2 rounded-lg font-body disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
