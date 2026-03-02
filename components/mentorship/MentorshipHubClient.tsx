"use client";

import useSWR from "swr";
import Link from "next/link";
import { ReadinessGate } from "./ReadinessGate";
import { MentorMatchCardM3, type Match } from "./MentorMatchCardM3";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  const text = await r.text();
  if (!r.ok) {
    const err: Error & { status?: number } = new Error(r.statusText || "Request failed");
    err.status = r.status;
    try {
      const json = JSON.parse(text);
      if (json?.error) err.message = json.error;
    } catch {
      // ignore
    }
    throw err;
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid response");
  }
};

type Readiness = {
  allGatesPassed?: boolean;
  profileComplete?: boolean;
  careerContextComplete?: boolean;
  transitionDeclared?: boolean;
};

type DiscoverMatch = {
  mentorProfileId: string;
  mentorUserId: string;
  mentorName: string | null;
  mentorImage: string | null;
  matchReason: string;
  profile: {
    fromRole: string | null;
    fromCompanyType: string | null;
    toRole: string | null;
    toCompanyType: string | null;
    transitionDurationMonths: number | null;
    transitionYear: number | null;
    toCity: string | null;
    m2FocusAreas: string[];
    sessionFrequency: string | null;
    maxActiveMentees: number;
    currentMenteeCount: number;
  };
};

export function MentorshipHubClient() {
  const { data: readiness, error: readinessError, mutate: mutateReadiness } = useSWR<Readiness>(
    "/api/mentorship/readiness",
    fetcher
  );

  const { data: discover } = useSWR(
    readiness?.allGatesPassed ? "/api/mentorship/discover" : null,
    fetcher
  );

  const { data: applications } = useSWR(
    readiness?.allGatesPassed ? "/api/mentorship/applications" : null,
    fetcher
  );

  const { data: contractsData } = useSWR<{ contracts: { id: string; status: string }[] }>(
    readiness?.allGatesPassed ? "/api/mentorship/contracts" : null,
    fetcher
  );
  const { data: addendumData } = useSWR<{ signed?: boolean }>(
    readiness?.allGatesPassed ? "/api/mentorship/legal/MENTORSHIP_MARKETPLACE_ADDENDUM" : null,
    fetcher
  );
  const contracts = contractsData?.contracts ?? [];
  const addendumSigned = addendumData?.signed === true;
  const pendingMentorSign = contracts.find((c) => c.status === "PENDING_MENTOR_SIGNATURE");
  const pendingMenteeSign = contracts.find((c) => c.status === "PENDING_MENTEE_SIGNATURE");
  const activeContract = contracts.find((c) => c.status === "ACTIVE");
  const hasEngagements = contracts.some((c) => ["ACTIVE", "PAUSED", "COMPLETED"].includes(c.status));

  const { data: menteeSummary } = useSWR<{
    goalsAchieved: number;
    engagementsActive: number;
  }>(hasEngagements ? "/api/mentorship/analytics/mentee/me" : null, fetcher);

  const activeCount = Array.isArray(applications)
    ? applications.filter((a: { status: string }) =>
        ["PENDING", "QUESTION_ASKED"].includes(a.status)
      ).length
    : 0;
  const atLimit = activeCount >= 2;
  const gateBlocked =
    (discover && typeof discover === "object" && "gateBlocked" in discover && (discover as { gateBlocked: boolean }).gateBlocked) === true;
  const matches: DiscoverMatch[] = Array.isArray(discover) ? discover : [];

  if (readiness === undefined && !readinessError) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (readinessError) {
    const serverMessage =
      readinessError.message && readinessError.message !== "Request failed"
        ? readinessError.message
        : null;
    return (
      <div className="min-h-screen bg-[#F7F6F1]">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-[#0F1A0F] mb-2">Mentorship</h1>
          <p className="text-muted-foreground mb-4">
            We couldn&apos;t load your mentorship status. Please try again.
          </p>
          {serverMessage && process.env.NODE_ENV === "development" && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-4 font-mono">
              {serverMessage}
            </p>
          )}
          <button
            type="button"
            onClick={() => mutateReadiness()}
            className="ascend-button primary"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!readiness || !readiness.allGatesPassed || gateBlocked) {
    return (
      <div className="min-h-screen bg-[#F7F6F1]">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-[#0F1A0F] mb-2">Mentorship</h1>
          <p className="text-muted-foreground mb-8">
            Earn access to mentors who&apos;ve made the transition you&apos;re planning.
          </p>
          <ReadinessGate />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {addendumSigned === false && (
          <div className="rounded-lg border border-amber-300 bg-amber-100 p-4 mb-6">
            <p className="font-medium text-amber-900">
              To apply to mentors or become a mentor, you must first sign the Mentorship Marketplace Addendum.
            </p>
            <Link
              href="/mentorship/legal/sign/MENTORSHIP_MARKETPLACE_ADDENDUM?next=/mentorship"
              className="mt-2 inline-block text-amber-800 font-medium hover:underline"
            >
              Review &amp; Sign →
            </Link>
          </div>
        )}
        {pendingMenteeSign && (
          <div className="rounded-lg border border-amber-300 bg-amber-100 p-4 mb-6">
            <p className="font-medium text-amber-900">
              Action required: Please sign your engagement contract.
            </p>
            <Link
              href={`/mentorship/contracts/${pendingMenteeSign.id}`}
              className="mt-2 inline-block text-amber-800 font-medium hover:underline"
            >
              Sign contract →
            </Link>
          </div>
        )}
        {pendingMentorSign && !pendingMenteeSign && (
          <div className="rounded-lg border border-gray-200 bg-gray-100 p-4 mb-6">
            <p className="text-[#0F1A0F]">
              Waiting for your mentor to sign the contract.
            </p>
          </div>
        )}
        {activeContract && !pendingMenteeSign && !pendingMentorSign && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-6">
            <p className="font-medium text-green-800">
              Contract active. Your engagement has begun.
            </p>
            <Link
              href={`/mentorship/contracts/${activeContract.id}`}
              className="mt-2 inline-block text-green-700 font-medium hover:underline"
            >
              View contract →
            </Link>
          </div>
        )}
        {hasEngagements && (
          <div className="rounded-lg border border-[#0F1A0F]/20 bg-white p-4 mb-6">
            <h2 className="font-semibold text-[#0F1A0F] mb-1">My Progress</h2>
            <p className="text-sm text-muted-foreground">
              Goals achieved: {menteeSummary?.goalsAchieved ?? "—"} · Active: {menteeSummary?.engagementsActive ?? "—"}
            </p>
            <Link
              href="/dashboard/mentee/engagements"
              className="mt-2 inline-block text-green font-medium hover:underline text-sm"
            >
              View my engagements →
            </Link>
          </div>
        )}
        <h1 className="text-2xl font-bold text-[#0F1A0F]">Your mentor matches</h1>
        <p className="text-muted-foreground mt-1 mb-8">
          Based on your profile and target transition, we&apos;ve identified mentors who&apos;ve made
          this journey.
        </p>

        {atLimit ? (
          <div className="ascend-card p-6">
            <p className="text-ink">
              You have 2 active applications. You can apply to a new mentor once one is resolved.
            </p>
            <Link
              href="/mentorship/applications"
              className="mt-4 inline-block text-green font-medium hover:underline"
            >
              View applications →
            </Link>
          </div>
        ) : matches.length === 0 ? (
          <div className="ascend-card p-8 text-center">
            <p className="text-ink">
              No mentors matched your profile right now. We&apos;re building the mentor
              community — check back soon.
            </p>
            <Link
              href="/mentorship/become-a-mentor"
              className="mt-4 inline-block text-green font-medium hover:underline"
            >
              Are you a mentor? Join the platform →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {(matches as Match[]).map((m) => (
              <MentorMatchCardM3 key={m.mentorUserId} match={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
