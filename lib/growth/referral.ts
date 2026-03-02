import { prisma } from "@/lib/prisma/client";
import { redis } from "@/lib/redis/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { OutcomeEventType } from "@prisma/client";

const REFERRAL_REDIS_PREFIX = "referral:";
const REFERRAL_REDIS_TTL_DAYS = 30;

/** Generate a human-readable referral code: first name (up to 6 chars, uppercase) + 2-digit number. */
export async function generateReferralCode(userId: string): Promise<string> {
  const existing = await prisma.referralCode.findUnique({
    where: { userId },
    select: { code: true },
  });
  if (existing) return existing.code;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  const firstName = (user?.name ?? "User").trim().split(/\s+/)[0] ?? "User";
  const base = firstName.slice(0, 6).toUpperCase().replace(/[^A-Z]/g, "X") || "USER";

  for (let attempt = 0; attempt < 100; attempt++) {
    const num = Math.floor(Math.random() * 100);
    const code = `${base}${num.toString().padStart(2, "0")}`;
    try {
      await prisma.referralCode.create({
        data: { userId, code },
      });
      return code;
    } catch (e) {
      const prismaError = e as { code?: string };
      if (prismaError.code === "P2002") continue; // unique violation
      throw e;
    }
  }
  throw new Error("Could not generate unique referral code");
}

/**
 * Track a referral link click. Increments ReferralCode.clicks, creates Referral (CLICKED),
 * stores codeId in Redis for attribution at signup. Returns referrerId for personalised landing.
 */
export async function trackReferralClick(
  code: string,
  sessionId: string,
  referredEmail?: string | null
): Promise<{ referrerId: string; referrerFirstName: string } | null> {
  const referralCode = await prisma.referralCode.findUnique({
    where: { code: code.toUpperCase().trim() },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!referralCode) return null;

  const referrerFirstName = (referralCode.user.name ?? "Someone").trim().split(/\s+/)[0] ?? "Someone";

  await prisma.$transaction([
    prisma.referralCode.update({
      where: { id: referralCode.id },
      data: { clicks: { increment: 1 } },
    }),
    prisma.referral.create({
      data: {
        referrerId: referralCode.userId,
        codeId: referralCode.id,
        referredEmail: referredEmail?.trim() || null,
        status: "CLICKED",
      },
    }),
  ]);

  const ttlSeconds = REFERRAL_REDIS_TTL_DAYS * 24 * 60 * 60;
  await redis.setex(`${REFERRAL_REDIS_PREFIX}${sessionId}`, ttlSeconds, referralCode.id);

  trackOutcome(referralCode.userId, "PHASE19_REFERRAL_CLICKED" as OutcomeEventType, {
    entityId: referralCode.id,
    metadata: referredEmail ? { referredEmail } : undefined,
  }).catch(() => {});

  return { referrerId: referralCode.user.id, referrerFirstName };
}

/**
 * Attribute a new signup to a referral (called after User is created).
 * Reads Redis referral:{sessionId} and links the new user to the Referral.
 */
export async function attributeReferral(newUserId: string, sessionId: string): Promise<void> {
  const codeId = await redis.get(`${REFERRAL_REDIS_PREFIX}${sessionId}`);
  if (!codeId) return;

  const referralCode = await prisma.referralCode.findUnique({
    where: { id: codeId },
    select: { id: true, userId: true },
  });
  if (!referralCode) return;

  const referral = await prisma.referral.findFirst({
    where: { codeId, referredId: null, status: "CLICKED" },
    orderBy: { clickedAt: "desc" },
    select: { id: true },
  });
  if (!referral) return;

  const now = new Date();
  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referral.id },
      data: { referredId: newUserId, status: "SIGNED_UP", signedUpAt: now },
    }),
    prisma.referralCode.update({
      where: { id: codeId },
      data: { signups: { increment: 1 } },
    }),
  ]);

  await redis.del(`${REFERRAL_REDIS_PREFIX}${sessionId}`);

  trackOutcome(referralCode.userId, "PHASE19_REFERRAL_SIGNED_UP" as OutcomeEventType, {
    entityId: newUserId,
    metadata: { referrerId: referralCode.userId },
  }).catch(() => {});
}

/**
 * Mark referral as converted (referred user completed onboarding), grant referrer reward.
 * Reward = 30 days free premium (referralPremiumUntil on User). Sends referral-converted email.
 */
export async function convertReferral(userId: string): Promise<void> {
  const referral = await prisma.referral.findFirst({
    where: { referredId: userId, status: "SIGNED_UP" },
    include: {
      referrer: { select: { id: true, name: true, email: true } },
      referralCode: { select: { id: true } },
    },
  });
  if (!referral) return;

  const now = new Date();
  const rewardEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const referrerUser = await prisma.user.findUnique({
    where: { id: referral.referrerId },
    select: { referralPremiumUntil: true },
  });
  const bestEnd =
    referrerUser?.referralPremiumUntil && referrerUser.referralPremiumUntil > rewardEnd
      ? referrerUser.referralPremiumUntil
      : rewardEnd;

  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: "CONVERTED",
        convertedAt: now,
        rewardGranted: true,
        rewardGrantedAt: now,
      },
    }),
    prisma.referralCode.update({
      where: { id: referral.referralCode.id },
      data: { conversions: { increment: 1 } },
    }),
    prisma.user.update({
      where: { id: referral.referrerId },
      data: { referralPremiumUntil: bestEnd },
    }),
  ]);

  trackOutcome(referral.referrerId, "PHASE19_REFERRAL_CONVERTED" as OutcomeEventType, {
    entityId: userId,
    metadata: { referredId: userId },
  }).catch(() => {});

  try {
    const { sendReferralConvertedEmail } = await import("@/lib/email/growth");
    await sendReferralConvertedEmail({
      to: referral.referrer.email,
      referrerName: referral.referrer.name ?? "There",
      referredName: "Your friend",
    });
  } catch (e) {
    console.error("[Referral] sendReferralConvertedEmail failed:", e);
  }
}
