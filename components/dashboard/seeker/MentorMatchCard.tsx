"use client";

import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type MentorCard = {
  id: string;
  name: string | null;
  currentRole: string;
  currentCompany: string | null;
  transitionType: string | null;
  matchScore: number;
};

export function MentorMatchCard() {
  const { data } = useSWR<{ mentors: MentorCard[] }>(
    "/api/mentorship/mentors?limit=2",
    fetcher
  );
  const mentors = data?.mentors?.slice(0, 2) ?? [];

  if (mentors.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h3 className="font-display font-semibold text-ink">Find your mentor</h3>
        <p className="font-body text-sm text-ink-3 mt-1">
          Connect with someone who&apos;s made the move you&apos;re planning.
        </p>
        <Link
          href="/mentorship"
          className="mt-3 inline-block font-body font-semibold text-sm text-green hover:underline"
        >
          Find your mentor →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="font-display font-semibold text-ink">Find your mentor</h3>
      <p className="font-body text-sm text-ink-3 mt-1">
        Mentors who match your goals
      </p>
      <ul className="mt-3 space-y-2">
        {mentors.map((m) => (
          <li key={m.id}>
            <Link
              href={`/mentorship/${m.id}`}
              className="font-body text-sm text-green hover:underline"
            >
              {m.name ?? "Mentor"} · {m.currentRole}
              {m.currentCompany ? ` at ${m.currentCompany}` : ""}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/mentorship"
        className="mt-3 inline-block font-body font-semibold text-sm text-green hover:underline"
      >
        Find your mentor →
      </Link>
    </div>
  );
}
