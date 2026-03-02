/**
 * M-14: Platform Fee & Revenue Layer — daily revenue snapshots and summaries.
 */

import { prisma } from "@/lib/prisma/client";

/** Start of day UTC for a given date. */
function startOfDayUTC(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

/** End of day UTC (exclusive). */
function endOfDayUTC(d: Date): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + 1);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

export interface RevenueSummary {
  totalReleasedPaise: number;
  platformFeePaise: number;
  mentorPayoutPaise: number;
  pilotWaivedPaise: number;
  tranchesReleased: number;
  byTier: Record<string, { released: number; platformFee: number; mentorPayout: number }>;
  byPaymentMode: Record<string, { released: number; platformFee: number; mentorPayout: number }>;
}

/** Idempotent upsert of daily revenue snapshot. Aggregates TrancheFeeRecord + PaymentMovement for date. */
export async function computeDailyRevenueSnapshot(date: Date): Promise<void> {
  const dayStart = startOfDayUTC(date);
  const dayEnd = endOfDayUTC(date);

  const trancheRecords = await prisma.trancheFeeRecord.findMany({
    where: {
      releasedAt: { gte: dayStart, lt: dayEnd },
    },
    select: {
      platformFeePaise: true,
      mentorNetPaise: true,
      pilotFeeWaived: true,
      feeRateApplied: true,
      mentorTierAtRelease: true,
      paymentMode: true,
    },
  });

  let totalReleasedPaise = 0;
  let platformFeePaise = 0;
  let mentorPayoutPaise = 0;
  let pilotWaivedPaise = 0;
  const byTier: Record<string, { released: number; platformFee: number; mentorPayout: number }> = {};
  const byPaymentMode: Record<string, { released: number; platformFee: number; mentorPayout: number }> = {};

  for (const r of trancheRecords) {
    const gross = r.platformFeePaise + r.mentorNetPaise;
    totalReleasedPaise += gross;
    platformFeePaise += r.platformFeePaise;
    mentorPayoutPaise += r.mentorNetPaise;
    if (r.pilotFeeWaived && r.platformFeePaise === 0) {
      pilotWaivedPaise += Math.round(gross * r.feeRateApplied);
    }

    const tier = r.mentorTierAtRelease;
    if (!byTier[tier]) byTier[tier] = { released: 0, platformFee: 0, mentorPayout: 0 };
    byTier[tier].released += gross;
    byTier[tier].platformFee += r.platformFeePaise;
    byTier[tier].mentorPayout += r.mentorNetPaise;

    const mode = r.paymentMode;
    if (!byPaymentMode[mode]) byPaymentMode[mode] = { released: 0, platformFee: 0, mentorPayout: 0 };
    byPaymentMode[mode].released += gross;
    byPaymentMode[mode].platformFee += r.platformFeePaise;
    byPaymentMode[mode].mentorPayout += r.mentorNetPaise;
  }

  const fullUpfrontEscrows = await prisma.mentorshipEscrow.findMany({
    where: {
      paymentMode: "FULL_UPFRONT",
      fundedAt: { gte: dayStart, lt: dayEnd },
      status: "COMPLETED",
    },
    select: {
      id: true,
      totalAmountPaise: true,
      platformFeePaise: true,
      mentorPayoutPaise: true,
    },
  });

  for (const e of fullUpfrontEscrows) {
    const gross = e.totalAmountPaise;
    const platform = e.platformFeePaise ?? 0;
    const mentor = e.mentorPayoutPaise ?? gross - platform;

    totalReleasedPaise += gross;
    platformFeePaise += platform;
    mentorPayoutPaise += mentor;
  }

  await prisma.mentorshipRevenueSnapshot.upsert({
    where: { date: dayStart },
    create: {
      date: dayStart,
      totalReleasedPaise,
      platformFeePaise,
      mentorPayoutPaise,
      pilotWaivedPaise,
      tranchesReleased: trancheRecords.length,
      byTier: byTier as object,
      byPaymentMode: byPaymentMode as object,
    },
    update: {
      totalReleasedPaise,
      platformFeePaise,
      mentorPayoutPaise,
      pilotWaivedPaise,
      tranchesReleased: trancheRecords.length,
      byTier: byTier as object,
      byPaymentMode: byPaymentMode as object,
    },
  });
}

/** Get revenue summary for date range. */
export async function getRevenueSummary(
  from: Date,
  to: Date
): Promise<RevenueSummary> {
  const snapshots = await prisma.mentorshipRevenueSnapshot.findMany({
    where: {
      date: { gte: startOfDayUTC(from), lte: startOfDayUTC(to) },
    },
    orderBy: { date: "asc" },
  });

  let totalReleasedPaise = 0;
  let platformFeePaise = 0;
  let mentorPayoutPaise = 0;
  let pilotWaivedPaise = 0;
  let tranchesReleased = 0;
  const byTier: Record<string, { released: number; platformFee: number; mentorPayout: number }> = {};
  const byPaymentMode: Record<string, { released: number; platformFee: number; mentorPayout: number }> = {};

  for (const s of snapshots) {
    totalReleasedPaise += s.totalReleasedPaise;
    platformFeePaise += s.platformFeePaise;
    mentorPayoutPaise += s.mentorPayoutPaise;
    pilotWaivedPaise += s.pilotWaivedPaise;
    tranchesReleased += s.tranchesReleased;

    const tierData = s.byTier as Record<string, { released: number; platformFee: number; mentorPayout: number }> | null;
    if (tierData) {
      for (const [k, v] of Object.entries(tierData)) {
        if (!byTier[k]) byTier[k] = { released: 0, platformFee: 0, mentorPayout: 0 };
        byTier[k].released += v?.released ?? 0;
        byTier[k].platformFee += v?.platformFee ?? 0;
        byTier[k].mentorPayout += v?.mentorPayout ?? 0;
      }
    }

    const modeData = s.byPaymentMode as Record<string, { released: number; platformFee: number; mentorPayout: number }> | null;
    if (modeData) {
      for (const [k, v] of Object.entries(modeData)) {
        if (!byPaymentMode[k]) byPaymentMode[k] = { released: 0, platformFee: 0, mentorPayout: 0 };
        byPaymentMode[k].released += v?.released ?? 0;
        byPaymentMode[k].platformFee += v?.platformFee ?? 0;
        byPaymentMode[k].mentorPayout += v?.mentorPayout ?? 0;
      }
    }
  }

  return {
    totalReleasedPaise,
    platformFeePaise,
    mentorPayoutPaise,
    pilotWaivedPaise,
    tranchesReleased,
    byTier,
    byPaymentMode,
  };
}

export interface MentorPayoutSummary {
  totalEarnedPaise: number;
  pendingEarnedPaise: number;
  inEscrowPaise: number;
}

/** Get mentor payout summary (released, pending, in escrow). */
export async function getMentorPayoutSummary(mentorId: string): Promise<MentorPayoutSummary> {
  const released = await prisma.escrowTranche.findMany({
    where: {
      escrow: { mentorId },
      status: "RELEASED",
    },
    select: { mentorNetPaise: true, amountPaise: true },
  });
  const totalEarnedPaise = released.reduce(
    (s, t) => s + (t.mentorNetPaise > 0 ? t.mentorNetPaise : t.amountPaise),
    0
  );

  const held = await prisma.escrowTranche.findMany({
    where: {
      escrow: { mentorId },
      status: { in: ["HELD", "PENDING_RELEASE"] },
    },
    select: { amountPaise: true },
  });
  const inEscrowPaise = held.reduce((s, t) => s + t.amountPaise, 0);

  const pendingEscrows = await prisma.mentorshipEscrow.findMany({
    where: {
      mentorId,
      status: "FUNDED",
      tranches: { some: { status: "PENDING_RELEASE" } },
    },
    include: {
      tranches: { where: { status: "PENDING_RELEASE" }, select: { amountPaise: true } },
    },
  });
  let pendingEarnedPaise = 0;
  const { getLiveFeeRate, calculateFeeAmounts } = await import("./fees");
  for (const escrow of pendingEscrows) {
    for (const t of escrow.tranches) {
      const { rate } = await getLiveFeeRate(mentorId, escrow.paymentMode);
      const { mentorNetPaise } = calculateFeeAmounts(
        t.amountPaise,
        rate,
        escrow.pilotFeeWaived ?? false
      );
      pendingEarnedPaise += mentorNetPaise;
    }
  }

  return {
    totalEarnedPaise,
    pendingEarnedPaise,
    inEscrowPaise,
  };
}

/** Get platform fee summary for date range. */
export async function getPlatformFeeSummary(
  from: Date,
  to: Date
): Promise<{ platformFeePaise: number; pilotWaivedPaise: number }> {
  const summary = await getRevenueSummary(from, to);
  return {
    platformFeePaise: summary.platformFeePaise,
    pilotWaivedPaise: summary.pilotWaivedPaise,
  };
}
