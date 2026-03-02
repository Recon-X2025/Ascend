import { prisma } from "@/lib/prisma/client";
import type { MentorProfile } from "@prisma/client";
import { redis } from "@/lib/redis/client";
import { scoreMentors, type MatchDimensions } from "./match";
import { hasActiveSeoBoost, getSeoBoostMultiplier } from "./seo-boost";

const CACHE_KEY_PREFIX = "mentorship:discover:";
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

export interface MentorMatch {
  mentorProfile: MentorProfile & {
    user: { id: string; name: string | null; image: string | null };
    verification: { status: string } | null;
    availabilityWindows: { dayOfWeek: string }[];
  };
  matchReason: string;
  matchScore: number;
  /** Internal only — for snapshot on application submit; never returned to mentee */
  dimensions?: MatchDimensions;
}

type MentorRow = MentorProfile & {
  user: { id: string; name: string | null; image: string | null };
  verification: { status: string } | null;
  availabilityWindows: { dayOfWeek: string }[];
};

/**
 * Curated discovery: up to 3 mentors for a mentee.
 * M-4: real scoring via scoreMentors(); result cached 6hr; reason only to client.
 */
export async function discoverMentors(menteeId: string): Promise<MentorMatch[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}${menteeId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as {
        profileIds: string[];
        reasons: string[];
        scores: number[];
        dimensions: MatchDimensions[];
      };
      if (parsed.profileIds?.length > 0) {
        const profiles = await prisma.mentorProfile.findMany({
          where: { id: { in: parsed.profileIds } },
          include: {
            user: { select: { id: true, name: true, image: true } },
            verification: { select: { status: true } },
            availabilityWindows: true,
          },
        });
        const byId = new Map(profiles.map((p) => [p.id, p]));
        const raw = parsed.profileIds.map((id, i) => {
          const profile = byId.get(id);
          if (!profile) return null;
          return {
            mentorProfile: profile as MentorRow,
            matchReason: parsed.reasons[i] ?? "",
            matchScore: parsed.scores[i] ?? 0,
            dimensions: parsed.dimensions?.[i],
          };
        });
        return raw.filter((m) => m != null) as MentorMatch[];
      }
    }
  } catch {
    // cache miss or parse error — compute below
  }

  const [readiness, careerContext, existingApplicationProfileIds] = await Promise.all([
    prisma.menteeReadinessCheck.findUnique({
      where: { userId: menteeId },
      select: {
        targetFromRole: true,
        targetFromIndustry: true,
        targetToRole: true,
        targetToIndustry: true,
        targetCity: true,
      },
    }),
    prisma.userCareerContext.findUnique({
      where: { userId: menteeId },
    }),
    prisma.mentorApplication
      .findMany({
        where: {
          menteeId,
          status: { in: ["PENDING", "QUESTION_ASKED", "ACCEPTED"] },
        },
        select: { mentorProfileId: true },
      })
      .then((rows) => new Set(rows.map((r) => r.mentorProfileId))),
  ]);

  const mentorsRaw = await prisma.mentorProfile.findMany({
    where: {
      isPublic: true,
      isDiscoverable: true,
      isActive: true,
      userId: { not: menteeId },
      id: { notIn: Array.from(existingApplicationProfileIds) },
      verification: { status: "VERIFIED" },
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
      verification: { select: { status: true } },
      availabilityWindows: true,
    },
  });

  const mentors = mentorsRaw.filter(
    (mp) => (mp.currentMenteeCount ?? 0) < (mp.maxActiveMentees ?? 2)
  ) as MentorRow[];

  const menteeInput = {
    careerContext,
    targetFromRole: readiness?.targetFromRole ?? null,
    targetToRole: readiness?.targetToRole ?? null,
    targetFromIndustry: readiness?.targetFromIndustry ?? null,
    targetToIndustry: readiness?.targetToIndustry ?? null,
    targetCity: readiness?.targetCity ?? null,
    primaryNeed: careerContext?.primaryNeed ?? null,
    preferredGeography: careerContext?.targetGeography ?? null,
  };

  let scored = scoreMentors(menteeInput, mentors);

  // M-13: Apply SEO boost multiplier SAME-TIER only (never elevate lower tier above higher)
  if (scored.length > 0) {
    const mentorByProfileId = new Map(mentors.map((m) => [m.id, m]));
    const tierOrder: Record<string, number> = { ELITE: 2, ESTABLISHED: 1, RISING: 0 };
    const boostResults = await Promise.all(
      scored.map((s) => hasActiveSeoBoost(s.mentorUserId))
    );
    const withBoost = scored.map((s, i) => {
      const mentor = mentorByProfileId.get(s.mentorProfileId);
      const tier = mentor?.tier ?? "RISING";
      const hasBoost = boostResults[i] ?? false;
      const multiplier = getSeoBoostMultiplier(hasBoost);
      return { item: { ...s, totalScore: s.totalScore * multiplier }, tierOrder: tierOrder[tier] ?? 0 };
    });
    withBoost.sort((a, b) => {
      if (b.tierOrder !== a.tierOrder) return b.tierOrder - a.tierOrder;
      return b.item.totalScore - a.item.totalScore;
    });
    scored = withBoost.slice(0, 3).map((x) => x.item);
  }

  if (scored.length === 0) {
    try {
      await redis.set(cacheKey, JSON.stringify({ profileIds: [], reasons: [], scores: [], dimensions: [] }), "EX", CACHE_TTL_SECONDS);
    } catch {
      // ignore
    }
    return [];
  }

  const profileIds = scored.map((s) => s.mentorProfileId);
  const reasons = scored.map((s) => s.reason);
  const scores = scored.map((s) => s.totalScore);
  const dimensions = scored.map((s) => s.dimensions);

  try {
    await redis.set(
      cacheKey,
      JSON.stringify({ profileIds, reasons, scores, dimensions }),
      "EX",
      CACHE_TTL_SECONDS
    );
  } catch {
    // ignore
  }

  const byId = new Map(mentors.map((m) => [m.id, m]));
  return scored.map((s) => {
    const profile = byId.get(s.mentorProfileId);
    if (!profile) return null;
    return {
      mentorProfile: profile,
      matchReason: s.reason,
      matchScore: s.totalScore,
      dimensions: s.dimensions,
    };
  }).filter((m) => m != null) as MentorMatch[];
}

export function getDiscoverCacheKey(menteeUserId: string): string {
  return `${CACHE_KEY_PREFIX}${menteeUserId}`;
}
