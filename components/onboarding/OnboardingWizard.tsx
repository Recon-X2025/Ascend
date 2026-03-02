"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ProgressBar } from "./ProgressBar";
import { RoleSelectionStep } from "./RoleSelectionStep";
import { JobSeekerStep } from "./JobSeekerStep";
import { RecruiterStep } from "./RecruiterStep";
import { SuccessStep } from "./SuccessStep";
import type { JobSeekerOnboardingInput } from "@/lib/validations/auth";
import type { RecruiterOnboardingInput } from "@/lib/validations/auth";

const TOTAL_STEPS = 3;

export function OnboardingWizard() {
  const { data: session, update: updateSession } = useSession();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<"JOB_SEEKER" | "RECRUITER" | null>(null);
  const [completedName, setCompletedName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleNext = () => {
    if (selectedRole) setStep(2);
  };

  const handleJobSeekerSubmit = async (data: JobSeekerOnboardingInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "JOB_SEEKER", ...data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setCompletedName(data.name);
      await updateSession?.({ onboardingComplete: true, role: "JOB_SEEKER" });
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecruiterSubmit = async (data: RecruiterOnboardingInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "RECRUITER", ...data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setCompletedName(data.name);
      await updateSession?.({ onboardingComplete: true, role: "RECRUITER" });
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <ProgressBar step={step} totalSteps={TOTAL_STEPS} />
      {step === 1 && (
        <div className="ascend-card p-8 space-y-6">
          <RoleSelectionStep selected={selectedRole} onSelect={setSelectedRole} />
          <div className="flex justify-between">
            <span />
            <button
              type="button"
              onClick={handleRoleNext}
              disabled={!selectedRole}
              className="btn-primary"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {step === 2 && selectedRole === "JOB_SEEKER" && (
        <div className="ascend-card p-8 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="btn-ghost self-start"
          >
            ← Back
          </button>
          <JobSeekerStep
            defaultName={session?.user?.name ?? undefined}
            onSubmit={handleJobSeekerSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
      {step === 2 && selectedRole === "RECRUITER" && (
        <div className="ascend-card p-8 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="btn-ghost self-start"
          >
            ← Back
          </button>
          <RecruiterStep
            defaultName={session?.user?.name ?? undefined}
            onSubmit={handleRecruiterSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
      {step === 3 && selectedRole && (
        <div className="ascend-card p-8">
          <SuccessStep name={completedName ?? session?.user?.name ?? undefined} role={selectedRole} />
        </div>
      )}
    </div>
  );
}
