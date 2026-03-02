"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "SESSION_DID_NOT_HAPPEN", label: "Session did not happen" },
  { value: "BELOW_MINIMUM_DURATION", label: "Session was below minimum duration (15 min)" },
  { value: "STENO_NOT_GENERATED", label: "Steno/transcript was not generated" },
  { value: "OFF_PLATFORM_SOLICITATION", label: "Mentor solicited payment or contact off-platform" },
  { value: "COMMITMENTS_NOT_MET", label: "Mentor did not meet session commitments" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

export function DisputeFilingClient({
  contractId,
  milestoneId,
  milestoneNumber,
  amountPaise,
  engagementUrl,
}: {
  contractId: string;
  milestoneId: string;
  milestoneNumber: number;
  amountPaise: number;
  engagementUrl: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!category || !description.trim() || !confirmChecked) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/mentorship/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          milestoneId,
          category,
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to file dispute");
        return;
      }
      router.push(`/mentorship/engagements/${contractId}/disputes/${data.disputeId}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href={engagementUrl} className="text-sm text-green hover:underline">
        ← Back to engagement
      </Link>
      <h1 className="text-xl font-semibold">
        File dispute — Milestone {milestoneNumber}
      </h1>
      <p className="text-sm text-ink-3">
        ₹{(amountPaise / 100).toLocaleString()} · Tranche held until resolved
      </p>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-medium">Step 1: Choose category</h2>
          <div className="space-y-2">
            {CATEGORIES.map((c) => (
              <label
                key={c.value}
                className="flex items-start gap-2 p-3 rounded-lg border cursor-pointer hover:bg-[var(--surface-2)]"
              >
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  checked={category === c.value}
                  onChange={() => setCategory(c.value)}
                />
                <span className="text-sm">{c.label}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => category && setStep(2)}
            disabled={!category}
            className="px-4 py-2 rounded bg-green text-white disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-medium">Step 2: Describe the issue</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide details that will help us review your dispute..."
            className="w-full min-h-[120px] p-3 rounded border text-sm"
            maxLength={5000}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded border"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={description.trim().length < 20}
              className="px-4 py-2 rounded bg-green text-white disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-medium">Step 3: Confirm and submit</h2>
          <p className="text-sm text-ink-3">
            Category: {CATEGORIES.find((c) => c.value === category)?.label}
          </p>
          <p className="text-sm text-ink-3 line-clamp-2">{description}</p>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
            />
            <span className="text-sm">
              I confirm this dispute is filed in good faith. I understand the tranche will be frozen
              until our team reviews the evidence. I have not waived my dispute rights for this
              category.
            </span>
          </label>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded border"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!confirmChecked || submitting}
              className="px-4 py-2 rounded bg-green text-white disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit dispute"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
