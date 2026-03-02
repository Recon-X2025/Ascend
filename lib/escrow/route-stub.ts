/**
 * M-6: Route stubs for payment gateway operations.
 * holdFunds: create Razorpay order (handled in createEscrowOrder via lib/payments)
 * transferToMentor, refundToMentee: mock for now — log and return mock IDs.
 */

const STUB_PREFIX = "stub_";

export async function holdFunds(_params: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ orderId: string }> {
  // Actual hold is via Razorpay order creation — called from createEscrowOrder
  const orderId = `${STUB_PREFIX}order_${Date.now()}`;
  console.log("[escrow/route-stub] holdFunds (mock):", { orderId, ..._params });
  return { orderId };
}

export async function transferToMentor(_params: {
  amountPaise: number;
  mentorId: string;
  contractId: string;
  trancheId: string | null;
  reason: string;
}): Promise<{ transferId: string }> {
  const transferId = `${STUB_PREFIX}transfer_${Date.now()}`;
  console.log("[escrow/route-stub] transferToMentor (mock):", {
    transferId,
    ..._params,
  });
  return { transferId };
}

export async function refundToMentee(_params: {
  amountPaise: number;
  menteeId: string;
  contractId: string;
  trancheId?: string;
  reason: string;
}): Promise<{ refundId: string }> {
  const refundId = `${STUB_PREFIX}refund_${Date.now()}`;
  console.log("[escrow/route-stub] refundToMentee (mock):", {
    refundId,
    ..._params,
  });
  return { refundId };
}
