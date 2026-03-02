import Razorpay from "razorpay";
import crypto from "crypto";
import type {
  CreateOrderParams,
  CreateOrderResult,
  CreateSubscriptionParams,
  CreateSubscriptionResult,
  VerifyPaymentParams,
  RefundParams,
} from "./types";

function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret)
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function fetchOrder(orderId: string): Promise<{ notes?: Record<string, string> } | null> {
  try {
    const rzp = getRazorpay();
    const order = await rzp.orders.fetch(orderId);
    return { notes: order.notes as Record<string, string> | undefined };
  } catch {
    return null;
  }
}

export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const rzp = getRazorpay();
  const order = await rzp.orders.create({
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes,
  });
  return {
    orderId: order.id,
    amount: order.amount as number,
    currency: (order.currency ?? "INR") as "INR" | "USD",
    gateway: "razorpay",
  };
}

export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<CreateSubscriptionResult> {
  const rzp = getRazorpay();
  const sub = await rzp.subscriptions.create({
    plan_id: params.planId,
    customer_notify: 1,
    total_count: params.totalCount ?? 12,
  });
  return {
    subscriptionId: sub.id,
    customerId: sub.customer_id ?? "",
    gateway: "razorpay",
    status: sub.status ?? "created",
  };
}

export function verifyPayment(params: VerifyPaymentParams): boolean {
  if (!params.orderId || !params.signature) return false;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === params.signature;
}

export async function refund(params: RefundParams): Promise<void> {
  const rzp = getRazorpay();
  await rzp.payments.refund(params.paymentId, { amount: params.amount });
}
