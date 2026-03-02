"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type FeaturedMentor = {
  id: string;
  name: string | null;
  image: string | null;
  currentRole: string;
  currentCompany: string | null;
  transitionLabel: string | null;
  averageRating: number | null;
  totalSessions: number;
  sessionFormats: string[];
};

export function MentorshipDemo() {
  const [mentors, setMentors] = useState<FeaturedMentor[]>([]);

  useEffect(() => {
    fetch("/api/mentorship/mentors/featured")
      .then((r) => r.json())
      .then((data) => setMentors(data.mentors ?? []))
      .catch(() => setMentors([]));
  }, []);

  if (mentors.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16" style={{ backgroundColor: "var(--bg)" }}>
        <div
          className="rounded-xl border p-6 mx-auto"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            maxWidth: "400px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-white shrink-0"
              style={{ backgroundColor: "var(--green)", fontSize: "1.25rem" }}
            >
              ?
            </div>
            <div className="min-w-0">
              <p className="font-display font-semibold text-ink" style={{ fontSize: "1.1rem" }}>
                Be the first mentor
              </p>
              <p className="font-body text-sm text-ink-3 mt-2">
                Join Ascend and opt in to mentor others.
              </p>
              <Link
                href="/auth/register?from=mentorship"
                className="mt-4 inline-block font-body font-semibold text-sm text-white rounded-lg py-2.5 px-4"
                style={{ backgroundColor: "var(--green)" }}
              >
                Get started →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 py-16" style={{ backgroundColor: "var(--bg)" }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mentors.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border p-6"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-white shrink-0"
                style={{ backgroundColor: "var(--green)", fontSize: "1.25rem" }}
              >
                {m.name?.slice(0, 1).toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="font-display font-semibold text-ink" style={{ fontSize: "1.1rem" }}>
                  {m.name ?? "Mentor"}
                </p>
                <p className="font-body text-xs text-green mt-1">
                  {m.currentRole}
                  {m.currentCompany ? ` at ${m.currentCompany}` : ""}
                  {m.transitionLabel ? ` · ${m.transitionLabel}` : ""}
                </p>
                {m.averageRating != null && (
                  <span className="inline-block mt-2 font-body text-[0.7rem] text-ink-3">
                    ★ {m.averageRating.toFixed(1)} · {m.totalSessions} sessions
                  </span>
                )}
                <Link
                  href="/auth/register?from=mentorship"
                  className="mt-4 inline-block font-body font-semibold text-sm text-white rounded-lg py-2.5 px-4 hover:opacity-90"
                  style={{ backgroundColor: "var(--green)" }}
                >
                  Request mentorship →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
