import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { confirmPayment } from "@/lib/escrow";
import { verifyPayment } from "@/lib/payments/razorpay";
import { z } from "zod";

const bodySchema = z.object({
  contractId: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  razorpay_order_id: z.string().min(1),
});

/**
 * POST /api/mentorship/escrow/verify
 * Client calls after Razorpay success. HMAC verify then confirmPayment.
 * Idempotent if already confirmed (webhook may have run first).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid body", details: e }, { status: 400 });
  }

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: body.contractId },
    select: { id: true, menteeUserId: true },
  });
  if (!contract || contract.menteeUserId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const valid = verifyPayment({
    gateway: "razorpay",
    orderId: body.razorpay_order_id,
    paymentId: body.razorpay_payment_id,
    signature: body.razorpay_signature,
  });
  if (!valid) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  try {
    await confirmPayment(body.contractId, body.razorpay_payment_id);
  } catch (e) {
    console.error("[escrow/verify] confirmPayment failed:", e);
  }

  return NextResponse.json({ success: true });
}
