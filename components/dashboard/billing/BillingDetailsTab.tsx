"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const STATE_NAMES: Record<string, string> = {
  "29": "Karnataka", "27": "Maharashtra", "33": "Tamil Nadu", "07": "Delhi",
  "09": "Uttar Pradesh", "24": "Gujarat", "19": "West Bengal", "21": "Odisha",
  "22": "Chhattisgarh", "23": "Madhya Pradesh", "28": "Andhra Pradesh",
  "32": "Kerala", "36": "Telangana", "20": "Jharkhand", "10": "Bihar",
  "06": "Haryana", "08": "Rajasthan", "05": "Uttarakhand", "03": "Punjab",
};

export function BillingDetailsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [gstinError, setGstinError] = useState<string | null>(null);
  const [derivedState, setDerivedState] = useState<string | null>(null);

  const fetchProfile = async () => {
    const res = await fetch("/api/billing/profile");
    const data = await res.json();
    setLegalName(data?.legalName ?? "");
    setBillingAddress(data?.billingAddress ?? "");
    setGstin(data?.gstin ?? "");
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (gstin.length === 15 && GSTIN_REGEX.test(gstin)) {
      const code = gstin.slice(0, 2);
      setDerivedState(STATE_NAMES[code] ? `${code} (${STATE_NAMES[code]})` : code);
      setGstinError(null);
    } else if (gstin.length > 0) {
      setDerivedState(null);
      setGstinError(gstin.length === 15 ? "Invalid GSTIN format" : "");
    } else {
      setDerivedState(null);
      setGstinError(null);
    }
  }, [gstin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gstin && !GSTIN_REGEX.test(gstin)) {
      setGstinError("Invalid GSTIN format");
      return;
    }
    setSaving(true);
    try {
      await fetch("/api/billing/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName: legalName || undefined,
          billingAddress: billingAddress || undefined,
          gstin: gstin || "",
        }),
      });
      await fetchProfile();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Billing details</CardTitle>
        <p className="text-sm text-muted-foreground">
          Providing your GSTIN allows you to claim Input Tax Credit on eligible B2B purchases.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <Label htmlFor="legalName">Legal name / Company name</Label>
            <Input
              id="legalName"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Full name or company legal name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="billingAddress">Billing address</Label>
            <Textarea
              id="billingAddress"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Full billing address"
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="gstin">GSTIN (optional)</Label>
            <Input
              id="gstin"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="e.g. 29AANCC3402A1Z3"
              maxLength={15}
              className="mt-1 font-mono"
            />
            {gstinError && <p className="text-sm text-destructive mt-1">{gstinError}</p>}
            {derivedState && <p className="text-sm text-muted-foreground mt-1">State: {derivedState}</p>}
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save billing details"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
