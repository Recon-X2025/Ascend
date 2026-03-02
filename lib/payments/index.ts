import * as razorpayAdapter from "./razorpay";
import * as stripeAdapter from "./stripe";
import type {
  Currency,
  Gateway,
  CreateOrderParams,
  CreateOrderResult,
  CreateSubscriptionParams,
  CreateSubscriptionResult,
  RefundParams,
} from "./types";

export function selectGateway(currency: Currency): Gateway {
  return currency === "INR" ? "razorpay" : "stripe";
}

export async function createOrder(
  params: CreateOrderParams & { currency: Currency }
): Promise<CreateOrderResult> {
  const gateway = selectGateway(params.currency);
  return gateway === "razorpay"
    ? razorpayAdapter.createOrder(params)
    : stripeAdapter.createOrder(params);
}

export async function createSubscription(
  params: CreateSubscriptionParams & { currency: Currency }
): Promise<CreateSubscriptionResult> {
  const gateway = selectGateway(params.currency);
  return gateway === "razorpay"
    ? razorpayAdapter.createSubscription(params)
    : stripeAdapter.createSubscription(params);
}

export async function refund(params: RefundParams): Promise<void> {
  return params.gateway === "razorpay"
    ? razorpayAdapter.refund(params)
    : stripeAdapter.refund(params);
}

export { razorpayAdapter, stripeAdapter };
export * from "./types";
