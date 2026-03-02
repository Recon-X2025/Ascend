"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WordCountTextarea } from "./WordCountTextarea";

interface ApplicationFormProps {
  mentorProfileId: string;
  matchReason: string;
  mentorFirstName: string;
}

export function ApplicationForm({
  mentorProfileId,
  matchReason,
  mentorFirstName,
}: ApplicationFormProps) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    whyThisMentor: "",
    goalStatement: "",
    commitment: "",
    timeline: "",
    whatAlreadyTried: "",
  });

  const wordCount = (str: string) =>
    str
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

  const valid =
    wordCount(form.whyThisMentor) >= 100 &&
    wordCount(form.whyThisMentor) <= 200 &&
    wordCount(form.goalStatement) >= 50 &&
    wordCount(form.goalStatement) <= 150 &&
    wordCount(form.commitment) >= 50 &&
    wordCount(form.commitment) <= 150 &&
    wordCount(form.timeline) >= 30 &&
    wordCount(form.timeline) <= 100 &&
    wordCount(form.whatAlreadyTried) >= 50 &&
    wordCount(form.whatAlreadyTried) <= 150;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/mentorship/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorProfileId,
          matchReason,
          whyThisMentor: form.whyThisMentor,
          goalStatement: form.goalStatement,
          commitment: form.commitment,
          timeline: form.timeline,
          whatAlreadyTried: form.whatAlreadyTried,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to submit");
        return;
      }
      setSubmitted(true);
      setTimeout(() => router.push("/mentorship/applications"), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="ascend-card p-8 text-center">
        <p className="text-ink">
          Your application has been sent to {mentorFirstName}. They have 5 days to respond.
          We&apos;ll notify you by email.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Redirecting to your applications…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <WordCountTextarea
        label={`Why are you applying to ${mentorFirstName}?`}
        value={form.whyThisMentor}
        onChange={(v) => setForm((f) => ({ ...f, whyThisMentor: v }))}
        minWords={100}
        maxWords={200}
        placeholder="What is it about their specific journey that makes them the right person to guide yours? Be specific — reference their transition, their experience, or their focus areas."
        rows={5}
      />
      <WordCountTextarea
        label="What do you want to achieve in this engagement?"
        value={form.goalStatement}
        onChange={(v) => setForm((f) => ({ ...f, goalStatement: v }))}
        minWords={50}
        maxWords={150}
        placeholder="Be concrete. Not 'get a better job' — what specific transition, skill, or decision do you need to navigate?"
        rows={4}
      />
      <WordCountTextarea
        label="What will you commit to as a mentee?"
        value={form.commitment}
        onChange={(v) => setForm((f) => ({ ...f, commitment: v }))}
        minWords={50}
        maxWords={150}
        placeholder="What will you show up with? Time, preparation, follow-through — what can your mentor count on from you?"
        rows={4}
      />
      <WordCountTextarea
        label="What does your timeline look like?"
        value={form.timeline}
        onChange={(v) => setForm((f) => ({ ...f, timeline: v }))}
        minWords={30}
        maxWords={100}
        placeholder="When do you need to make this move? What's driving the urgency, or what's holding you back?"
        rows={3}
      />
      <WordCountTextarea
        label="What have you already tried?"
        value={form.whatAlreadyTried}
        onChange={(v) => setForm((f) => ({ ...f, whatAlreadyTried: v }))}
        minWords={50}
        maxWords={150}
        placeholder="What approaches, resources, or conversations have you already had? What worked, what didn't?"
        rows={4}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={!valid || loading}
        className="rounded-lg bg-green text-white px-6 py-2.5 text-sm font-medium hover:bg-green-dark disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
