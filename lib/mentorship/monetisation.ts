/**
 * M-13: Mentor Monetisation Unlock.
 * mentorId in APIs = User.id. MentorMonetisationStatus.mentorId = MentorProfile.id.
 */

import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { getMentorUpheldCount } from "@/lib/mentorship/dispute-strikes";
import type { OutcomeEventType } from "@prisma/client";

// Unlock criteria — must meet ALL
export const MONETISATION_UNLOCK_CRITERIA = {
  minVerifiedOutcomes: 3,
  minStenoRate: 0.9,
  maxUpheldDisputes: 0,
  minMonthsOnPlatform: 6,
  reVerificationCurrent: true,
} as const;

export const MENTORSHIP_PRICING_RULES = {
  sessionFloorPaise: 200000,   // ₹2,000
  sessionCeilingPaise: 2500000, // ₹25,000
} as const;

/** Resolve MentorProfile by userId (User.id). */
async function getMentorProfileByUserId(userId: string) {
  return prisma.mentorProfile.findUnique({
    where: { userId },
    include: {
      monetisationStatus: true,
    },
  });
}

/** Compute steno rate: count(COMPLETED sessions with stenoStatus=COMPLETED) / count(COMPLETED sessions). */
export async function computeStenoRate(mentorId: string): Promise<number | null> {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
    select: { id: true },
  });
  if (!mentorProfile) return null;

  const contractIds = await prisma.mentorshipContract.findMany({
    where: { mentorUserId: mentorId },
    select: { id: true },
  });
  const cids = contractIds.map((c) => c.id);
  if (cids.length === 0) return null;

  const [totalCompleted, withSteno] = await Promise.all([
    prisma.engagementSession.count({
      where: {
        contractId: { in: cids },
        status: "COMPLETED",
      },
    }),
    prisma.engagementSession.count({
      where: {
        contractId: { in: cids },
        status: "COMPLETED",
        stenoStatus: "COMPLETED",
      },
    }),
  ]);

  if (totalCompleted === 0) return null;
  return withSteno / totalCompleted;
}

/** Check if mentor meets monetisation unlock criteria. */
export async function checkMonetisationEligibility(mentorId: string): Promise<{
  eligible: boolean;
  verifiedOutcomeCount: number;
  stenoRate: number | null;
  upheldDisputeCount: number;
  monthsOnPlatform: number;
  reVerificationCurrent: boolean;
  reasons: string[];
}> {
  const profile = await getMentorProfileByUserId(mentorId);
  if (!profile) {
    return {
      eligible: false,
      verifiedOutcomeCount: 0,
      stenoRate: null,
      upheldDisputeCount: 0,
      monthsOnPlatform: 0,
      reVerificationCurrent: false,
      reasons: ["No mentor profile"],
    };
  }

  const upheldDisputeCount = await getMentorUpheldCount(mentorId);
  const verifiedOutcomeCount = await prisma.mentorshipOutcome.count({
    where: { mentorId, status: "VERIFIED" },
  });
  const stenoRate = await computeStenoRate(mentorId);

  const createdAt = await prisma.user.findUnique({
    where: { id: mentorId },
    select: { createdAt: true },
  });
  const monthsOnPlatform = createdAt
    ? Math.floor((Date.now() - new Date(createdAt.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  const verification = await prisma.mentorVerification.findUnique({
    where: { mentorProfileId: profile.id },
    select: { status: true },
  });
  const reVerificationCurrent = verification?.status === "VERIFIED";

  const reasons: string[] = [];

  if (verifiedOutcomeCount < MONETISATION_UNLOCK_CRITERIA.minVerifiedOutcomes) {
    reasons.push(
      `Need ${MONETISATION_UNLOCK_CRITERIA.minVerifiedOutcomes} verified outcomes (have ${verifiedOutcomeCount})`
    );
  }
  if (stenoRate != null && stenoRate < MONETISATION_UNLOCK_CRITERIA.minStenoRate) {
    reasons.push(
      `Steno rate must be ≥${MONETISATION_UNLOCK_CRITERIA.minStenoRate * 100}% (current ${Math.round((stenoRate ?? 0) * 100)}%)`
    );
  }
  if (upheldDisputeCount > MONETISATION_UNLOCK_CRITERIA.maxUpheldDisputes) {
    reasons.push(`Upheld disputes must be ≤${MONETISATION_UNLOCK_CRITERIA.maxUpheldDisputes} (have ${upheldDisputeCount})`);
  }
  if (monthsOnPlatform < MONETISATION_UNLOCK_CRITERIA.minMonthsOnPlatform) {
    reasons.push(
      `Need ${MONETISATION_UNLOCK_CRITERIA.minMonthsOnPlatform} months on platform (have ${monthsOnPlatform})`
    );
  }
  if (!reVerificationCurrent) {
    reasons.push("Re-verification must be current");
  }

  const eligible = reasons.length === 0;

  return {
    eligible,
    verifiedOutcomeCount,
    stenoRate,
    upheldDisputeCount,
    monthsOnPlatform,
    reVerificationCurrent,
    reasons,
  };
}

/** Idempotent monetisation unlock check. Upserts MentorMonetisationStatus, unlock/relock logic, canChargeMentees = isUnlocked AND hasMarketplacePlan. */
export async function runMonetisationUnlockCheck(mentorId: string): Promise<void> {
  const profile = await getMentorProfileByUserId(mentorId);
  if (!profile) return;

  const eligibility = await checkMonetisationEligibility(mentorId);
  const { getMentorActivePlan } = await import("@/lib/payments/plans");
  const hasMarketplacePlan = (await getMentorActivePlan(mentorId)) != null;

  const now = new Date();
  const data = {
    verifiedOutcomeCount: eligibility.verifiedOutcomeCount,
    stenoRate: eligibility.stenoRate,
    upheldDisputeCount: eligibility.upheldDisputeCount,
    monthsOnPlatform: eligibility.monthsOnPlatform,
    reVerificationCurrent: eligibility.reVerificationCurrent,
    lastCheckedAt: now,
  };

  const existing = profile.monetisationStatus;

  if (eligibility.eligible) {
    const wasLocked = existing?.isUnlocked === false || !existing;
    await prisma.mentorMonetisationStatus.upsert({
      where: { mentorId: profile.id },
      create: {
        mentorId: profile.id,
        isUnlocked: true,
        unlockedAt: now,
        lockedReason: null,
        reLockedAt: null,
        ...data,
      },
      update: {
        isUnlocked: true,
        unlockedAt: existing?.unlockedAt ?? now,
        lockedReason: null,
        reLockedAt: null,
        ...data,
      },
    });

    const canChargeMentees = eligibility.eligible && hasMarketplacePlan;
    await prisma.mentorProfile.update({
      where: { id: profile.id },
      data: { canChargeMentees },
    });

    if (wasLocked) {
      await trackOutcome(mentorId, "M13_MONETISATION_ELIGIBLE" as OutcomeEventType, {
        entityId: profile.id,
        entityType: "MentorProfile",
        metadata: { mentorId, ...eligibility },
      });
      await trackOutcome(mentorId, "M13_MONETISATION_UNLOCKED" as OutcomeEventType, {
        entityId: profile.id,
        entityType: "MentorProfile",
        metadata: { mentorId, ...eligibility },
      });
    }
  } else {
    const wasUnlocked = existing?.isUnlocked === true;
    const lockedReason = eligibility.reasons.join("; ");
    await prisma.mentorMonetisationStatus.upsert({
      where: { mentorId: profile.id },
      create: {
        mentorId: profile.id,
        isUnlocked: false,
        lockedReason,
        reLockedAt: wasUnlocked ? now : null,
        ...data,
      },
      update: {
        isUnlocked: false,
        lockedReason,
        reLockedAt: wasUnlocked ? now : existing?.reLockedAt,
        ...data,
      },
    });

    await prisma.mentorProfile.update({
      where: { id: profile.id },
      data: { canChargeMentees: false },
    });

    if (wasUnlocked) {
      await trackOutcome(mentorId, "M13_MONETISATION_RELOCKED" as OutcomeEventType, {
        entityId: profile.id,
        entityType: "MentorProfile",
        metadata: { mentorId, lockedReason, ...eligibility },
      });
    }
  }
}

/** Validate session fee against floor/ceiling. */
export function validateSessionFee(feePaise: number): { valid: boolean; message?: string } {
  if (
    feePaise < MENTORSHIP_PRICING_RULES.sessionFloorPaise ||
    feePaise > MENTORSHIP_PRICING_RULES.sessionCeilingPaise
  ) {
    return {
      valid: false,
      message: `Session fee must be between ₹${MENTORSHIP_PRICING_RULES.sessionFloorPaise / 100} and ₹${MENTORSHIP_PRICING_RULES.sessionCeilingPaise / 100}`,
    };
  }
  return { valid: true };
}

/** Set session fee for mentor. mentorId = User.id. */
export async function setSessionFee(mentorId: string, feePaise: number): Promise<{ ok: boolean; error?: string }> {
  const validation = validateSessionFee(feePaise);
  if (!validation.valid) return { ok: false, error: validation.message };

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
    select: { id: true, sessionFeePaise: true },
  });
  if (!profile) return { ok: false, error: "Mentor profile not found" };

  const wasSet = profile.sessionFeePaise != null;
  await prisma.mentorProfile.update({
    where: { userId: mentorId },
    data: { sessionFeePaise: feePaise },
  });

  await trackOutcome(
    mentorId,
    (wasSet ? "M13_SESSION_FEE_UPDATED" : "M13_SESSION_FEE_SET") as OutcomeEventType,
    {
      entityId: profile.id,
      entityType: "MentorProfile",
      metadata: { feePaise, previousFeePaise: profile.sessionFeePaise },
    }
  );

  return { ok: true };
}
