"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MentorSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayOrder, setRazorpayOrder] = useState<{
    orderId: string;
    amount: number;
    currency: string;
    key?: string;
    billingPeriod: string;
  } | null>(null);

  const handlePurchase = async (billingPeriod: "monthly" | "annual") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mentor_subscription", billingPeriod, currency: "INR" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      setRazorpayOrder({ ...data, billingPeriod });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (paymentId: string, signature: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          razorpay_order_id: razorpayOrder?.orderId,
          type: "mentor_subscription",
          metadata: { billingPeriod: razorpayOrder?.billingPeriod ?? "monthly" },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      router.push(data.redirectTo ?? "/dashboard/mentor");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Mentor marketplace subscription</h1>
      <p className="text-muted-foreground">Subscribe to list in the marketplace and receive paid engagements.</p>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-semibold">₹1,199<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            {!razorpayOrder ? (
              <Button onClick={() => handlePurchase("monthly")} disabled={loading}>
                {loading ? "Creating…" : "Subscribe — ₹1,199"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Annual</CardTitle>
            <span className="text-xs text-green-600">17% off</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-semibold">₹11,942<span className="text-sm font-normal text-muted-foreground">/year</span></p>
            {!razorpayOrder ? (
              <Button onClick={() => handlePurchase("annual")} disabled={loading}>
                {loading ? "Creating…" : "Subscribe — ₹11,942"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
      {razorpayOrder && razorpayOrder.key && (
        <RazorpayCheckout
          orderId={razorpayOrder.orderId}
          amount={razorpayOrder.amount}
          currency={razorpayOrder.currency}
          keyId={razorpayOrder.key}
          description={`Mentor marketplace — ${razorpayOrder.billingPeriod}`}
          onSuccess={handleSuccess}
          onFailure={(err) => setError(err instanceof Error ? err.message : "Payment failed")}
          autoOpen
        />
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Link href="/dashboard/mentor" className="text-sm text-muted-foreground hover:underline">
        ← Back to Mentor Dashboard
      </Link>
    </div>
  );
}
