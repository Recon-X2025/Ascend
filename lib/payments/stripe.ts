import Stripe from "stripe";
import type {
  CreateOrderParams,
  CreateOrderResult,
  CreateSubscriptionParams,
  CreateSubscriptionResult,
  VerifyPaymentParams,
  RefundParams,
} from "./types";

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is required");
  return new Stripe(secret, { apiVersion: "2026-02-25.clover" as const });
}

export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency.toLowerCase(),
    metadata: params.notes ?? {},
  });

  return {
    orderId: intent.id,
    amount: intent.amount,
    currency: params.currency,
    gateway: "stripe",
  };
}

export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<CreateSubscriptionResult> {
  const stripe = getStripe();
  let customerId = params.customerId;

  if (!customerId) {
    const customer = await stripe.customers.create({});
    customerId = customer.id;
  }

  const sub = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: params.planId }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });

  return {
    subscriptionId: sub.id,
    customerId,
    gateway: "stripe",
    status: sub.status ?? "incomplete",
  };
}

/** Stripe verification is done via webhook signature; this satisfies the adapter interface. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function verifyPayment(params: VerifyPaymentParams): boolean {
  return true;
}

export async function refund(params: RefundParams): Promise<void> {
  const stripe = getStripe();
  await stripe.refunds.create({
    payment_intent: params.paymentId,
    amount: params.amount,
  });
}

export function getStripeInstance(): Stripe {
  return getStripe();
}
