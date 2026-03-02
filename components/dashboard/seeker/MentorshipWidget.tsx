"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MentorshipWidget() {
  const { data: readiness } = useSWR("/api/mentorship/readiness", fetcher);
  const { data: applications } = useSWR(
    readiness?.allGatesPassed ? "/api/mentorship/applications" : null,
    fetcher
  );

  const activeCount = Array.isArray(applications)
    ? applications.filter((a: { status: string }) =>
        ["PENDING", "QUESTION_ASKED"].includes(a.status)
      ).length
    : 0;
  const hasAccepted = Array.isArray(applications)
    ? applications.some((a: { status: string }) => a.status === "ACCEPTED")
    : false;
  const acceptedMentor = hasAccepted && Array.isArray(applications)
    ? applications.find((a: { status: string }) => a.status === "ACCEPTED")?.mentorName
    : null;

  if (readiness === undefined) return null;

  return (
    <div className="ascend-card p-4">
      <h3 className="font-semibold text-ink mb-2">Mentorship</h3>
      {!readiness.allGatesPassed && (
        <>
          <p className="text-sm text-muted-foreground">
            Unlock mentor matching — complete your profile and career context.
          </p>
          <Link
            href="/mentorship"
            className="mt-2 inline-block text-sm font-medium text-green hover:underline"
          >
            Get started →
          </Link>
        </>
      )}
      {readiness.allGatesPassed && activeCount === 0 && !hasAccepted && (
        <>
          <p className="text-sm text-muted-foreground">Your mentor matches are ready.</p>
          <Link
            href="/mentorship"
            className="mt-2 inline-block text-sm font-medium text-green hover:underline"
          >
            View matches →
          </Link>
        </>
      )}
      {readiness.allGatesPassed && activeCount > 0 && !hasAccepted && (
        <>
          <p className="text-sm text-muted-foreground">
            {activeCount} active application{activeCount !== 1 ? "s" : ""}.
          </p>
          <Link
            href="/mentorship/applications"
            className="mt-2 inline-block text-sm font-medium text-green hover:underline"
          >
            View applications →
          </Link>
        </>
      )}
      {readiness.allGatesPassed && hasAccepted && (
        <>
          <p className="text-sm text-muted-foreground">
            Your mentorship with {acceptedMentor ?? "your mentor"} is starting.
          </p>
          <Link
            href="/mentorship/applications"
            className="mt-2 inline-block text-sm font-medium text-green hover:underline"
          >
            View applications →
          </Link>
        </>
      )}
    </div>
  );
}
