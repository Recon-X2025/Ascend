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
};

export function FeaturedMentorsSection() {
  const [mentors, setMentors] = useState<FeaturedMentor[]>([]);

  useEffect(() => {
    fetch("/api/mentorship/mentors/featured")
      .then((r) => r.json())
      .then((data) => setMentors(data.mentors ?? []))
      .catch(() => setMentors([]));
  }, []);

  if (mentors.length === 0) return null;

  return (
    <section className="py-16 px-6 md:px-12 max-w-[1280px] mx-auto border-b border-border">
      <p className="font-body text-[0.68rem] tracking-[0.22em] uppercase text-green mb-4">
        Featured mentors
      </p>
      <h2 className="font-display font-bold text-ink text-[clamp(1.6rem,3vw,2.4rem)] leading-tight mb-8">
        Get guidance from professionals who&apos;ve made the transition
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mentors.map((m) => (
          <Link
            key={m.id}
            href={`/mentorship/${m.id}`}
            className="block rounded-xl border border-border bg-surface p-6 hover:border-green/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-green-light flex items-center justify-center shrink-0 overflow-hidden">
                {m.image ? (
                  <img src={m.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-green-dark text-xl">
                    {m.name?.slice(0, 1).toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display font-semibold text-ink truncate">{m.name ?? "Mentor"}</p>
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
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/mentorship"
        className="mt-8 inline-block font-body font-medium text-green hover:underline"
      >
        Discover all mentors →
      </Link>
    </section>
  );
}
