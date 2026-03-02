"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RazorpayCheckout } from "./RazorpayCheckout";

const BOOST_OPTIONS = [
  { type: "standard" as const, label: "Standard", price: 799, per: "week" },
  { type: "featured" as const, label: "Featured", price: 1999, per: "week" },
];

export function BoostPurchaseForm({
  jobId,
  jobTitle,
  companyId,
}: {
  jobId: number;
  jobTitle: string;
  companyId: string;
}) {
  const router = useRouter();
  const [boostType, setBoostType] = useState<"standard" | "featured">("standard");
  const [weeks, setWeeks] = useState(1);
  const [order, setOrder] = useState<{ orderId: string; amount: number; keyId: string } | null>(null);

  const createOrder = async () => {
    const res = await fetch("/api/jobs/" + jobId + "/boost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boostType, weeks, currency: "INR" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to create order");
      return;
    }
    const data = await res.json();
    setOrder({ orderId: data.orderId, amount: data.amount, keyId: data.key ?? "" });
  };

  const handleSuccess = async (paymentId: string, signature: string) => {
    const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        razorpay_order_id: order?.orderId,
        type: "boost",
        metadata: { jobPostId: String(jobId), boostType, weeks: String(weeks), companyId },
      }),
    });
    if (!res.ok) {
      toast.error("Verification failed");
      return;
    }
    toast.success("Boost activated");
    router.push("/dashboard/recruiter/jobs");
    router.refresh();
  };

  return (
    <div className="max-w-md space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Boost type</p>
        <div className="flex gap-2">
          {BOOST_OPTIONS.map((o) => (
            <Button
              key={o.type}
              variant={boostType === o.type ? "default" : "outline"}
              size="sm"
              onClick={() => setBoostType(o.type)}
            >
              {o.label} — ₹{o.price}/{o.per}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Duration (weeks)</p>
        <input
          type="number"
          min={1}
          max={52}
          value={weeks}
          onChange={(e) => setWeeks(parseInt(e.target.value, 10) || 1)}
          className="border rounded px-2 py-1 w-20"
        />
      </div>
      {!order ? (
        <Button onClick={createOrder}>Continue to payment</Button>
      ) : (
        <RazorpayCheckout
          orderId={order.orderId}
          amount={order.amount}
          currency="INR"
          description={`Boost: ${jobTitle}`}
          keyId={order.keyId}
          onSuccess={handleSuccess}
          onFailure={() => toast.error("Payment failed")}
        />
      )}
    </div>
  );
}
