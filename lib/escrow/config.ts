/**
 * M-6: Escrow configuration — default fees and constants.
 */

import type { EngagementType } from "@prisma/client";

export const DEFAULT_ESCROW_FEE_PAISE: Record<EngagementType, number> = {
  SPRINT: 80_000,   // ₹800
  STANDARD: 120_000, // ₹1,200
  DEEP: 150_000,    // ₹1,500
};

export const AUTO_RELEASE_DAYS = 7;
