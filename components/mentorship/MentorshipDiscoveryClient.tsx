"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { MENTOR_TRANSITION_LABELS, MENTOR_FOCUS_LABELS, SESSION_FORMAT_LABELS } from "@/lib/mentorship/labels";
import type { MentorTransition, MentorFocusArea, SessionFormat } from "@prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type MentorCard = {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
  currentRole: string;
  currentCompany: string | null;
  transitionType: MentorTransition | null;
  previousRole: string | null;
  focusAreas: MentorFocusArea[];
  sessionFormats: SessionFormat[];
  averageRating: number | null;
  totalSessions: number;
  totalMentees: number;
  crossBorderExperience: boolean;
  matchScore: number;
  verifiedOutcomeCount?: number;
  tier?: string;
};

export function MentorshipDiscoveryClient() {
  const [filters, setFilters] = useState({
    transition: [] as string[],
    focusArea: [] as string[],
    format: [] as string[],
    style: "",
    crossBorder: "",
    city: "",
  });
  const [page, setPage] = useState(0);

  const params = new URLSearchParams();
  filters.transition.forEach((t) => params.append("transition", t));
  filters.focusArea.forEach((f) => params.append("focusArea", f));
  filters.format.forEach((f) => params.append("format", f));
  if (filters.style) params.set("style", filters.style);
  if (filters.crossBorder === "true") params.set("crossBorder", "true");
  if (filters.city) params.set("city", filters.city);
  params.set("page", String(page));
  params.set("limit", "20");

  const { data, isLoading } = useSWR<{
    mentors: MentorCard[];
    total: number;
    hasNext: boolean;
  }>(`/api/mentorship/mentors?${params}`, fetcher);

  const { data: featuredData } = useSWR<{ mentors: MentorCard[] }>(
    "/api/mentorship/mentors/featured",
    fetcher
  );
  const featuredMentors = featuredData?.mentors ?? [];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="font-display font-extrabold text-3xl text-ink">
            Find your mentor
          </h1>
          <p className="font-body text-ink-3 mt-2">
            Someone already made the move you&apos;re planning.
          </p>
        </div>

        {featuredMentors.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display font-semibold text-lg text-ink mb-4">Featured mentors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredMentors.map((m) => (
                <MentorCard key={m.id} mentor={{ ...m, tier: "ELITE" }} featured />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-56 shrink-0 space-y-4">
            <div>
              <label className="block font-body font-medium text-ink text-sm mb-1">Transition</label>
              <select
                multiple
                value={filters.transition}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    transition: Array.from(e.target.selectedOptions, (o) => o.value),
                  }))
                }
                className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                {Object.entries(MENTOR_TRANSITION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body font-medium text-ink text-sm mb-1">Focus area</label>
              <select
                multiple
                value={filters.focusArea}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    focusArea: Array.from(e.target.selectedOptions, (o) => o.value),
                  }))
                }
                className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                {Object.entries(MENTOR_FOCUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body font-medium text-ink text-sm mb-1">Format</label>
              <select
                multiple
                value={filters.format}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    format: Array.from(e.target.selectedOptions, (o) => o.value),
                  }))
                }
                className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                {Object.entries(SESSION_FORMAT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 font-body text-sm text-ink">
                <input
                  type="checkbox"
                  checked={filters.crossBorder === "true"}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, crossBorder: e.target.checked ? "true" : "" }))
                  }
                />
                Cross-border experience
              </label>
            </div>
            <div>
              <label className="block font-body font-medium text-ink text-sm mb-1">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. Bangalore"
                className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(data?.mentors ?? []).map((m) => (
                    <MentorCard key={m.id} mentor={m} />
                  ))}
                </div>
                {data?.mentors?.length === 0 && (
                  <p className="font-body text-ink-3 text-center py-12">
                    No mentors match your filters. Try adjusting them.
                  </p>
                )}
                <div className="flex justify-center gap-2 mt-6">
                  {page > 0 && (
                    <button
                      type="button"
                      onClick={() => setPage((p) => p - 1)}
                      className="px-4 py-2 rounded-lg border border-[var(--border)] font-body text-sm"
                    >
                      Previous
                    </button>
                  )}
                  {data?.hasNext && (
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 py-2 rounded-lg bg-green text-white font-body text-sm"
                    >
                      Next
                    </button>
                  )}
                </div>
              </>
            )}
          </main>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/mentorship/become-mentor"
            className="text-green font-body font-medium hover:underline"
          >
            Become a mentor →
          </Link>
        </div>
      </div>
    </div>
  );
}

function MentorCard({ mentor, featured }: { mentor: MentorCard; featured?: boolean }) {
  const transitionLabel = mentor.transitionType
    ? MENTOR_TRANSITION_LABELS[mentor.transitionType]
    : null;
  const tier = mentor.tier ?? "RISING";
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-green/50 transition-colors"
    >
      <div className="flex gap-4">
        <div
          className="w-14 h-14 rounded-full bg-green/20 flex items-center justify-center font-display font-bold text-green shrink-0"
        >
          {mentor.name?.slice(0, 1).toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-ink">{mentor.name ?? "Mentor"}</h3>
          <p className="font-body text-sm text-ink-3">
            {mentor.currentRole}
            {mentor.currentCompany ? ` at ${mentor.currentCompany}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {transitionLabel && (
              <span
                className="inline-block font-body text-xs px-2 py-0.5 rounded border border-green/30 text-green"
              >
                {transitionLabel}
              </span>
            )}
            {tier === "ELITE" && (
              <span className="inline-block font-body text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 font-medium">
                Elite Mentor ⭐
              </span>
            )}
            {tier === "ESTABLISHED" && !featured && (
              <span className="inline-block font-body text-xs px-2 py-0.5 rounded bg-green/10 text-green font-medium">
                Established Mentor
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {(mentor.focusAreas ?? []).slice(0, 3).map((f) => (
              <span
                key={f}
                className="font-body text-[0.7rem] px-2 py-0.5 rounded border border-[var(--border)] text-ink-3"
              >
                {MENTOR_FOCUS_LABELS[f]}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-ink-3">
            {mentor.averageRating != null && (
              <span>★ {mentor.averageRating.toFixed(1)}</span>
            )}
            <span>{mentor.totalSessions} sessions · {mentor.totalMentees} mentees</span>
            {(mentor.verifiedOutcomeCount ?? 0) > 0 && (
              <span className="text-green font-medium">✓ {mentor.verifiedOutcomeCount} verified outcome{(mentor.verifiedOutcomeCount ?? 0) !== 1 ? "s" : ""}</span>
            )}
          </div>
          <Link
            href={`/mentorship/${mentor.id}`}
            className="mt-3 inline-block font-body font-semibold text-sm text-green hover:underline"
          >
            Request session →
          </Link>
        </div>
      </div>
    </div>
  );
}
