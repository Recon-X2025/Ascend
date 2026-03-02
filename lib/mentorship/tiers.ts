/**
 * M-11: Mentor Reputation & Tier System.
 * System-calculated tiers; admin override supported. No M-6/M-7 payment or Steno logic.
 */

import type { MentorTier as PrismaMentorTier } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";

export const TIER_CONFIG = {
  RISING: {
    minOutcomes: 0,
    maxOutcomes: 4,
    maxActiveMentees: 2,
    platformFeePercent: 20,
    priorityMatching: false,
    featuredOnDiscovery: false,
  },
  ESTABLISHED: {
    minOutcomes: 5,
    maxOutcomes: 9,
    maxActiveMentees: 4,
    platformFeePercent: 15,
    priorityMatching: true,
    featuredOnDiscovery: false,
  },
  ELITE: {
    minOutcomes: 10,
    maxOutcomes: Infinity,
    maxActiveMentees: 6,
    platformFeePercent: 10,
    priorityMatching: true,
    featuredOnDiscovery: true,
  },
} as const;

export type MentorTierKey = keyof typeof TIER_CONFIG;

const DISPUTE_RATE_THRESHOLD = 0.25;
const VERIFICATION_LAPSED_DAYS = 30;

export function calculateTier(verifiedOutcomeCount: number): PrismaMentorTier {
  if (verifiedOutcomeCount >= 10) return "ELITE";
  if (verifiedOutcomeCount >= 5) return "ESTABLISHED";
  return "RISING";
}

export async function checkDemotionCriteria(mentorId: string): Promise<{
  shouldDemote: boolean;
  reason: string | null;
}> {
  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
    select: {
      disputeRate: true,
      verificationStatus: true,
      verification: { select: { updatedAt: true } },
    },
  });
  if (!profile) return { shouldDemote: false, reason: null };

  if (profile.disputeRate != null && profile.disputeRate > DISPUTE_RATE_THRESHOLD) {
    return { shouldDemote: true, reason: "DEMOTION_DISPUTE_RATE" };
  }

  if (profile.verificationStatus === "REVERIFICATION_REQUIRED") {
    const updatedAt = profile.verification?.updatedAt;
    if (updatedAt) {
      const daysSince = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > VERIFICATION_LAPSED_DAYS) {
        return { shouldDemote: true, reason: "DEMOTION_VERIFICATION_LAPSED" };
      }
    }
  }

  // M-7: wire demotion when stenoRate < 0.9 once M-7 session evidence is available
  return { shouldDemote: false, reason: null };
}

export type TierTrigger = "WEEKLY_CALC" | "ADMIN_OVERRIDE" | "OUTCOME_VERIFIED";

export async function recalculateMentorTier(
  mentorId: string,
  triggeredBy: TierTrigger,
  adminId?: string,
  overrideTier?: PrismaMentorTier,
  overrideNote?: string
): Promise<void> {
  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
    select: {
      id: true,
      verifiedOutcomeCount: true,
      tier: true,
      tierOverriddenByAdmin: true,
      verificationStatus: true,
      disputeRate: true,
      user: { select: { email: true, name: true } },
    },
  });
  if (!profile) return;

  if (profile.tierOverriddenByAdmin && triggeredBy === "WEEKLY_CALC") {
    return;
  }

  let newTier: PrismaMentorTier;
  let reason: string;

  if (overrideTier != null) {
    newTier = overrideTier;
    reason = "ADMIN_OVERRIDE";
  } else {
    const demotion = await checkDemotionCriteria(mentorId);
    if (demotion.shouldDemote && demotion.reason) {
      newTier = "RISING";
      reason = demotion.reason;
    } else {
      newTier = calculateTier(profile.verifiedOutcomeCount);
      reason = triggeredBy === "OUTCOME_VERIFIED" ? "OUTCOME_VERIFIED" : "WEEKLY_CALC";
    }
  }

  const previousTier = profile.tier;
  if (newTier === previousTier && !overrideTier) {
    await recalculateDisputeRate(mentorId);
    return;
  }

  const config = TIER_CONFIG[newTier as MentorTierKey];
  const now = new Date();

  await prisma.$transaction([
    prisma.mentorTierHistory.create({
      data: {
        mentorId,
        previousTier,
        newTier,
        reason,
        triggeredBy: adminId ?? null,
      },
    }),
    prisma.mentorProfile.update({
      where: { userId: mentorId },
      data: {
        tier: newTier,
        tierUpdatedAt: now,
        tierOverriddenByAdmin: overrideTier != null,
        ...(overrideTier != null && { tierOverrideNote: overrideNote ?? null }),
        maxActiveMentees: config.maxActiveMentees,
      },
    }),
  ]);

  await recalculateDisputeRate(mentorId);

  const actorIdForAudit = adminId ?? process.env.M16_SYSTEM_ACTOR_ID ?? undefined;
  if (actorIdForAudit) {
    const { logMentorshipAction } = await import("@/lib/mentorship/audit");
    await logMentorshipAction({
      actorId: actorIdForAudit,
      action: "TIER_RECALCULATED",
      category: "TIER",
      entityType: "MentorProfile",
      entityId: profile.id,
      previousState: { tier: previousTier },
      newState: { tier: newTier, reason },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  if (overrideTier != null && adminId) {
    const { sendTierAdminOverride } = await import("@/lib/email/templates/mentorship/tier-admin-override");
    await sendTierAdminOverride({
      to: profile.user?.email,
      mentorName: profile.user?.name ?? "Mentor",
      tier: newTier,
      note: overrideNote ?? "",
      profileUrl: `${baseUrl}/dashboard/mentor`,
    });
    await trackOutcome(adminId, "M11_TIER_ADMIN_OVERRIDE", {
      entityId: mentorId,
      entityType: "User",
      metadata: { mentorId, newTier, adminId },
    });
    return;
  }

  if (newTier !== previousTier) {
    const tierOrder = { RISING: 0, ESTABLISHED: 1, ELITE: 2 };
    const promoted = tierOrder[newTier] > tierOrder[previousTier];
    if (promoted) {
      const { sendTierPromoted } = await import("@/lib/email/templates/mentorship/tier-promoted");
      await sendTierPromoted({
        to: profile.user?.email,
        mentorName: profile.user?.name ?? "Mentor",
        newTier,
        platformFeePercent: config.platformFeePercent,
        maxActiveMentees: config.maxActiveMentees,
        priorityMatching: config.priorityMatching,
        featuredOnDiscovery: config.featuredOnDiscovery,
        profileUrl: `${baseUrl}/dashboard/mentor`,
      });
      await trackOutcome(mentorId, "M11_TIER_PROMOTED", {
        entityId: mentorId,
        entityType: "User",
        metadata: { mentorId, previousTier, newTier, reason },
      });
    } else {
      const { sendTierDemoted } = await import("@/lib/email/templates/mentorship/tier-demoted");
      await sendTierDemoted({
        to: profile.user?.email,
        mentorName: profile.user?.name ?? "Mentor",
        reason,
        newTier,
        platformFeePercent: config.platformFeePercent,
        maxActiveMentees: config.maxActiveMentees,
        profileUrl: `${baseUrl}/dashboard/mentor`,
        reverificationUrl: `${baseUrl}/mentorship/become-mentor`,
      });
      await trackOutcome(mentorId, "M11_TIER_DEMOTED", {
        entityId: mentorId,
        entityType: "User",
        metadata: { mentorId, previousTier, newTier, reason },
      });
    }
  }
}

export async function recalculateDisputeRate(mentorId: string): Promise<void> {
  const [total, upheld] = await Promise.all([
    prisma.mentorshipOutcome.count({ where: { mentorId } }),
    prisma.mentorshipOutcome.count({
      where: { mentorId, status: "OPS_REVIEWED", opsDecision: "UPHELD" },
    }),
  ]);
  const disputeRate = total === 0 ? 0 : upheld / total;
  await prisma.mentorProfile.update({
    where: { userId: mentorId },
    data: { disputeRate },
  });
}

export async function enforceCapacity(mentorId: string): Promise<{
  canAcceptNewMentee: boolean;
  activeMenteeCount: number;
  maxActiveMentees: number;
}> {
  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
    select: { activeMenteeCount: true, maxActiveMentees: true },
  });
  if (!profile) {
    return { canAcceptNewMentee: false, activeMenteeCount: 0, maxActiveMentees: 0 };
  }
  // ACTIVE and PAUSED both count against capacity (PAUSED = ops intervention, capacity not freed)
  const activeCount = await prisma.mentorshipContract.count({
    where: { mentorUserId: mentorId, status: { in: ["ACTIVE", "PAUSED"] } },
  });
  const max = profile.maxActiveMentees;
  return {
    canAcceptNewMentee: activeCount < max,
    activeMenteeCount: activeCount,
    maxActiveMentees: max,
  };
}

/** Call when a contract becomes ACTIVE (both parties signed). Increments activeMenteeCount. */
export async function incrementActiveMenteeCount(mentorId: string): Promise<void> {
  await prisma.mentorProfile.update({
    where: { userId: mentorId },
    data: { activeMenteeCount: { increment: 1 } },
  });
}

/** Call when a contract leaves ACTIVE (COMPLETED, DISPUTED, TERMINATED_*, VOID). Decrements activeMenteeCount. */
export async function decrementActiveMenteeCount(mentorId: string): Promise<void> {
  await prisma.mentorProfile.update({
    where: { userId: mentorId },
    data: { activeMenteeCount: { decrement: 1 } },
  });
}
