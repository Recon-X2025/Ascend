import { NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/payments/stripe";
import { prisma } from "@/lib/prisma/client";
import { PaymentGateway, PaymentStatus } from "@prisma/client";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: { type: string; data: { object: { id: string; amount_paid?: number; payment_intent?: string; status?: string }; }; };
  try {
    const stripe = getStripeInstance();
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "invoice.payment_succeeded" && event.data?.object) {
    const inv = event.data.object as { id: string; subscription?: string; amount_paid?: number };
    const payId = inv.id;
    const existing = await prisma.paymentEvent.findUnique({
      where: { gatewayEventId: payId },
    });
    if (existing) return NextResponse.json({ received: true });

    await prisma.paymentEvent.create({
      data: {
        gateway: PaymentGateway.STRIPE,
        gatewayEventId: payId,
        amount: inv.amount_paid ?? 0,
        currency: "USD",
        status: PaymentStatus.COMPLETED,
        description: "Stripe subscription payment",
      },
    });
  }

  if (event.type === "customer.subscription.deleted" && event.data?.object) {
    const sub = event.data.object as { id: string };
    await prisma.userSubscription.updateMany({
      where: { gatewaySubId: sub.id },
      data: { status: "CANCELLED" },
    });
    await prisma.companySubscription.updateMany({
      where: { gatewaySubId: sub.id },
      data: { status: "CANCELLED" },
    });
  }

  return NextResponse.json({ received: true });
}
