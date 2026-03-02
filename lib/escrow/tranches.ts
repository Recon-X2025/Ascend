/**
 * M-6: Tranche configuration by engagement type.
 * SPRINT: 2 tranches 50/50 (milestones: Goal Setting, FINAL)
 * STANDARD/DEEP: 3 tranches 33/33/34 (milestones: Goal Setting, MID..., FINAL)
 *
 * Fee rates by mentor tier and payment mode. Platform fee is deducted from mentor payout only.
 */

import type { EngagementType, PaymentMode } from "@prisma/client";

export const ESCROW_FEE_RATES: Record<
  string,
  { ESCROW: number; FULL_UPFRONT: number }
> = {
  RISING: { ESCROW: 0.2, FULL_UPFRONT: 0.25 },
  ESTABLISHED: { ESCROW: 0.15, FULL_UPFRONT: 0.2 },
  ELITE: { ESCROW: 0.1, FULL_UPFRONT: 0.15 },
};

export function getFeeRate(tier: string, paymentMode: PaymentMode): number {
  return ESCROW_FEE_RATES[tier]?.[paymentMode] ?? 0.2;
}

export interface TrancheConfig {
  percentPct: number;
  milestoneNumber: number; // 1-based — links to EngagementMilestone.milestoneNumber
}

export const TRANCHE_CONFIG: Record<
  EngagementType,
  { tranches: TrancheConfig[] }
> = {
  SPRINT: {
    tranches: [
      { percentPct: 50, milestoneNumber: 1 }, // Goal Setting complete
      { percentPct: 50, milestoneNumber: 2 },  // FINAL complete
    ],
  },
  STANDARD: {
    tranches: [
      { percentPct: 33, milestoneNumber: 1 }, // Goal Setting
      { percentPct: 33, milestoneNumber: 2 }, // MID
      { percentPct: 34, milestoneNumber: 3 }, // FINAL
    ],
  },
  DEEP: {
    tranches: [
      { percentPct: 33, milestoneNumber: 1 }, // Goal Setting
      { percentPct: 33, milestoneNumber: 2 }, // first MID
      { percentPct: 34, milestoneNumber: 4 }, // FINAL (DEEP has GOAL, MID, MID, FINAL = m1,m2,m3,m4)
    ],
  },
};

export interface TrancheResult {
  trancheNumber: number;
  amountPaise: number;
  percentPct: number;
  milestoneNumber: number;
}

/**
 * Calculate tranche amounts from total fee. Returns array of tranche configs with amounts.
 */
export function calculateTranches(
  totalPaise: number,
  engagementType: EngagementType
): TrancheResult[] {
  const config = TRANCHE_CONFIG[engagementType];
  if (!config) throw new Error(`Unknown engagement type: ${engagementType}`);

  const results: TrancheResult[] = [];
  let remaining = totalPaise;
  const len = config.tranches.length;

  for (let i = 0; i < len; i++) {
    const tc = config.tranches[i]!;
    const isLast = i === len - 1;
    // Last tranche gets remainder to avoid rounding errors
    const amountPaise = isLast
      ? remaining
      : Math.round((totalPaise * tc.percentPct) / 100);
    remaining -= amountPaise;

    results.push({
      trancheNumber: i + 1,
      amountPaise,
      percentPct: tc.percentPct,
      milestoneNumber: tc.milestoneNumber,
    });
  }

  return results;
}
