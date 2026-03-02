export type Currency = "INR" | "USD";
export type Gateway = "razorpay" | "stripe";

export interface CreateOrderParams {
  amount: number;
  currency: Currency;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: Currency;
  gateway: Gateway;
}

export interface CreateSubscriptionParams {
  planId: string;
  customerId?: string;
  totalCount?: number;
  currency: Currency;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  customerId: string;
  gateway: Gateway;
  status: string;
}

export interface VerifyPaymentParams {
  gateway: Gateway;
  orderId?: string;
  paymentId: string;
  signature?: string;
}

export interface RefundParams {
  gateway: Gateway;
  paymentId: string;
  amount?: number;
}
