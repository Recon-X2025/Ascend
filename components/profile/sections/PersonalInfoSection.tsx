"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { noticePeriodValues, workModeValues } from "@/lib/validations/profile";

interface Profile {
  id: string;
  headline?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  currentCompany?: string | null;
  currentRole?: string | null;
  totalExpYears?: number | null;
  noticePeriod?: string | null;
  currentCTC?: number | null;
  expectedCTC?: number | null;
  ctcCurrency?: string | null;
  workMode?: string | null;
}

export function PersonalInfoSection({
  profile,
  onUpdate,
}: {
  profile: Profile;
  onUpdate: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    headline: profile.headline ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    country: profile.country ?? "",
    currentCompany: profile.currentCompany ?? "",
    currentRole: profile.currentRole ?? "",
    totalExpYears: profile.totalExpYears ?? "",
    noticePeriod: profile.noticePeriod ?? "",
    currentCTC: profile.currentCTC ?? "",
    expectedCTC: profile.expectedCTC ?? "",
    ctcCurrency: profile.ctcCurrency ?? "INR",
    workMode: profile.workMode ?? "",
  });

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/profile/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: form.headline || null,
        city: form.city || null,
        state: form.state || null,
        country: form.country || null,
        currentCompany: form.currentCompany || null,
        currentRole: form.currentRole || null,
        totalExpYears: form.totalExpYears ? Number(form.totalExpYears) : null,
        noticePeriod: form.noticePeriod || null,
        currentCTC: form.currentCTC ? Number(form.currentCTC) : null,
        expectedCTC: form.expectedCTC ? Number(form.expectedCTC) : null,
        ctcCurrency: form.ctcCurrency || null,
        workMode: form.workMode || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Saved");
    onUpdate();
  };

  return (
    <section className="ascend-card p-6">
      <h2 className="section-title">Personal Information</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="ascend-label">Headline</label>
          <Input
            className="ascend-input"
            placeholder="e.g. Senior Product Manager"
            value={form.headline}
            onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
          />
        </div>
        <div>
          <label className="ascend-label">City</label>
          <Input
            className="ascend-input"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </div>
        <div>
          <label className="ascend-label">State</label>
          <Input
            className="ascend-input"
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          />
        </div>
        <div>
          <label className="ascend-label">Country</label>
          <Input
            className="ascend-input"
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          />
        </div>
        <div>
          <label className="ascend-label">Current company</label>
          <Input
            className="ascend-input"
            value={form.currentCompany}
            onChange={(e) => setForm((f) => ({ ...f, currentCompany: e.target.value }))}
          />
        </div>
        <div>
          <label className="ascend-label">Current role</label>
          <Input
            className="ascend-input"
            value={form.currentRole}
            onChange={(e) => setForm((f) => ({ ...f, currentRole: e.target.value }))}
          />
        </div>
        <div>
          <label className="ascend-label">Total experience (years)</label>
          <Input
            type="number"
            min={0}
            step={0.5}
            className="ascend-input"
            value={form.totalExpYears}
            onChange={(e) => setForm((f) => ({ ...f, totalExpYears: e.target.value }))}
          />
        </div>
        <div>
          <label className="ascend-label">Notice period</label>
          <Select
            value={form.noticePeriod}
            onValueChange={(v) => setForm((f) => ({ ...f, noticePeriod: v }))}
          >
            <SelectTrigger className="ascend-input">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {noticePeriodValues.map((v) => (
                <SelectItem key={v} value={v}>
                  {v.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="ascend-label">Current CTC</label>
          <Input
            type="number"
            min={0}
            className="ascend-input"
            value={form.currentCTC}
            onChange={(e) => setForm((f) => ({ ...f, currentCTC: e.target.value }))}
          />
        </div>
        <div>
          <label className="ascend-label">Expected CTC</label>
          <Input
            type="number"
            min={0}
            className="ascend-input"
            value={form.expectedCTC}
            onChange={(e) => setForm((f) => ({ ...f, expectedCTC: e.target.value }))}
          />
        </div>
        <div>
          <label className="ascend-label">Currency</label>
          <Input
            className="ascend-input"
            value={form.ctcCurrency}
            onChange={(e) => setForm((f) => ({ ...f, ctcCurrency: e.target.value }))}
          />
        </div>
        <div>
          <label className="ascend-label">Work mode</label>
          <Select value={form.workMode} onValueChange={(v) => setForm((f) => ({ ...f, workMode: v }))}>
            <SelectTrigger className="ascend-input">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {workModeValues.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button className="btn-primary mt-4" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </section>
  );
}
