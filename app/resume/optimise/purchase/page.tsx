"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResumeOptimisePurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "resume_credit", currency: "INR" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = async () => {
    const data = await handlePurchase();
    if (!data?.orderId) return;
    // RazorpayCheckout will be used with orderId - we need to render it when we have orderId
    setRazorpayOrder(data);
  };

  const [razorpayOrder, setRazorpayOrder] = useState<{
    orderId: string;
    amount: number;
    currency: string;
    key?: string;
    gateway: string;
  } | null>(null);

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
          type: "resume_credit",
          metadata: { userId: "session" },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      router.push(data.redirectTo ?? "/resume");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto">
        <Link href="/resume" className="text-sm text-muted-foreground hover:underline">
          ← Back to Resume
        </Link>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Unlock one resume optimisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Use AI to optimise your resume for a specific job description. One credit = one optimisation.
            </p>
            <p className="text-2xl font-semibold">₹99</p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {razorpayOrder && razorpayOrder.key ? (
              <RazorpayCheckout
                orderId={razorpayOrder.orderId}
                amount={razorpayOrder.amount}
                currency={razorpayOrder.currency}
                keyId={razorpayOrder.key}
                description="Resume optimisation — 1 credit"
                onSuccess={handleSuccess}
                onFailure={(err) => setError(err instanceof Error ? err.message : "Payment failed")}
                autoOpen
              />
            ) : (
              <Button onClick={handlePayClick} disabled={loading}>
                {loading ? "Creating order…" : "Pay ₹99 with Razorpay"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
