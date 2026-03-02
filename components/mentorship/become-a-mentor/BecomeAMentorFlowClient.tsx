"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { StepIndicator } from "./StepIndicator";
import {
  mentorCompanyTypeValues,
  engagementLengthValues,
  sessionFrequencyValues,
  m2FocusAreaValues,
  geographyScopeValues,
  dayOfWeekValues,
} from "@/lib/mentorship/profile";
import type { MentorProfileCreateInput, AvailabilityWindowInput } from "@/lib/mentorship/profile";
import {
  MENTOR_COMPANY_TYPE_LABELS,
  M2_FOCUS_AREA_LABELS,
  ENGAGEMENT_LENGTH_LABELS,
  SESSION_FREQUENCY_LABELS,
  GEOGRAPHY_SCOPE_LABELS,
  DAY_OF_WEEK_LABELS,
} from "@/lib/mentorship/m2-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOTAL_STEPS = 6;
const currentYear = new Date().getFullYear();

const defaultForm: Partial<MentorProfileCreateInput> = {
  fromRole: "",
  fromCompanyType: undefined,
  fromIndustry: "",
  fromCity: "",
  toRole: "",
  toCompanyType: undefined,
  toIndustry: "",
  toCity: "",
  transitionDurationMonths: 12,
  transitionYear: currentYear,
  keyFactor1: "",
  keyFactor2: "",
  keyFactor3: "",
  statementTransitionMade: "",
  statementWishIKnew: "",
  statementCanHelpWith: "",
  statementCannotHelpWith: "",
  maxActiveMentees: 2,
  engagementPreference: [],
  sessionFrequency: "WEEKLY",
  timezone: "Asia/Kolkata",
  m2FocusAreas: [],
  languages: ["English"],
  geographyScope: "INDIA_ONLY",
  geographyCountries: [],
  availabilityWindows: [],
};

const legalFetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject()));

export function BecomeAMentorFlowClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const { data: conductData } = useSWR<{ signed?: boolean }>(
    "/api/mentorship/legal/MENTOR_CONDUCT_AGREEMENT",
    legalFetcher
  );
  const conductSigned = conductData?.signed === true;

  useEffect(() => {
    if (conductData === undefined) return;
    if (!conductSigned) {
      router.replace(
        "/mentorship/legal/sign/MENTOR_CONDUCT_AGREEMENT?next=" +
          encodeURIComponent("/mentorship/become-a-mentor")
      );
    }
  }, [conductData, conductSigned, router]);
  const [form, setForm] = useState<Partial<MentorProfileCreateInput>>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<MentorProfileCreateInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const addWindow = () => {
    update({
      availabilityWindows: [
        ...(form.availabilityWindows ?? []),
        { dayOfWeek: "MON", startTime: "09:00", endTime: "11:00" },
      ],
    });
  };

  const updateWindow = (index: number, patch: Partial<AvailabilityWindowInput>) => {
    const windows = [...(form.availabilityWindows ?? [])];
    if (!windows[index]) return;
    windows[index] = { ...windows[index]!, ...patch };
    update({ availabilityWindows: windows });
  };

  const removeWindow = (index: number) => {
    update({
      availabilityWindows: (form.availabilityWindows ?? []).filter((_, i) => i !== index),
    });
  };

  if (conductData !== undefined && !conductSigned) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to sign Mentor Conduct Agreement…</p>
          <Link href="/mentorship/legal/sign/MENTOR_CONDUCT_AGREEMENT?next=/mentorship/become-a-mentor" className="text-[#16A34A] underline mt-2 inline-block">
            Continue to sign
          </Link>
        </div>
      </div>
    );
  }

  const canProceedStep1 =
    (form.fromRole?.trim()?.length ?? 0) > 0 &&
    form.fromCompanyType &&
    (form.fromIndustry?.trim()?.length ?? 0) > 0 &&
    (form.fromCity?.trim()?.length ?? 0) > 0 &&
    (form.toRole?.trim()?.length ?? 0) > 0 &&
    form.toCompanyType &&
    (form.toIndustry?.trim()?.length ?? 0) > 0 &&
    (form.toCity?.trim()?.length ?? 0) > 0 &&
    typeof form.transitionDurationMonths === "number" &&
    form.transitionDurationMonths >= 1 &&
    form.transitionDurationMonths <= 120 &&
    typeof form.transitionYear === "number" &&
    form.transitionYear >= 2000 &&
    form.transitionYear <= currentYear;

  const canProceedStep2 =
    (form.keyFactor1?.length ?? 0) >= 20 &&
    (form.keyFactor2?.length ?? 0) >= 20 &&
    (form.keyFactor3?.length ?? 0) >= 20;

  const canProceedStep3 =
    (form.statementTransitionMade?.length ?? 0) >= 50 &&
    (form.statementWishIKnew?.length ?? 0) >= 50 &&
    (form.statementCanHelpWith?.length ?? 0) >= 50 &&
    (form.statementCannotHelpWith?.length ?? 0) >= 50;

  const canProceedStep4 =
    (form.engagementPreference?.length ?? 0) > 0 &&
    form.sessionFrequency &&
    (form.availabilityWindows?.length ?? 0) > 0;

  const canProceedStep5 =
    (form.m2FocusAreas?.length ?? 0) >= 1 &&
    (form.m2FocusAreas?.length ?? 0) <= 5 &&
    form.geographyScope &&
    (form.geographyScope !== "SPECIFIC_COUNTRIES" || (form.geographyCountries?.length ?? 0) > 0);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        fromRole: form.fromRole!.trim(),
        fromIndustry: form.fromIndustry!.trim(),
        fromCity: form.fromCity!.trim(),
        toRole: form.toRole!.trim(),
        toIndustry: form.toIndustry!.trim(),
        toCity: form.toCity!.trim(),
        keyFactor1: form.keyFactor1!.trim(),
        keyFactor2: form.keyFactor2!.trim(),
        keyFactor3: form.keyFactor3!.trim(),
        statementTransitionMade: form.statementTransitionMade!.trim(),
        statementWishIKnew: form.statementWishIKnew!.trim(),
        statementCanHelpWith: form.statementCanHelpWith!.trim(),
        statementCannotHelpWith: form.statementCannotHelpWith!.trim(),
        availabilityWindows: form.availabilityWindows!,
      };
      const checkRes = await fetch("/api/mentorship/profile");
      const checkData = await checkRes.json().catch(() => ({}));
      const method = checkData?.profile ? "PATCH" : "POST";
      const res = await fetch("/api/mentorship/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to submit");
        return;
      }
      setSubmitSuccess(true);
      setTimeout(() => router.push("/dashboard/mentor"), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="rounded-xl border border-green/30 bg-green/5 p-8 text-center">
        <h2 className="text-xl font-semibold text-ink">Profile submitted</h2>
        <p className="mt-2 text-ink-3">
          Your profile is under review. We&apos;ll notify you within 48 hours.
        </p>
        <p className="mt-4 text-sm text-ink-4">Redirecting to mentor dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-[#0F1A0F]">Become a mentor</h1>
        <Link href="/mentorship/dashboard" className="text-green text-sm hover:underline">
          Dashboard
        </Link>
      </div>

      <StepIndicator step={step} total={TOTAL_STEPS} />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Step 1 — Transition */}
      {step === 1 && (
        <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold text-ink">Your transition</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>From — Role</Label>
              <Input
                value={form.fromRole ?? ""}
                onChange={(e) => update({ fromRole: e.target.value })}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label>From — Company type</Label>
              <Select
                value={form.fromCompanyType ?? ""}
                onValueChange={(v) => update({ fromCompanyType: v as MentorProfileCreateInput["fromCompanyType"] })}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {mentorCompanyTypeValues.map((v) => (
                    <SelectItem key={v} value={v}>{MENTOR_COMPANY_TYPE_LABELS[v] ?? v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From — Industry</Label>
              <Input
                value={form.fromIndustry ?? ""}
                onChange={(e) => update({ fromIndustry: e.target.value })}
                placeholder="e.g. Fintech"
              />
            </div>
            <div className="space-y-2">
              <Label>From — City</Label>
              <Input
                value={form.fromCity ?? ""}
                onChange={(e) => update({ fromCity: e.target.value })}
                placeholder="e.g. Mumbai"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>To — Role</Label>
              <Input
                value={form.toRole ?? ""}
                onChange={(e) => update({ toRole: e.target.value })}
                placeholder="e.g. Product Manager"
              />
            </div>
            <div className="space-y-2">
              <Label>To — Company type</Label>
              <Select
                value={form.toCompanyType ?? ""}
                onValueChange={(v) => update({ toCompanyType: v as MentorProfileCreateInput["toCompanyType"] })}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {mentorCompanyTypeValues.map((v) => (
                    <SelectItem key={v} value={v}>{MENTOR_COMPANY_TYPE_LABELS[v] ?? v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To — Industry</Label>
              <Input
                value={form.toIndustry ?? ""}
                onChange={(e) => update({ toIndustry: e.target.value })}
                placeholder="e.g. SaaS"
              />
            </div>
            <div className="space-y-2">
              <Label>To — City</Label>
              <Input
                value={form.toCity ?? ""}
                onChange={(e) => update({ toCity: e.target.value })}
                placeholder="e.g. Bangalore"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Transition duration (months)</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={form.transitionDurationMonths ?? ""}
                onChange={(e) => update({ transitionDurationMonths: parseInt(e.target.value, 10) || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Year completed</Label>
              <Input
                type="number"
                min={2000}
                max={currentYear}
                value={form.transitionYear ?? ""}
                onChange={(e) => update({ transitionYear: parseInt(e.target.value, 10) || undefined })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 2 — Key factors */}
      {step === 2 && (
        <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold text-ink">What made it possible</h2>
          {[
            { key: "keyFactor1" as const, label: "Factor 1 — What was the single most important thing you did?" },
            { key: "keyFactor2" as const, label: "Factor 2 — What external support or resource mattered most?" },
            { key: "keyFactor3" as const, label: "Factor 3 — What would you do differently?" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                value={form[key] ?? ""}
                onChange={(e) => update({ [key]: e.target.value })}
                maxLength={200}
                placeholder="20–200 characters"
              />
              <p className="text-xs text-ink-4">{(form[key]?.length ?? 0)} / 200</p>
            </div>
          ))}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 3 — Statements */}
      {step === 3 && (
        <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold text-ink">Your mentor statement</h2>
          {[
            {
              key: "statementTransitionMade" as const,
              label: "The transition I made...",
              placeholder: "Describe your transition in your own words — what you were, what you became, and what it cost you.",
            },
            {
              key: "statementWishIKnew" as const,
              label: "What I wish I had known...",
              placeholder: "What do you know now that would have saved you time, money, or pain?",
            },
            {
              key: "statementCanHelpWith" as const,
              label: "What I can help you with...",
              placeholder: "Be specific. What situations, decisions, and challenges can you genuinely guide someone through?",
            },
            {
              key: "statementCannotHelpWith" as const,
              label: "What I cannot help you with...",
              placeholder: "What is outside your experience? Be honest — mentees will trust you more for it.",
            },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                value={form[key] ?? ""}
                onChange={(e) => update({ [key]: e.target.value })}
                maxLength={400}
                placeholder={placeholder}
              />
              <p className="text-xs text-ink-4">{(form[key]?.length ?? 0)} / 400 (min 50)</p>
            </div>
          ))}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={() => setStep(4)} disabled={!canProceedStep3}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 4 — Availability */}
      {step === 4 && (
        <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold text-ink">Availability & capacity</h2>
          <div className="rounded-lg border border-[var(--border)] bg-muted/30 p-3">
            <p className="text-sm text-ink-3">Max active mentees: 2 (RISING tier)</p>
          </div>
          <div className="space-y-2">
            <Label>Engagement preferences (select at least one)</Label>
            <div className="flex flex-wrap gap-2">
              {engagementLengthValues.map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.engagementPreference?.includes(v) ?? false}
                    onChange={() => {
                      const prev = form.engagementPreference ?? [];
                      update({
                        engagementPreference: prev.includes(v)
                          ? prev.filter((x) => x !== v)
                          : [...prev, v],
                      });
                    }}
                  />
                  <span className="text-sm">{ENGAGEMENT_LENGTH_LABELS[v] ?? v}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Session frequency</Label>
            <div className="flex gap-4">
              {sessionFrequencyValues.map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sessionFrequency"
                    checked={form.sessionFrequency === v}
                    onChange={() => update({ sessionFrequency: v })}
                  />
                  <span className="text-sm">{SESSION_FREQUENCY_LABELS[v] ?? v}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Availability windows (add at least one)</Label>
            {(form.availabilityWindows ?? []).map((w, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded border p-2">
                <Select
                  value={w.dayOfWeek}
                  onValueChange={(v) => updateWindow(i, { dayOfWeek: v as AvailabilityWindowInput["dayOfWeek"] })}
                >
                  <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dayOfWeekValues.map((d) => (
                      <SelectItem key={d} value={d}>{DAY_OF_WEEK_LABELS[d] ?? d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="time"
                  className="w-[120px]"
                  value={w.startTime}
                  onChange={(e) => updateWindow(i, { startTime: e.target.value })}
                />
                <Input
                  type="time"
                  className="w-[120px]"
                  value={w.endTime}
                  onChange={(e) => updateWindow(i, { endTime: e.target.value })}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeWindow(i)}>Remove</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addWindow}>Add window</Button>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button onClick={() => setStep(5)} disabled={!canProceedStep4}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 5 — Focus & geography */}
      {step === 5 && (
        <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold text-ink">Focus & geography</h2>
          <div className="space-y-2">
            <Label>Focus areas (1–5)</Label>
            <div className="flex flex-wrap gap-2">
              {m2FocusAreaValues.map((v) => (
                <label
                  key={v}
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm cursor-pointer ${
                    form.m2FocusAreas?.includes(v)
                      ? "border-green bg-green/10 text-green"
                      : "border-[var(--border)] hover:border-green/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.m2FocusAreas?.includes(v) ?? false}
                    onChange={() => {
                      const prev = form.m2FocusAreas ?? [];
                      const next = prev.includes(v)
                        ? prev.filter((x) => x !== v)
                        : prev.length >= 5
                        ? prev
                        : [...prev, v];
                      update({ m2FocusAreas: next });
                    }}
                  />
                  {M2_FOCUS_AREA_LABELS[v] ?? v}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Languages (comma-separated)</Label>
            <Input
              value={Array.isArray(form.languages) ? form.languages.join(", ") : form.languages ?? ""}
              onChange={(e) =>
                update({
                  languages: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="English, Hindi"
            />
          </div>
          <div className="space-y-2">
            <Label>Geography scope</Label>
            <div className="flex flex-col gap-2">
              {geographyScopeValues.map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="geographyScope"
                    checked={form.geographyScope === v}
                    onChange={() => update({ geographyScope: v, geographyCountries: v === "SPECIFIC_COUNTRIES" ? form.geographyCountries : [] })}
                  />
                  <span className="text-sm">{GEOGRAPHY_SCOPE_LABELS[v] ?? v}</span>
                </label>
              ))}
            </div>
          </div>
          {form.geographyScope === "SPECIFIC_COUNTRIES" && (
            <div className="space-y-2">
              <Label>Countries (comma-separated)</Label>
              <Input
                value={(form.geographyCountries ?? []).join(", ")}
                onChange={(e) =>
                  update({
                    geographyCountries: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="India, UAE, UK"
              />
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(4)}>Back</Button>
            <Button onClick={() => setStep(6)} disabled={!canProceedStep5}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 6 — Review & submit */}
      {step === 6 && (
        <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold text-ink">Review & submit</h2>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-medium text-ink-3 mb-2">Transition</h3>
              <p>
                {form.fromRole} · {form.fromCompanyType && MENTOR_COMPANY_TYPE_LABELS[form.fromCompanyType]} · {form.fromIndustry} · {form.fromCity}
                {" → "}
                {form.toRole} · {form.toCompanyType && MENTOR_COMPANY_TYPE_LABELS[form.toCompanyType]} · {form.toIndustry} · {form.toCity}
              </p>
              <p className="text-ink-4">{form.transitionDurationMonths} months · Completed {form.transitionYear}</p>
            </section>
            <section>
              <h3 className="font-medium text-ink-3 mb-2">Key factors</h3>
              <p>{form.keyFactor1}</p>
              <p>{form.keyFactor2}</p>
              <p>{form.keyFactor3}</p>
            </section>
            <section>
              <h3 className="font-medium text-ink-3 mb-2">Availability</h3>
              <p>
                {(form.availabilityWindows ?? []).length} window(s) · {form.sessionFrequency && SESSION_FREQUENCY_LABELS[form.sessionFrequency]} ·{" "}
                {(form.engagementPreference ?? []).map((e) => ENGAGEMENT_LENGTH_LABELS[e]).join(", ")}
              </p>
            </section>
            <section>
              <h3 className="font-medium text-ink-3 mb-2">Focus & geography</h3>
              <p>{(form.m2FocusAreas ?? []).map((f) => M2_FOCUS_AREA_LABELS[f]).join(", ")}</p>
              <p>{form.geographyScope && GEOGRAPHY_SCOPE_LABELS[form.geographyScope]}</p>
            </section>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(5)}>Back</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit profile for review"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
