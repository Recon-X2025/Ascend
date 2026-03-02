"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MENTORSHIP_PRICING_RULES } from "@/lib/mentorship/monetisation";

const floorRupees = MENTORSHIP_PRICING_RULES.sessionFloorPaise / 100;
const ceilingRupees = MENTORSHIP_PRICING_RULES.sessionCeilingPaise / 100;

export default function MentorPricingPage() {
  const [status, setStatus] = useState<{
    canChargeMentees: boolean;
    sessionFeePaise: number | null;
    floorPaise: number;
    ceilingPaise: number;
  } | null>(null);
  const [feeInput, setFeeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mentorship/mentor/monetisation-status")
      .then((r) => r.json())
      .then((d) => {
        if (d.sessionFeePaise != null) setFeeInput(String(d.sessionFeePaise / 100));
        setStatus({
          canChargeMentees: d.canChargeMentees ?? false,
          sessionFeePaise: d.sessionFeePaise ?? null,
          floorPaise: d.floorPaise ?? MENTORSHIP_PRICING_RULES.sessionFloorPaise,
          ceilingPaise: d.ceilingPaise ?? MENTORSHIP_PRICING_RULES.sessionCeilingPaise,
        });
      })
      .catch(() => setError("Failed to load status"));
  }, []);

  const handleSetFee = async () => {
    const rupees = parseInt(feeInput, 10);
    if (isNaN(rupees) || rupees < floorRupees || rupees > ceilingRupees) {
      setError(`Fee must be between ₹${floorRupees} and ₹${ceilingRupees}`);
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/mentorship/mentor/session-fee", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feePaise: rupees * 100 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMessage("Session fee updated.");
      if (status) setStatus({ ...status, sessionFeePaise: rupees * 100 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    setCheckLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/mentorship/mentor/monetisation-check", { method: "POST" });
      const data = await res.json();
      if (res.status === 429) throw new Error(data.error ?? "Rate limited");
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMessage(
        data.canChargeMentees
          ? "Monetisation unlocked. You can charge mentees."
          : "Check complete. You may need to subscribe or meet more criteria."
      );
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#0F1A0F]">Pricing &amp; monetisation</h1>

        <Card>
          <CardHeader>
            <CardTitle>Session fee</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set your per-session fee (₹{floorRupees.toLocaleString()} – ₹{ceilingRupees.toLocaleString()}). Mentees pay this when they book.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {status && !status.canChargeMentees && (
              <p className="text-sm text-amber-600">
                Unlock monetisation first: meet verified outcomes, Steno rate, and platform tenure. Run a check below.
              </p>
            )}
            <div className="flex gap-2 items-center">
              <span className="text-lg">₹</span>
              <Input
                type="number"
                min={floorRupees}
                max={ceilingRupees}
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                placeholder={`${floorRupees} - ${ceilingRupees}`}
                disabled={!status?.canChargeMentees}
                className="w-32"
              />
              <Button onClick={handleSetFee} disabled={loading || !status?.canChargeMentees}>
                {loading ? "Saving…" : "Set fee"}
              </Button>
            </div>
            {status?.sessionFeePaise != null && (
              <p className="text-sm text-muted-foreground">
                Current fee: ₹{(status.sessionFeePaise / 100).toLocaleString()}/session
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monetisation check</CardTitle>
            <p className="text-sm text-muted-foreground">
              Run a check to see if you meet unlock criteria (1 check per 24 hours).
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCheck} variant="outline" disabled={checkLoading}>
              {checkLoading ? "Checking…" : "Run monetisation check"}
            </Button>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-green">{message}</p>}

        <Link href="/dashboard/mentor/seo-boost" className="text-green hover:underline">
          SEO boost options →
        </Link>

        <Link href="/dashboard/mentor" className="text-sm text-muted-foreground hover:underline block">
          ← Back to Mentor Dashboard
        </Link>
      </div>
    </div>
  );
}
