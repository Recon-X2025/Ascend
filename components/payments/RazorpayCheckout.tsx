"use client";

import { useCallback, useEffect, useRef } from "react";

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  keyId: string;
  onSuccess: (paymentId: string, signature: string) => void;
  onFailure?: (err: unknown) => void;
  /** When true, opens checkout on mount (e.g. after waiver confirmation) */
  autoOpen?: boolean;
}

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      order_id: string;
      name?: string;
      description?: string;
      handler: (res: { razorpay_payment_id: string; razorpay_signature: string }) => void;
    }) => { open: () => void };
  }
}

export function RazorpayCheckout({
  orderId,
  amount,
  currency,
  name,
  description,
  keyId,
  onSuccess,
  onFailure,
  autoOpen,
}: RazorpayCheckoutProps) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || typeof window === "undefined") return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    scriptLoaded.current = true;
  }, []);

  const openCheckout = useCallback(() => {
    if (!window.Razorpay) {
      onFailure?.(new Error("Razorpay script not loaded"));
      return;
    }
    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: orderId,
      name: name ?? "Ascend",
      description: description ?? "",
      handler: (res) => onSuccess(res.razorpay_payment_id, res.razorpay_signature),
    });
    rzp.open();
  }, [keyId, amount, currency, orderId, name, description, onSuccess, onFailure]);

  useEffect(() => {
    if (autoOpen) openCheckout();
  }, [autoOpen, openCheckout]);

  return (
    <button type="button" onClick={openCheckout} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
      Pay with Razorpay
    </button>
  );
}
