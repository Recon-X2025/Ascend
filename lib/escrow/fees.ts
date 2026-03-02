/**
 * M-14: Platform Fee & Revenue Layer — fee rates and calculations.
 * Fee rate at release = live tier, never escrow.feeRate.
 */

import { prisma } from "@/lib/prisma/client";
import { getFeeRate } from "./tranches";
import type { PaymentMode } from "@prisma/client";

export interface LiveFeeRateResult {
  tier: string;
  rate: number;
}

/** Fetches mentor's current tier and returns live fee rate for payment mode. */
export async function getLiveFeeRate(
  mentorId: string,
  paymentMode: PaymentMode
): Promise<LiveFeeRateResult> {
  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
    select: { tier: true },
  });
  const tier = profile?.tier ?? "RISING";
  const rate = getFeeRate(tier, paymentMode);
  return { tier, rate };
}

export interface FeeAmounts {
  platformFeePaise: number;
  mentorNetPaise: number;
  pilotWaivedPaise: number;
}

/** Calculate platform fee and mentor net from gross amount. */
export function calculateFeeAmounts(
  grossAmountPaise: number,
  feeRate: number,
  pilotFeeWaived: boolean
): FeeAmounts {
  if (pilotFeeWaived) {
    return {
      platformFeePaise: 0,
      mentorNetPaise: grossAmountPaise,
      pilotWaivedPaise: Math.round(grossAmountPaise * feeRate),
    };
  }
  const platformFeePaise = Math.round(grossAmountPaise * feeRate);
  const mentorNetPaise = grossAmountPaise - platformFeePaise;
  return {
    platformFeePaise,
    mentorNetPaise,
    pilotWaivedPaise: 0,
  };
}

/** Returns true if mentor tier changed between signing and release. */
export function hasTierChanged(
  tierAtSigning: string | null,
  currentTier: string
): boolean {
  if (!tierAtSigning) return false;
  return tierAtSigning !== currentTier;
}

/** Format fee rate as display string e.g. "15%". */
export function formatFeeRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
