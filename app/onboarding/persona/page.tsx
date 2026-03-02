"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

const REFERRAL_MAP: Record<string, "ACTIVE_SEEKER" | "PASSIVE_SEEKER" | "EARLY_CAREER" | "RECRUITER"> = {
  "fit-score": "ACTIVE_SEEKER",
  "resume-optimiser": "ACTIVE_SEEKER",
  "salary-intelligence": "PASSIVE_SEEKER",
  "career-graph": "PASSIVE_SEEKER",
  mentorship: "EARLY_CAREER",
};

type UserPersona = "ACTIVE_SEEKER" | "PASSIVE_SEEKER" | "EARLY_CAREER" | "RECRUITER";

const PERSONAS: { value: UserPersona; icon: string; label: string; description: string }[] = [
  {
    value: "ACTIVE_SEEKER",
    icon: "→",
    label: "Actively looking",
    description: "I'm job hunting now and want to move fast.",
  },
  {
    value: "PASSIVE_SEEKER",
    icon: "◎",
    label: "Open to opportunities",
    description: "I'm not urgently searching but I'm open to the right role.",
  },
  {
    value: "EARLY_CAREER",
    icon: "↑",
    label: "Early in my career",
    description: "I'm exploring my path, building my profile, and finding direction.",
  },
  {
    value: "RECRUITER",
    icon: "✦",
    label: "I hire people",
    description: "I'm looking for candidates and managing a hiring pipeline.",
  },
];

function PersonaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const [selected, setSelected] = useState<UserPersona | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login?callbackUrl=/onboarding/persona");
      return;
    }
    const fromParam = searchParams.get("from");
    const preselected = fromParam ? REFERRAL_MAP[fromParam] : null;
    if (preselected) setSelected(preselected);
  }, [status, router, searchParams]);

  useEffect(() => {
    if (session?.user?.persona) {
      router.replace("/onboarding/context");
    }
  }, [session?.user?.persona, router]);

  const handleContinue = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/persona", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      await update({ persona: selected });
      router.push("/onboarding/context");
      router.refresh();
    } catch {
      setSubmitting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="h-8 w-8 rounded-full border-2 border-green border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <Link
        href="/"
        className="absolute top-6 left-6 flex flex-col font-display font-extrabold text-[1.15rem] text-ink tracking-wide"
      >
        <span>Ascend</span>
        <span className="font-body text-[0.58rem] font-normal tracking-[0.2em] uppercase text-ink-4">
          A Coheron Product
        </span>
      </Link>

      <h1
        className="font-display font-extrabold text-center mt-4"
        style={{ fontSize: "2rem", color: "var(--ink)" }}
      >
        What brings you to Ascend?
      </h1>
      <p
        className="font-body text-center mt-2 mb-12 max-w-md"
        style={{ fontSize: "1rem", color: "var(--ink-3)" }}
      >
        We&apos;ll personalise your experience based on where you are in your career.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {PERSONAS.map((p) => {
          const isSelected = selected === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => setSelected(p.value)}
              className={`text-left rounded-[14px] p-7 transition-all duration-150 cursor-pointer border-2 min-h-[140px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 ${
                isSelected
                  ? "bg-[rgba(22,163,74,0.06)] border-green shadow-[0_0_0_3px_rgba(22,163,74,0.12)]"
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-green/50 hover:bg-[var(--surface-2)]"
              }`}
            >
              <span
                className="font-body font-medium block mb-2 text-green"
                style={{ fontSize: "1.25rem" }}
              >
                {p.icon}
              </span>
              <span className="font-display font-semibold block text-ink" style={{ fontSize: "1rem" }}>
                {p.label}
              </span>
              <p className="font-body text-ink-3 mt-1 text-sm leading-relaxed">{p.description}</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!selected || submitting}
        className="font-display font-semibold text-white rounded-lg mt-10 px-8 py-3.5 min-h-[48px] bg-green hover:bg-[#0f6930] transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
      >
        {submitting ? "Saving…" : "Continue →"}
      </button>
    </div>
  );
}

export default function PersonaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
          <div className="h-8 w-8 rounded-full border-2 border-green border-t-transparent animate-spin" />
        </div>
      }
    >
      <PersonaContent />
    </Suspense>
  );
}
