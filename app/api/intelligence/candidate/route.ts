import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { canUseFeature } from "@/lib/payments/gate";
import { candidateIntelligenceQueue } from "@/lib/queues";
import { roleToSlug } from "@/lib/salary/normalize";

const STALE_HOURS = 24;

const EMPTY_PAYLOAD = {
  marketValue: null,
  premiumRequiredMarketValue: true,
  visibility: null,
  skillsGap: { targetRole: null, items: [], totalJDs: 0, allItems: null },
  premiumRequiredSkillsGapFull: true,
  appPerformance: null,
  heatmap: null,
  computedAt: null,
  stale: true,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    const userId = session.user.id;

    const [snapshot, marketValueAllowed, skillsGapFullAllowed, careerContext] = await Promise.all([
    prisma.candidateInsightSnapshot.findUnique({
      where: { userId },
    }),
    canUseFeature(userId, "candidate_intelligence_market_value"),
    canUseFeature(userId, "candidate_intelligence_skills_gap_full"),
    prisma.userCareerContext.findUnique({
      where: { userId },
      select: { targetRole: true },
    }),
  ]);

  const now = new Date();
  const computedAt = snapshot?.computedAt;
  const isStale =
    !computedAt ||
    (now.getTime() - computedAt.getTime()) / (60 * 60 * 1000) > STALE_HOURS;

  if (isStale && computedAt) {
    try {
      await candidateIntelligenceQueue.add(
        "compute",
        { userId },
        { jobId: `candidate-intel-${userId}` }
      );
    } catch {
      // ignore enqueue errors
    }
  }

  const visibilityFactors = snapshot?.visibilityFactors as Record<
    string,
    unknown
  > | null;
  const recommendations = Array.isArray(visibilityFactors?.recommendations)
    ? visibilityFactors.recommendations
    : [];

  const skillsGapStored = snapshot?.skillsGapData as
    | { targetRole?: string; totalJDs?: number; items?: Array<{ skill: string; frequency: number; urgency: string }> }
    | null;
  const skillsList = Array.isArray(skillsGapStored?.items) ? skillsGapStored.items : [];
  const skillsGapForFree = skillsGapFullAllowed.allowed
    ? skillsList
    : skillsList.slice(0, 3);

  const payload = {
    marketValue:
      marketValueAllowed.allowed && snapshot?.marketValueMin != null
        ? {
            min: snapshot.marketValueMin,
            max: snapshot.marketValueMax,
            median: snapshot.marketValueMedian,
            basis: snapshot.marketValueBasis,
            sourceLabel: "Community reported",
            targetRoleSlug: careerContext?.targetRole
              ? roleToSlug(careerContext.targetRole)
              : null,
          }
        : null,
    premiumRequiredMarketValue: !marketValueAllowed.allowed,
    visibility: snapshot?.visibilityScore != null
      ? {
          score: snapshot.visibilityScore,
          factors: (snapshot.visibilityFactors as Record<string, number>) ?? {},
          recommendations,
        }
      : null,
    skillsGap: {
      targetRole: skillsGapStored?.targetRole ?? null,
      items: skillsGapForFree,
      totalJDs: skillsGapStored?.totalJDs ?? 0,
      allItems: skillsGapFullAllowed.allowed ? skillsList : null,
    },
    premiumRequiredSkillsGapFull: !skillsGapFullAllowed.allowed,
    appPerformance: snapshot?.appPerformanceData ?? null,
    heatmap: snapshot?.heatmapData ?? null,
    computedAt: snapshot?.computedAt?.toISOString() ?? null,
    stale: isStale,
  };

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[intelligence/candidate] GET error:", e);
    return NextResponse.json(EMPTY_PAYLOAD);
  }
}
