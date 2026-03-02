"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const WAIVER_TEXT = `I understand that by choosing to pay in full upfront, I waive my right to file a payment dispute regarding this mentorship engagement. All other terms of the Mentorship Agreement remain in effect.`;

type PaymentMode = "ESCROW" | "FULL_UPFRONT";

export default function MentorshipPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.contractId as string;
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("ESCROW");
  const [order, setOrder] = useState<{
    escrowId: string;
    orderId: string;
    amount: number;
    currency: string;
    keyId?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    mentorName: string;
    agreedFeePaise: number;
  } | null>(null);
  const [waiverModalOpen, setWaiverModalOpen] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [readyForCheckout, setReadyForCheckout] = useState(false);

  const createOrder = async (mode: PaymentMode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mentorship/escrow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, paymentMode: mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Failed to create order");
      }
      setOrder(data);
      setPaymentMode(mode);
      return data as { escrowId: string; orderId: string; amount: number; currency: string; keyId?: string };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      toast.error(e instanceof Error ? e.message : "Failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAndProceed = async () => {
    if (!order || paymentMode !== "FULL_UPFRONT") return;
    setAcknowledging(true);
    try {
      const res = await fetch("/api/mentorship/escrow/acknowledge-payment-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrowId: order.escrowId,
          paymentMode: "FULL_UPFRONT",
          waiverText: WAIVER_TEXT,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to record acknowledgement");
      }
      setWaiverModalOpen(false);
      setReadyForCheckout(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Acknowledgement failed");
    } finally {
      setAcknowledging(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/mentorship/escrow/${contractId}`);
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        if (data.paymentInfo) setPaymentInfo(data.paymentInfo);
        if (data.escrow?.status === "FUNDED" || data.escrow?.status === "COMPLETED") {
          setAlreadyPaid(true);
          return;
        }
        if (data.escrow?.razorpayOrderId && data.escrow?.status === "PENDING_PAYMENT") {
          setOrder({
            escrowId: data.escrow.id,
            orderId: data.escrow.razorpayOrderId,
            amount: data.escrow.totalAmountPaise,
            currency: "INR",
            keyId: data.keyId,
          });
          setPaymentMode((data.escrow.paymentMode ?? "ESCROW") as PaymentMode);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [contractId]);

  const handleProceedToPayment = async () => {
    if (paymentMode === "FULL_UPFRONT") {
      const ord = order ?? (await createOrder("FULL_UPFRONT"));
      if (ord) setWaiverModalOpen(true);
      return;
    }
    if (!order) await createOrder("ESCROW");
  };

  const handleSuccess = async (paymentId: string, signature: string) => {
    const res = await fetch("/api/mentorship/escrow/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        razorpay_order_id: order?.orderId,
      }),
    });
    if (!res.ok) {
      toast.error("Verification failed");
      return;
    }
    toast.success("Payment successful");
    router.push(`/mentorship/engagements/${contractId}`);
    router.refresh();
  };

  const amountRupees = order
    ? (order.amount / 100).toFixed(0)
    : paymentInfo?.agreedFeePaise
      ? (paymentInfo.agreedFeePaise / 100).toFixed(0)
      : "—";
  const mentorName = paymentInfo?.mentorName ?? "Mentor";

  if (alreadyPaid) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Payment complete</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your payment has been received. Funds are held in escrow.
              </p>
            </CardHeader>
            <CardContent>
              <Link href={`/mentorship/engagements/${contractId}`}>
                <Button>View engagement</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="max-w-lg mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Choose how you&apos;d like to pay</CardTitle>
            <p className="text-sm text-muted-foreground">
              You are paying ₹{amountRupees} to {mentorName}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => !order && setPaymentMode("ESCROW")}
              onKeyDown={(e) => !order && e.key === "Enter" && setPaymentMode("ESCROW")}
              className={cn(
                "rounded-lg border p-4 cursor-pointer transition-colors",
                paymentMode === "ESCROW"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">🔒</span>
                <div className="flex-1">
                  <p className="font-medium">Escrow — Recommended</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your payment is held securely by Ascend. Released milestone by milestone as the
                    engagement progresses. Full dispute rights protected.
                  </p>
                  {paymentMode === "ESCROW" && (
                    <p className="text-xs text-primary mt-2 font-medium">Selected by default</p>
                  )}
                </div>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => !order && setPaymentMode("FULL_UPFRONT")}
              onKeyDown={(e) => !order && e.key === "Enter" && setPaymentMode("FULL_UPFRONT")}
              className={cn(
                "rounded-lg border p-4 cursor-pointer transition-colors",
                paymentMode === "FULL_UPFRONT"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">⚡</span>
                <div className="flex-1">
                  <p className="font-medium">Pay in Full</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pay the full amount now. Mentor receives payment immediately. Note: By choosing
                    this option you waive your right to raise a payment dispute.
                  </p>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {!order ? (
              <Button onClick={() => handleProceedToPayment()} disabled={loading}>
                {loading ? "Creating order…" : "Proceed to Payment"}
              </Button>
            ) : order ? (
              <div className="flex flex-col gap-2">
                {paymentMode === "ESCROW" ? (
                  <RazorpayCheckout
                    orderId={order.orderId}
                    amount={order.amount}
                    currency={order.currency}
                    description="Mentorship engagement"
                    keyId={order.keyId ?? ""}
                    onSuccess={handleSuccess}
                    onFailure={() => toast.error("Payment failed")}
                  />
                ) : readyForCheckout ? (
                  <RazorpayCheckout
                    orderId={order.orderId}
                    amount={order.amount}
                    currency={order.currency}
                    description="Mentorship engagement"
                    keyId={order.keyId ?? ""}
                    onSuccess={handleSuccess}
                    onFailure={() => toast.error("Payment failed")}
                    autoOpen
                  />
                ) : (
                  <>
                    <Button
                      onClick={handleProceedToPayment}
                      disabled={acknowledging || loading}
                    >
                      {acknowledging
                        ? "Processing…"
                        : loading
                          ? "Creating order…"
                          : "Proceed to Payment"}
                    </Button>
                    <Dialog open={waiverModalOpen} onOpenChange={setWaiverModalOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm waiver</DialogTitle>
                          <DialogDescription>
                            By clicking Confirm, you acknowledge:
                          </DialogDescription>
                        </DialogHeader>
                        <blockquote className="rounded-lg border bg-muted/50 p-4 text-sm italic">
                          &quot;{WAIVER_TEXT}&quot;
                        </blockquote>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setWaiverModalOpen(false)}
                            disabled={acknowledging}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={acknowledgeAndProceed}
                            disabled={acknowledging}
                          >
                            {acknowledging ? "Processing…" : "Confirm & Proceed to Payment"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                <p className="text-xs text-muted-foreground">
                  You will be redirected to Razorpay to complete payment.
                </p>
              </div>
            ) : null}

            <Link
              href={`/mentorship/engagements/${contractId}`}
              className="block text-sm text-muted-foreground hover:underline"
            >
              ← Back to engagement
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
