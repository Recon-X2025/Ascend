"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MENTOR_TRANSITION_LABELS,
  MENTOR_TRANSITIONS,
  MENTOR_STYLE_LABELS,
  MENTOR_STYLES,
  SESSION_FORMAT_LABELS,
  SESSION_FORMATS,
  MENTOR_FOCUS_LABELS,
  MENTOR_FOCUS_AREAS,
} from "@/lib/mentorship/labels";
import type { MentorTransition, MentorStyle, SessionFormat, MentorFocusArea } from "@prisma/client";

const CARD =
  "rounded-[10px] px-4 py-3 cursor-pointer border transition-all duration-150 font-body text-sm bg-[var(--surface)] border-[var(--border)] text-[var(--ink)] hover:border-green/50";
const CARD_SELECTED =
  "border-2 border-green shadow-[0_0_0_3px_rgba(22,163,74,0.10)] bg-[rgba(22,163,74,0.02)] text-[var(--green)]";

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function BecomeMentorClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [transitionType, setTransitionType] = useState<MentorTransition | "">("");
  const [currentRole, setCurrentRole] = useState("");
  const [previousRole, setPreviousRole] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(5);

  const [mentoringStyles, setMentoringStyles] = useState<MentorStyle[]>([]);
  const [sessionFormats, setSessionFormats] = useState<SessionFormat[]>([]);
  const [focusAreas, setFocusAreas] = useState<MentorFocusArea[]>([]);
  const [maxMenteesPerMonth, setMaxMenteesPerMonth] = useState(3);
  const [agreedToList, setAgreedToList] = useState(false);

  const [availability, setAvailability] = useState<
    { dayOfWeek: number; startTime: string; endTime: string; timezone: string }[]
  >([]);

  const toggleStyle = (s: MentorStyle) => {
    setMentoringStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };
  const toggleFormat = (f: SessionFormat) => {
    setSessionFormats((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };
  const toggleFocus = (f: MentorFocusArea) => {
    setFocusAreas((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const addAvailability = () => {
    setAvailability((prev) => [...prev, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", timezone: "Asia/Kolkata" }]);
  };
  const updateAvailability = (i: number, field: string, value: string | number) => {
    setAvailability((prev) => {
      const next = [...prev];
      (next[i] as Record<string, string | number>)[field] = value;
      return next;
    });
  };
  const removeAvailability = (i: number) => {
    setAvailability((prev) => prev.filter((_, idx) => idx !== i));
  };

  const canStep2 = currentRole.trim() && yearsOfExperience >= 0;
  const canStep3 = mentoringStyles.length > 0 && sessionFormats.length > 0 && focusAreas.length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/mentorship/become-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreedToList,
          currentRole: currentRole.trim(),
          previousRole: previousRole.trim() || undefined,
          transitionType: transitionType || undefined,
          yearsOfExperience,
          mentoringStyles,
          sessionFormats,
          focusAreas,
          maxMenteesPerMonth,
          availability,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 && data.redirectTo) {
          router.push(data.redirectTo);
          return;
        }
        throw new Error(data.error ?? "Failed");
      }
      router.push("/mentorship/dashboard");
      router.refresh();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/mentorship" className="text-green font-body text-sm hover:underline">
          ← Back to Mentorship
        </Link>
        <h1 className="font-display font-extrabold text-2xl text-ink mt-4">
          Become a mentor
        </h1>
        <p className="font-body text-ink-3 mt-1">
          Share your transition story and help others.
        </p>

        <div className="mt-8 flex gap-2">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                step === s ? "bg-green text-white" : "bg-[var(--surface)] border border-[var(--border)] text-ink-3"
              }`}
            >
              Step {s}
            </button>
          ))}
        </div>

        {step === 1 && (
          <div className="mt-8 space-y-6">
            <div>
              <label className="block font-body font-medium text-ink mb-2">
                What transition have you made?
              </label>
              <select
                value={transitionType}
                onChange={(e) => setTransitionType(e.target.value as MentorTransition)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-body text-ink"
              >
                <option value="">Select</option>
                {MENTOR_TRANSITIONS.map((t) => (
                  <option key={t} value={t}>
                    {MENTOR_TRANSITION_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body font-medium text-ink mb-2">
                Current role *
              </label>
              <input
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="e.g. Engineering Manager"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-body text-ink"
              />
            </div>
            <div>
              <label className="block font-body font-medium text-ink mb-2">
                Role you transitioned from (optional)
              </label>
              <input
                type="text"
                value={previousRole}
                onChange={(e) => setPreviousRole(e.target.value)}
                placeholder="e.g. Senior Engineer"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-body text-ink"
              />
            </div>
            <div>
              <label className="block font-body font-medium text-ink mb-2">
                Years of experience
              </label>
              <input
                type="number"
                min={0}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-body text-ink"
              />
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canStep2}
              className="btn-primary px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 space-y-6">
            <div>
              <label className="block font-body font-medium text-ink mb-2">
                How do you prefer to mentor?
              </label>
              <div className="flex flex-wrap gap-2">
                {MENTOR_STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStyle(s)}
                    className={mentoringStyles.includes(s) ? `${CARD} ${CARD_SELECTED}` : CARD}
                  >
                    {MENTOR_STYLE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-body font-medium text-ink mb-2">
                Session formats
              </label>
              <div className="flex flex-wrap gap-2">
                {SESSION_FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFormat(f)}
                    className={sessionFormats.includes(f) ? `${CARD} ${CARD_SELECTED}` : CARD}
                  >
                    {SESSION_FORMAT_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-body font-medium text-ink mb-2">
                Focus areas
              </label>
              <div className="flex flex-wrap gap-2">
                {MENTOR_FOCUS_AREAS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFocus(f)}
                    className={focusAreas.includes(f) ? `${CARD} ${CARD_SELECTED}` : CARD}
                  >
                    {MENTOR_FOCUS_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-body font-medium text-ink mb-2">
                Max mentees per month
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxMenteesPerMonth(n)}
                    className={`w-12 h-12 rounded-lg font-medium ${
                      maxMenteesPerMonth === n ? "bg-green text-white" : "bg-[var(--surface)] border border-[var(--border)]"
                    }`}
                  >
                    {n}+
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToList}
                  onChange={(e) => setAgreedToList(e.target.checked)}
                  className="rounded"
                />
                <span className="font-body text-sm">I want to list my profile in the marketplace (requires subscription)</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-lg border border-[var(--border)] font-medium"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canStep3}
                className="btn-primary px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8 space-y-6">
            <div>
              <label className="block font-body font-medium text-ink mb-2">
                When are you generally available?
              </label>
              {availability.map((a, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 mb-2">
                  <select
                    value={a.dayOfWeek}
                    onChange={(e) => updateAvailability(i, "dayOfWeek", parseInt(e.target.value, 10))}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  >
                    {DAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={a.startTime}
                    onChange={(e) => updateAvailability(i, "startTime", e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                  <span className="text-ink-3">–</span>
                  <input
                    type="time"
                    value={a.endTime}
                    onChange={(e) => updateAvailability(i, "endTime", e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeAvailability(i)}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addAvailability}
                className="mt-2 text-green font-body text-sm hover:underline"
              >
                + Add slot
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-lg border border-[var(--border)] font-medium"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Complete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
