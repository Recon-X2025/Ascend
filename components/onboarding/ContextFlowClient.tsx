"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type UserPersona = "ACTIVE_SEEKER" | "PASSIVE_SEEKER" | "EARLY_CAREER" | "RECRUITER";

const CARD_BASE =
  "rounded-[10px] px-5 py-4 cursor-pointer border transition-all duration-150 font-body font-medium text-[0.9rem]";
const CARD_UNSELECTED =
  "bg-[var(--surface)] border-[var(--border)] text-[var(--ink)] hover:border-green/50";
const CARD_SELECTED =
  "border-2 border-green shadow-[0_0_0_3px_rgba(22,163,74,0.10)] bg-[rgba(22,163,74,0.02)] text-[var(--green)]";

function OptionCard({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${CARD_BASE} ${selected ? CARD_SELECTED : CARD_UNSELECTED} text-left`}
    >
      {label}
    </button>
  );
}

function OptionChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${CARD_BASE} ${selected ? CARD_SELECTED : CARD_UNSELECTED}`}
    >
      {label}
    </button>
  );
}

// ─── ACTIVE_SEEKER ─────────────────────────────────────────────────────────
const ACTIVE_EMPLOYMENT_OPTIONS: { label: string; value: string }[] = [
  { label: "Currently employed", value: "EMPLOYED_LOOKING" },
  { label: "Serving notice", value: "NOTICE_PERIOD" },
  { label: "Between jobs", value: "UNEMPLOYED" },
  { label: "Freelancing", value: "FREELANCE" },
];

const ACTIVE_REASON_OPTIONS: { label: string; value: string }[] = [
  { label: "Growth & scope", value: "GROWTH" },
  { label: "Better compensation", value: "COMPENSATION" },
  { label: "Culture issues", value: "CULTURE" },
  { label: "Was laid off", value: "LAYOFF" },
  { label: "Relocating", value: "RELOCATION" },
  { label: "Something else", value: "CURIOSITY" },
];

// ─── PASSIVE_SEEKER ────────────────────────────────────────────────────────
const PASSIVE_TRIGGER_OPTIONS: { label: string; primaryNeed: string; searchReason: string }[] = [
  { label: "Better compensation", primaryNeed: "BENCHMARK_SALARY", searchReason: "COMPENSATION" },
  { label: "Bigger scope", primaryNeed: "FIND_JOBS", searchReason: "GROWTH" },
  { label: "Dream company", primaryNeed: "UNDERSTAND_COMPANIES", searchReason: "GROWTH" },
  { label: "Right team & culture", primaryNeed: "FIND_JOBS", searchReason: "CULTURE" },
  { label: "Not sure yet", primaryNeed: "FIND_JOBS", searchReason: "CURIOSITY" },
];

const PASSIVE_EXPERIENCE_OPTIONS: { label: string; value: string }[] = [
  { label: "0–2 years", value: "EARLY" },
  { label: "3–7 years", value: "MID" },
  { label: "7–12 years", value: "SENIOR" },
  { label: "12+ years", value: "LEADERSHIP" },
];

const LOCATION_CHOICES = [
  "Bangalore",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Remote",
  "Open to relocation",
];

// ─── EARLY_CAREER ─────────────────────────────────────────────────────────
const EARLY_WHERE_OPTIONS: {
  label: string;
  employmentStatus?: string;
  isFirstJob?: boolean;
  experienceBand?: string;
  isSwitchingField?: boolean;
}[] = [
  { label: "Final year student", employmentStatus: "STUDENT", isFirstJob: true },
  { label: "Recent graduate", employmentStatus: "UNEMPLOYED", isFirstJob: true },
  { label: "0–2 years in", employmentStatus: "EMPLOYED_LOOKING", experienceBand: "EARLY" },
  { label: "Switching fields", employmentStatus: "EMPLOYED_LOOKING", isSwitchingField: true },
];

const EARLY_NEED_OPTIONS: { label: string; value: string }[] = [
  { label: "Find a mentor", value: "FIND_MENTOR" },
  { label: "Improve my resume", value: "IMPROVE_RESUME" },
  { label: "Discover companies", value: "UNDERSTAND_COMPANIES" },
  { label: "Get my first job", value: "FIND_JOBS" },
];

// ─── RECRUITER ─────────────────────────────────────────────────────────────
const RECRUITER_ROLE_CHOICES = [
  "Engineering",
  "Product",
  "Design",
  "Data & Analytics",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "HR",
  "Other",
];

const RECRUITER_VOLUME_OPTIONS: { label: string; currentRole: string }[] = [
  { label: "1–5 hires", currentRole: "RECRUITER_1_5" },
  { label: "6–20 hires", currentRole: "RECRUITER_6_20" },
  { label: "20+ hires", currentRole: "RECRUITER_20_PLUS" },
  { label: "Not sure yet", currentRole: "RECRUITER_NOT_SURE" },
];

const RECRUITER_CHALLENGE_OPTIONS: { label: string; value: string }[] = [
  { label: "Candidate quality", value: "FIND_JOBS" },
  { label: "Time to hire", value: "FIND_JOBS" },
  { label: "Pipeline visibility", value: "UNDERSTAND_COMPANIES" },
  { label: "Writing good JDs", value: "IMPROVE_RESUME" },
  { label: "Sourcing candidates", value: "BUILD_NETWORK" },
];

export function ContextFlowClient({ initialPersona }: { initialPersona: UserPersona }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [submitting, setSubmitting] = useState(false);

  // ACTIVE_SEEKER
  const [activeEmployment, setActiveEmployment] = useState<string | null>(null);
  const [activeReason, setActiveReason] = useState<string | null>(null);
  const [activeTargetRole, setActiveTargetRole] = useState("");

  // PASSIVE_SEEKER
  const [passiveTrigger, setPassiveTrigger] = useState<string | null>(null);
  const [passiveExperience, setPassiveExperience] = useState<string | null>(null);
  const [passiveLocations, setPassiveLocations] = useState<string[]>([]);
  const [passiveOpenRelocation, setPassiveOpenRelocation] = useState(false);

  // EARLY_CAREER
  const [earlyWhere, setEarlyWhere] = useState<typeof EARLY_WHERE_OPTIONS[0] | null>(null);
  const [earlyTargetRole, setEarlyTargetRole] = useState("");
  const [earlyNeed, setEarlyNeed] = useState<string | null>(null);

  // RECRUITER
  const [recruiterRoles, setRecruiterRoles] = useState<string[]>([]);
  const [recruiterVolume, setRecruiterVolume] = useState<string | null>(null);
  const [recruiterChallenge, setRecruiterChallenge] = useState<string | null>(null);

  const toggleLocation = (loc: string) => {
    if (loc === "Open to relocation") {
      setPassiveOpenRelocation((v) => !v);
      return;
    }
    setPassiveLocations((prev) =>
      prev.includes(loc) ? prev.filter((x) => x !== loc) : [...prev, loc]
    );
  };

  const toggleRecruiterRole = (role: string) => {
    setRecruiterRoles((prev) =>
      prev.includes(role) ? prev.filter((x) => x !== role) : [...prev, role]
    );
  };

  const isComplete = () => {
    switch (initialPersona) {
      case "ACTIVE_SEEKER":
        return !!activeEmployment && !!activeReason && activeTargetRole.trim().length > 0;
      case "PASSIVE_SEEKER":
        return !!passiveTrigger && !!passiveExperience;
      case "EARLY_CAREER":
        return !!earlyWhere && earlyTargetRole.trim().length > 0 && !!earlyNeed;
      case "RECRUITER":
        return recruiterRoles.length > 0 && !!recruiterVolume && !!recruiterChallenge;
      default:
        return false;
    }
  };

  const buildPayload = (): Record<string, unknown> => {
    switch (initialPersona) {
      case "ACTIVE_SEEKER":
        return {
          employmentStatus: activeEmployment,
          searchReason: activeReason,
          targetRole: activeTargetRole.trim() || null,
        };
      case "PASSIVE_SEEKER":
        return {
          primaryNeed: passiveTrigger ? PASSIVE_TRIGGER_OPTIONS.find((o) => o.label === passiveTrigger)?.primaryNeed : null,
          searchReason: passiveTrigger ? PASSIVE_TRIGGER_OPTIONS.find((o) => o.label === passiveTrigger)?.searchReason : null,
          experienceBand: passiveExperience,
          targetLocations: passiveLocations,
          openToRelocation: passiveOpenRelocation,
        };
      case "EARLY_CAREER": {
        const where = earlyWhere;
        return {
          employmentStatus: where?.employmentStatus ?? null,
          isFirstJob: where?.isFirstJob ?? false,
          experienceBand: where?.experienceBand ?? null,
          isSwitchingField: where?.isSwitchingField ?? false,
          targetRole: earlyTargetRole.trim() || null,
          primaryNeed: earlyNeed,
        };
      }
      case "RECRUITER":
        return {
          targetRole: recruiterRoles.join(", ") || null,
          currentRole: recruiterVolume,
          primaryNeed: recruiterChallenge,
        };
      default:
        return {};
    }
  };

  const handleContinue = async () => {
    if (!isComplete()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/career-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      await updateSession({ onboardingComplete: true });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await fetch("/api/onboarding/skip-context", { method: "POST" });
      await updateSession({ onboardingComplete: true });
      router.push("/dashboard");
      router.refresh();
    } catch {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-12"
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

      <p className="font-body text-green text-sm mt-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
        Step 2 of 2
      </p>
      <div className="w-full max-w-md h-1.5 rounded-full bg-[var(--border)] mt-2 mb-4 overflow-hidden flex">
        <div className="w-1/2 bg-[var(--border)]" />
        <div className="w-1/2 bg-green" />
      </div>

      <h1
        className="font-display font-extrabold text-center"
        style={{ fontSize: "1.75rem", color: "var(--ink)" }}
      >
        {"Help us get this right for you!"}
      </h1>
      <p
        className="font-body text-center mt-2 mb-10"
        style={{ fontSize: "1rem", color: "var(--ink-3)" }}
      >
        This takes 30 seconds and makes everything more relevant.
      </p>

      <div className="w-full max-w-2xl space-y-8">
        {/* ACTIVE_SEEKER */}
        {initialPersona === "ACTIVE_SEEKER" && (
          <>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                What&apos;s your current situation?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {ACTIVE_EMPLOYMENT_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.value}
                    label={o.label}
                    selected={activeEmployment === o.value}
                    onSelect={() => setActiveEmployment(o.value)}
                  />
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                What&apos;s driving the move?
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ACTIVE_REASON_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.value}
                    label={o.label}
                    selected={activeReason === o.value}
                    onSelect={() => setActiveReason(o.value)}
                  />
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                What kind of role are you targeting?
              </h2>
              <input
                type="text"
                placeholder="e.g. Senior Product Manager, Data Scientist…"
                value={activeTargetRole}
                onChange={(e) => setActiveTargetRole(e.target.value)}
                className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 font-body text-[0.9rem] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green"
              />
            </section>
          </>
        )}

        {/* PASSIVE_SEEKER */}
        {initialPersona === "PASSIVE_SEEKER" && (
          <>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                What would make you seriously consider a move?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PASSIVE_TRIGGER_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.label}
                    label={o.label}
                    selected={passiveTrigger === o.label}
                    onSelect={() => setPassiveTrigger(o.label)}
                  />
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                Where are you in your career?
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PASSIVE_EXPERIENCE_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.value}
                    label={o.label}
                    selected={passiveExperience === o.value}
                    onSelect={() => setPassiveExperience(o.value)}
                  />
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                Any locations on your radar?
              </h2>
              <div className="flex flex-wrap gap-2">
                {LOCATION_CHOICES.map((loc) => (
                  <OptionChip
                    key={loc}
                    label={loc}
                    selected={loc === "Open to relocation" ? passiveOpenRelocation : passiveLocations.includes(loc)}
                    onToggle={() => toggleLocation(loc)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* EARLY_CAREER */}
        {initialPersona === "EARLY_CAREER" && (
          <>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                Where are you right now?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EARLY_WHERE_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.label}
                    label={o.label}
                    selected={earlyWhere?.label === o.label}
                    onSelect={() => setEarlyWhere(o)}
                  />
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                What are you aiming for?
              </h2>
              <input
                type="text"
                placeholder="e.g. Product Management, UX Design, Software Engineering…"
                value={earlyTargetRole}
                onChange={(e) => setEarlyTargetRole(e.target.value)}
                className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 font-body text-[0.9rem] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green"
              />
            </section>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                What kind of help matters most right now?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EARLY_NEED_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.value}
                    label={o.label}
                    selected={earlyNeed === o.value}
                    onSelect={() => setEarlyNeed(o.value)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* RECRUITER */}
        {initialPersona === "RECRUITER" && (
          <>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                What roles do you typically hire for?
              </h2>
              <div className="flex flex-wrap gap-2">
                {RECRUITER_ROLE_CHOICES.map((role) => (
                  <OptionChip
                    key={role}
                    label={role}
                    selected={recruiterRoles.includes(role)}
                    onToggle={() => toggleRecruiterRole(role)}
                  />
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                How many hires in the next 3 months?
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {RECRUITER_VOLUME_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.currentRole}
                    label={o.label}
                    selected={recruiterVolume === o.currentRole}
                    onSelect={() => setRecruiterVolume(o.currentRole)}
                  />
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-body font-medium text-ink mb-3 text-[0.95rem]">
                What&apos;s your biggest hiring challenge?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RECRUITER_CHALLENGE_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.value}
                    label={o.label}
                    selected={recruiterChallenge === o.value}
                    onSelect={() => setRecruiterChallenge(o.value)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 w-full max-w-2xl">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!isComplete() || submitting}
          className="font-display font-semibold text-white rounded-lg px-8 py-3.5 min-h-[48px] bg-green hover:bg-[#0f6930] transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
        >
          {submitting ? "Saving…" : "Go to my dashboard →"}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="font-body text-sm text-ink-3 hover:text-ink focus:outline-none"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}
