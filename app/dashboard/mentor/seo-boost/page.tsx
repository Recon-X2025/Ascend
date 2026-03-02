"use client";

import { useState } from "react";
import Link from "next/link";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BOOST_OPTIONS = [
  { boostType: "ONE_TIME_14_DAYS", label: "14 days", price: 999, rupees: "₹999" },
  { boostType: "ONE_TIME_30_DAYS", label: "30 days", price: 1999, rupees: "₹1,999" },
  { boostType: "MONTHLY_RECURRING", label: "Monthly recurring", price: 2999, rupees: "₹2,999/mo" },
] as const;

export default function MentorSeoBoostPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayOrder, setRazorpayOrder] = useState<{
    orderId: string;
    amount: number;
    currency: string;
    keyId?: string;
  } | null>(null);
  const [selectedBoost, setSelectedBoost] = useState<string | null>(null);

  const handlePurchase = async (boostType: string) => {
    setLoading(true);
    setError(null);
    setSelectedBoost(boostType);
    try {
      const res = await fetch("/api/mentorship/mentor/seo-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boostType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      setRazorpayOrder({
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency,
        keyId: data.keyId,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setRazorpayOrder(null);
    setSelectedBoost(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#0F1A0F]">SEO boost</h1>
        <p className="text-muted-foreground">
          Boost your visibility in discovery. Mentees with matching goals see you higher in their curated list.
        </p>

        <div className="grid gap-4">
          {BOOST_OPTIONS.map((opt) => (
            <Card key={opt.boostType}>
              <CardHeader>
                <CardTitle>{opt.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold mb-4">{opt.rupees}</p>
                <Button
                  onClick={() => handlePurchase(opt.boostType)}
                  disabled={loading}
                >
                  {loading && selectedBoost === opt.boostType ? "Creating…" : `Buy ${opt.label}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {razorpayOrder && razorpayOrder.keyId && (
          <RazorpayCheckout
            orderId={razorpayOrder.orderId}
            amount={razorpayOrder.amount}
            currency={razorpayOrder.currency}
            keyId={razorpayOrder.keyId}
            description="Mentor SEO boost"
            onSuccess={handleSuccess}
            onFailure={(err) => setError(err instanceof Error ? err.message : "Payment failed")}
            autoOpen
          />
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Link href="/dashboard/mentor/pricing" className="text-green hover:underline">
          ← Pricing &amp; session fee
        </Link>
        <Link href="/dashboard/mentor" className="text-sm text-muted-foreground hover:underline block">
          ← Back to Mentor Dashboard
        </Link>
      </div>
    </div>
  );
}
