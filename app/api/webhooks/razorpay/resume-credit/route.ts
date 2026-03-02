/**
 * POST /api/webhooks/razorpay/resume-credit
 * Idempotent: payment.captured → addResumeOptimisationCredits.
 * Configure Razorpay to send resume_credit orders to this webhook (filter by notes.type=resume_credit).
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { addResumeOptimisationCredits } from "@/lib/payments/credits";
import { razorpayAdapter } from "@/lib/payments";
import { PaymentGateway } from "@prisma/client";
import { RESUME_OPTIMISATION_CREDIT_PRICE_PAISE } from "@/lib/payments/pricing";

export async function POST(req: NextRequest) {
  const secret =
    process.env.RAZORPAY_RESUME_CREDIT_WEBHOOK_SECRET ?? process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, error: "Not configured" }, { status: 500 });
  }

  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const body = await req.text();
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (expected !== sig) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  const data = JSON.parse(body) as {
    event: string;
    payload?: {
      payment?: {
        entity?: {
          id: string;
          order_id?: string;
          amount: number;
          status: string;
        };
      };
    };
  };

  if (data.event !== "payment.captured" || !data.payload?.payment?.entity) {
    return NextResponse.json({ received: true });
  }

  const payment = data.payload.payment.entity;
  if (payment.status !== "captured") return NextResponse.json({ received: true });

  const orderId = payment.order_id;
  if (!orderId) return NextResponse.json({ received: true });

  // Idempotent: skip if already processed
  const existing = await prisma.paymentEvent.findUnique({
    where: { gatewayEventId: payment.id },
  });
  if (existing) return NextResponse.json({ received: true });

  const orderDetails = await razorpayAdapter.fetchOrder(orderId);
  const notes = orderDetails?.notes ?? {};
  if (notes.type !== "resume_credit" || !notes.userId) {
    return NextResponse.json({ received: true });
  }

  const userId = notes.userId;
  if (payment.amount !== RESUME_OPTIMISATION_CREDIT_PRICE_PAISE) {
    console.error("[webhooks/razorpay/resume-credit] Amount mismatch:", payment.amount);
    return NextResponse.json({ received: true });
  }

  try {
    await prisma.paymentEvent.create({
      data: {
        userId,
        gateway: PaymentGateway.RAZORPAY,
        gatewayEventId: payment.id,
        gatewayOrderId: orderId,
        amount: RESUME_OPTIMISATION_CREDIT_PRICE_PAISE,
        currency: "INR",
        status: "COMPLETED",
        description: "Resume optimisation — 1 credit",
        metadata: { type: "resume_credit" },
      },
    });
    await addResumeOptimisationCredits(userId, 1, payment.id);
  } catch (e) {
    console.error("[webhooks/razorpay/resume-credit] Failed:", e);
    return NextResponse.json({ success: false, error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
