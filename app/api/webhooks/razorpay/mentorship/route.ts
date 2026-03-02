import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { confirmPayment } from "@/lib/escrow";

/**
 * POST /api/webhooks/razorpay/mentorship
 * HMAC verify, payment.captured → confirmPayment.
 * Uses MENTORSHIP_RAZORPAY_WEBHOOK_SECRET or RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const secret =
    process.env.MENTORSHIP_RAZORPAY_WEBHOOK_SECRET ??
    process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const body = await req.text();
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (expected !== sig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
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
  const orderId = payment.order_id;
  if (!orderId) return NextResponse.json({ received: true });

  const { prisma } = await import("@/lib/prisma/client");
  const escrow = await prisma.mentorshipEscrow.findFirst({
    where: { razorpayOrderId: orderId },
    select: { contractId: true },
  });
  if (!escrow) {
    return NextResponse.json({ received: true });
  }

  try {
    await confirmPayment(escrow.contractId, payment.id);
  } catch (e) {
    console.error("[webhooks/razorpay/mentorship] confirmPayment failed:", e);
    return NextResponse.json({ error: "Confirm failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
