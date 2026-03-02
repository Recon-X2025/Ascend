/**
 * POST /api/webhooks/razorpay/mentor-subscription
 * payment.captured → update UserSubscription to MENTOR_MARKETPLACE, set expiresAt.
 * TODO: createInvoice
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { razorpayAdapter } from "@/lib/payments";
import { PaymentGateway } from "@prisma/client";
import { MENTOR_MARKETPLACE_PLAN } from "@/lib/payments/plans";

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
  const notes = orderDetails?.notes ?? {};
  if (notes.type !== "mentor_subscription" || !notes.userId) {
    return NextResponse.json({ received: true });
  }

  const userId = notes.userId;
  const billingPeriod = notes.billingPeriod ?? "monthly";
  const amountPaid =
    billingPeriod === "annual"
      ? MENTOR_MARKETPLACE_PLAN.annualPricePaise
      : MENTOR_MARKETPLACE_PLAN.monthlyPricePaise;
  if (payment.amount !== amountPaid) {
    console.error("[webhooks/razorpay/mentor-subscription] Amount mismatch:", payment.amount);
    return NextResponse.json({ received: true });
  }

  const now = new Date();
  const expiresAt = new Date(now);
  if (billingPeriod === "annual") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  try {
    await prisma.$transaction([
      prisma.paymentEvent.create({
        data: {
          userId,
          gateway: PaymentGateway.RAZORPAY,
          gatewayEventId: payment.id,
          gatewayOrderId: orderId,
          amount: amountPaid,
          currency: "INR",
          status: "COMPLETED",
          description: `Mentor marketplace — ${billingPeriod}`,
          metadata: { type: "mentor_subscription", billingPeriod },
        },
      }),
      prisma.userSubscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: "MENTOR_MARKETPLACE",
          planKey: "MENTOR_MARKETPLACE",
          status: "ACTIVE",
          gateway: PaymentGateway.RAZORPAY,
          billingPeriod: billingPeriod === "annual" ? "ANNUAL" : "MONTHLY",
          pricePaidPaise: amountPaid,
          startsAt: now,
          expiresAt,
          currentPeriodStart: now,
          currentPeriodEnd: expiresAt,
        },
        update: {
          plan: "MENTOR_MARKETPLACE",
          planKey: "MENTOR_MARKETPLACE",
          status: "ACTIVE",
          gateway: PaymentGateway.RAZORPAY,
          billingPeriod: billingPeriod === "annual" ? "ANNUAL" : "MONTHLY",
          pricePaidPaise: amountPaid,
          startsAt: now,
          expiresAt,
          currentPeriodStart: now,
          currentPeriodEnd: expiresAt,
        },
      }),
    ]);

    // M-13: If mentor is unlocked, set canChargeMentees = true
    const profile = await prisma.mentorProfile.findUnique({
      where: { userId },
      include: { monetisationStatus: true },
    });
    if (profile?.monetisationStatus?.isUnlocked) {
      await prisma.mentorProfile.update({
        where: { id: profile.id },
        data: { canChargeMentees: true },
      });
    }
    // TODO: createInvoice for mentor subscription
  } catch (e) {
    console.error("[webhooks/razorpay/mentor-subscription] Failed:", e);
    return NextResponse.json({ success: false, error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
