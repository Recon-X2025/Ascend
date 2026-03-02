/**
 * M-13: Mentor SEO Boost.
 * mentorId = MentorProfile.id in DB; resolve via User.id in APIs.
 */

import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import type { OutcomeEventType, SeoBoostType } from "@prisma/client";

export const SEO_BOOST_MULTIPLIER = 1.3;

/** Get MentorProfile.id from User.id. */
async function getMentorProfileId(userId: string): Promise<string | null> {
  const p = await prisma.mentorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return p?.id ?? null;
}

/** Purchase SEO boost. mentorId = User.id. */
export async function purchaseSeoBoost(
  mentorId: string,
  boostType: SeoBoostType,
  razorpayPaymentId: string
): Promise<{ ok: boolean; boostId?: string; error?: string }> {
  const profileId = await getMentorProfileId(mentorId);
  if (!profileId) return { ok: false, error: "Mentor profile not found" };

  const { MENTOR_MARKETPLACE_PLAN } = await import("@/lib/payments/plans");
  const pricing = MENTOR_MARKETPLACE_PLAN.seoBoostPricing;
  const pricePaise = pricing?.[boostType];
  if (pricePaise == null) return { ok: false, error: "Invalid boost type" };

  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(now);

  if (boostType === "MONTHLY_RECURRING") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (boostType === "ONE_TIME_30_DAYS") {
    endDate.setDate(endDate.getDate() + 30);
  } else if (boostType === "ONE_TIME_14_DAYS") {
    endDate.setDate(endDate.getDate() + 14);
  } else {
    return { ok: false, error: "Unknown boost type" };
  }

  const boost = await prisma.mentorSeoBoost.create({
    data: {
      mentorId: profileId,
      boostType,
      pricePaise,
      startDate,
      endDate,
      active: true,
      razorpayPaymentId,
    },
  });

  await trackOutcome(mentorId, "M13_SEO_BOOST_PURCHASED" as OutcomeEventType, {
    entityId: boost.id,
    entityType: "MentorSeoBoost",
    metadata: { boostType, pricePaise, endDate: endDate.toISOString() },
  });

  return { ok: true, boostId: boost.id };
}

/** Check if mentor has active SEO boost. mentorId = User.id. */
export async function hasActiveSeoBoost(mentorId: string): Promise<boolean> {
  const profileId = await getMentorProfileId(mentorId);
  if (!profileId) return false;

  const count = await prisma.mentorSeoBoost.count({
    where: {
      mentorId: profileId,
      active: true,
      endDate: { gte: new Date() },
    },
  });
  return count > 0;
}

/** Get SEO boost multiplier for scoring: 1.3 if boost, 1.0 otherwise. */
export function getSeoBoostMultiplier(hasBoost: boolean): number {
  return hasBoost ? SEO_BOOST_MULTIPLIER : 1.0;
}

/** Expire boosts past endDate. Call from cron. */
export async function expireEndedBoosts(): Promise<number> {
  const now = new Date();
  const expired = await prisma.mentorSeoBoost.findMany({
    where: { active: true, endDate: { lt: now } },
    select: { id: true, mentorId: true, mentor: { select: { userId: true } } },
  });

  if (expired.length === 0) return 0;

  await prisma.mentorSeoBoost.updateMany({
    where: { id: { in: expired.map((b) => b.id) } },
    data: { active: false },
  });

  for (const b of expired) {
    const userId = b.mentor?.userId;
    if (userId) {
      trackOutcome(userId, "M13_SEO_BOOST_EXPIRED" as OutcomeEventType, {
        entityId: b.id,
        entityType: "MentorSeoBoost",
        metadata: {},
      }).catch(() => {});
    }
  }

  return expired.length;
}
