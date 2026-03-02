/**
 * POST /api/webhooks/razorpay/seo-boost
 * payment.captured → verify order notes (type=seo_boost), call purchaseSeoBoost.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { PaymentGateway } from "@prisma/client";
import { razorpayAdapter } from "@/lib/payments";
import { purchaseSeoBoost } from "@/lib/mentorship/seo-boost";
import type { SeoBoostType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const secret =
    process.env.RAZORPAY_MENTOR_WEBHOOK_SECRET ?? process.env.RAZORPAY_WEBHOOK_SECRET;
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

  const existing = await prisma.paymentEvent.findUnique({
    where: { gatewayEventId: payment.id },
  });
  if (existing) return NextResponse.json({ received: true });

  const orderDetails = await razorpayAdapter.fetchOrder(orderId);
  const notes = (orderDetails?.notes ?? {}) as Record<string, string>;
  if (notes.type !== "seo_boost" || !notes.userId || !notes.boostType) {
    return NextResponse.json({ received: true });
  }

  const userId = notes.userId;
  const boostType = notes.boostType as SeoBoostType;
  const pricePaise = parseInt(notes.pricePaise ?? "0", 10) || 0;
  if (pricePaise > 0 && payment.amount !== pricePaise) {
    console.error("[webhooks/razorpay/seo-boost] Amount mismatch:", payment.amount, pricePaise);
    return NextResponse.json({ received: true });
  }

  const result = await purchaseSeoBoost(userId, boostType, payment.id);
  if (!result.ok) {
    console.error("[webhooks/razorpay/seo-boost] purchaseSeoBoost failed:", result.error);
    return NextResponse.json({ success: false, error: "Processing failed" }, { status: 500 });
  }

  await prisma.paymentEvent.create({
    data: {
      userId,
      gateway: PaymentGateway.RAZORPAY,
      gatewayEventId: payment.id,
      gatewayOrderId: orderId,
      amount: payment.amount,
      currency: "INR",
      status: "COMPLETED",
      description: `SEO Boost — ${boostType}`,
      metadata: { type: "seo_boost", boostType },
    },
  });

  return NextResponse.json({ received: true });
}
