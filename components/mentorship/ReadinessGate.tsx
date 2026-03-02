"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Check, Circle } from "lucide-react";
import Link from "next/link";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Readiness = {
  allGatesPassed?: boolean;
  profileComplete?: boolean;
  careerContextComplete?: boolean;
  transitionDeclared?: boolean;
  targetTransition?: {
    targetFromRole: string | null;
    targetFromIndustry: string | null;
    targetToRole: string | null;
    targetToIndustry: string | null;
    targetCity: string | null;
    targetTimelineMonths: number | null;
  };
};

const TIMELINE_OPTIONS = [
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
  { value: 18, label: "18+ months" },
];

export function ReadinessGate() {
  const { data: readiness, mutate } = useSWR<Readiness>("/api/mentorship/readiness", fetcher);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    targetFromRole: "",
    targetFromIndustry: "",
    targetToRole: "",
    targetToIndustry: "",
    targetCity: "",
    targetTimelineMonths: 6,
  });

  useEffect(() => {
    const t = readiness?.targetTransition;
    if (t) {
      setForm((f) => ({
        ...f,
        targetFromRole: t.targetFromRole ?? "",
        targetFromIndustry: t.targetFromIndustry ?? "",
        targetToRole: t.targetToRole ?? "",
        targetToIndustry: t.targetToIndustry ?? "",
        targetCity: t.targetCity ?? "",
        targetTimelineMonths: t.targetTimelineMonths ?? 6,
      }));
    }
  }, [readiness?.targetTransition]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/mentorship/readiness", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.details?.fieldErrors ? "Check all fields" : j.error ?? "Failed to save");
        return;
      }
      await mutate();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-ink">Unlock mentor matching</h2>
      <p className="text-sm text-muted-foreground">
        Complete these steps so we can surface the right mentors for you.
      </p>

      <ul className="space-y-3">
        <li className="flex items-start gap-3">
          {readiness?.profileComplete ? (
            <Check className="h-5 w-5 text-green shrink-0 mt-0.5" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-medium text-ink">Profile complete</span>
            <p className="text-sm text-muted-foreground">
              Headline, location, current role, experience, at least one skill and one work experience.
            </p>
            {!readiness?.profileComplete && (
              <Link href="/profile/edit" className="text-sm text-green hover:underline mt-1 inline-block">
                Complete profile →
              </Link>
            )}
          </div>
        </li>

        <li className="flex items-start gap-3">
          {readiness?.careerContextComplete ? (
            <Check className="h-5 w-5 text-green shrink-0 mt-0.5" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-medium text-ink">Career context complete</span>
            <p className="text-sm text-muted-foreground">
              Score 80% or more so we can match you to the right transition.
            </p>
            {!readiness?.careerContextComplete && (
              <Link href="/onboarding/context" className="text-sm text-green hover:underline mt-1 inline-block">
                Complete career context →
              </Link>
            )}
          </div>
        </li>

        <li className="flex items-start gap-3">
          {readiness?.transitionDeclared ? (
            <Check className="h-5 w-5 text-green shrink-0 mt-0.5" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-medium text-ink">Target transition declared</span>
            <p className="text-sm text-muted-foreground">
              Tell us where you are and where you want to be.
            </p>
          </div>
        </li>
      </ul>

      {!readiness?.transitionDeclared && (
        <form onSubmit={handleSave} className="ascend-card p-6 space-y-4">
          <h3 className="font-medium text-ink">Where are you now?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Current role</label>
              <input
                type="text"
                value={form.targetFromRole}
                onChange={(e) => setForm((f) => ({ ...f, targetFromRole: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Industry</label>
              <input
                type="text"
                value={form.targetFromIndustry}
                onChange={(e) => setForm((f) => ({ ...f, targetFromIndustry: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                placeholder="e.g. Tech"
              />
            </div>
          </div>
          <h3 className="font-medium text-ink pt-2">Where do you want to be?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Target role</label>
              <input
                type="text"
                value={form.targetToRole}
                onChange={(e) => setForm((f) => ({ ...f, targetToRole: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                placeholder="e.g. Product Manager"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Target industry</label>
              <input
                type="text"
                value={form.targetToIndustry}
                onChange={(e) => setForm((f) => ({ ...f, targetToIndustry: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                placeholder="e.g. Startup"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">Target city</label>
              <input
                type="text"
                value={form.targetCity}
                onChange={(e) => setForm((f) => ({ ...f, targetCity: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                placeholder="e.g. Bangalore"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">When?</label>
            <select
              value={form.targetTimelineMonths}
              onChange={(e) => setForm((f) => ({ ...f, targetTimelineMonths: Number(e.target.value) }))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {TIMELINE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-green text-white px-4 py-2 text-sm font-medium hover:bg-green-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}
