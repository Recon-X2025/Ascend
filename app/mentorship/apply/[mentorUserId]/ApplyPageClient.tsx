"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ApplicationForm } from "@/components/mentorship/ApplicationForm";
import { Check } from "lucide-react";
import { M2_FOCUS_AREA_LABELS } from "@/lib/mentorship/m2-labels";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Match = {
  mentorProfileId: string;
  mentorUserId: string;
  mentorName: string | null;
  matchReason: string;
  profile: {
    fromRole: string | null;
    fromCompanyType: string | null;
    toRole: string | null;
    toCompanyType: string | null;
    m2FocusAreas: string[];
  };
};

export function ApplyPageClient({ mentorUserId }: { mentorUserId: string }) {
  const router = useRouter();
  const [redirected, setRedirected] = useState(false);

  const { data: readiness } = useSWR("/api/mentorship/readiness", fetcher);
  const { data: applications } = useSWR("/api/mentorship/applications", fetcher);
  const { data: discover } = useSWR(
    readiness?.allGatesPassed ? "/api/mentorship/discover" : null,
    fetcher
  );

  const gateBlocked =
    discover && typeof discover === "object" && "gateBlocked" in discover && (discover as { gateBlocked: boolean }).gateBlocked;
  const match: Match | null = gateBlocked
    ? null
    : Array.isArray(discover)
      ? discover.find((m: Match) => m.mentorUserId === mentorUserId) ?? null
      : null;

  const activeCount = Array.isArray(applications)
    ? applications.filter((a: { status: string }) =>
        ["PENDING", "QUESTION_ASKED"].includes(a.status)
      ).length
    : 0;
  const hasApplicationToThisMentor = Array.isArray(applications)
    ? applications.some(
        (a: { mentorUserId: string }) => a.mentorUserId === mentorUserId
      )
    : false;

  useEffect(() => {
    if (redirected) return;
    if (readiness && !readiness.allGatesPassed) {
      setRedirected(true);
      router.replace("/mentorship");
      return;
    }
    if (applications && activeCount >= 2) {
      setRedirected(true);
      router.replace("/mentorship?message=at-limit");
      return;
    }
    if (applications && hasApplicationToThisMentor) {
      setRedirected(true);
      router.replace("/mentorship/applications");
      return;
    }
    if (discover && !Array.isArray(discover) && discover.gateBlocked) {
      setRedirected(true);
      router.replace("/mentorship");
      return;
    }
    if (discover && Array.isArray(discover) && !gateBlocked && !match) {
      setRedirected(true);
      router.replace("/mentorship");
      return;
    }
  }, [
    readiness,
    applications,
    discover,
    match,
    activeCount,
    hasApplicationToThisMentor,
    gateBlocked,
    router,
    redirected,
  ]);

  if (readiness === undefined || !match) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const firstName = match.mentorName?.split(" ")[0] ?? "Mentor";
  const from = [match.profile.fromRole, match.profile.fromCompanyType].filter(Boolean).join(" at ");
  const to = [match.profile.toRole, match.profile.toCompanyType].filter(Boolean).join(" at ");
  const transitionText = from && to ? `${from} → ${to}` : null;

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="ascend-card p-6 mb-8">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold text-ink">{match.mentorName ?? "Mentor"}</h2>
            <Check className="h-5 w-5 text-green" />
          </div>
          {transitionText && (
            <p className="text-sm text-muted-foreground mt-1">{transitionText}</p>
          )}
          <p className="mt-2 text-sm italic text-ink/90">{match.matchReason}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {(match.profile.m2FocusAreas ?? []).map((f) => (
              <span
                key={f}
                className="inline-block px-2 py-0.5 rounded border border-border text-xs text-muted-foreground"
              >
                {M2_FOCUS_AREA_LABELS[f as keyof typeof M2_FOCUS_AREA_LABELS] ?? f}
              </span>
            ))}
          </div>
        </div>

        <ApplicationForm
          mentorProfileId={match.mentorProfileId}
          matchReason={match.matchReason}
          mentorFirstName={firstName}
        />
      </div>
    </div>
  );
}
