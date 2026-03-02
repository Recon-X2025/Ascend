/**
 * Phase 22: Platform fee computation for marketplace transactions.
 * Fees are computed at order creation and stored on the order — never recalculated after payment.
 */

export const PLATFORM_FEE_PERCENT = 20;

export function computeFees(totalPricePaise: number): {
  platformFee: number;
  providerPayout: number;
} {
  const platformFee = Math.round((totalPricePaise * PLATFORM_FEE_PERCENT) / 100);
  const providerPayout = totalPricePaise - platformFee;
  return { platformFee, providerPayout };
}
