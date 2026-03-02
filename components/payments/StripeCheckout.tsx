"use client";

import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface StripeCheckoutProps {
  onSuccess: () => void;
  onFailure?: (err: unknown) => void;
}

export function StripeCheckout({ onSuccess, onFailure }: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
      });
      if (error) {
        onFailure?.(error);
      } else {
        onSuccess();
      }
    } catch (err) {
      onFailure?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button type="submit" disabled={!stripe || loading} className="mt-4">
        {loading ? "Processing…" : "Pay"}
      </Button>
    </form>
  );
}
