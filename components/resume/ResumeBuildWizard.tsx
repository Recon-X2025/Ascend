"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GripVertical, Pencil, Plus } from "lucide-react";
import { CareerIntentStep } from "./CareerIntentStep";
import { ProfileMappingStep } from "./ProfileMappingStep";
import { AIContentStep } from "./AIContentStep";
import { ATSScorePanel } from "./ATSScorePanel";
import { TemplateStep } from "./TemplateStep";
import { ExportStep } from "./ExportStep";
import { useATSScore } from "@/hooks/useATSScore";
import { useResumeBuildStore } from "@/store/resume-build";
import type { CareerIntentInput } from "@/lib/validations/career-intent";

export interface CareerIntentListItem {
  id: string;
  targetRole: string;
  targetIndustry: string;
  targetLevel: CareerIntentInput["targetLevel"];
  careerGoal: string;
  switchingIndustry: boolean;
  fromIndustry: string | null;
  toIndustry: string | null;
}

const STEPS = [
  "Career Intent",
  "Profile Mapping",
  "AI Content",
  "Template",
  "ATS Review",
  "Export",
];

interface ResumeBuildWizardProps {
  initialCareerIntentId?: string | null;
}

export function ResumeBuildWizard({ initialCareerIntentId }: ResumeBuildWizardProps = {}) {
  const [step, setStep] = useState(1);
  const [intents, setIntents] = useState<CareerIntentListItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const careerIntentId = useResumeBuildStore((s) => s.careerIntentId);
  const setCareerIntentId = useResumeBuildStore((s) => s.setCareerIntentId);
  const contentSnapshot = useResumeBuildStore((s) => s.contentSnapshot);
  const atsScoreLoading = useATSScore().isLoading;

  useEffect(() => {
    if (initialCareerIntentId) setCareerIntentId(initialCareerIntentId);
  }, [initialCareerIntentId, setCareerIntentId]);

  const fetchIntents = async () => {
    try {
      const res = await fetch("/api/resume/career-intent");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setIntents(json.data);
    } catch {
      setIntents([]);
    }
  };

  useEffect(() => {
    fetchIntents();
  }, []);

  const handleSaveDraft = async (data: CareerIntentInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/resume/career-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.targetRole ?? json.error ?? "Failed");
      await fetchIntents();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async (data: CareerIntentInput) => {
    setIsSubmitting(true);
    try {
      const url = editingId
        ? `/api/resume/career-intent/${editingId}`
        : "/api/resume/career-intent";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.targetRole ?? json.error ?? "Failed");
      const intentId = json.data?.id ?? editingId ?? null;
      if (intentId) setCareerIntentId(intentId);
      await fetchIntents();
      setEditingId(null);
      setStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultValuesForEdit = editingId
    ? intents.find((i) => i.id === editingId)
    : null;

  const currentIntent = careerIntentId ? intents.find((i) => i.id === careerIntentId) : null;
  const careerIntentForTemplate = currentIntent
    ? {
        targetRole: currentIntent.targetRole,
        targetIndustry: currentIntent.targetIndustry,
        targetLevel: currentIntent.targetLevel,
      }
    : { targetRole: "", targetIndustry: "", targetLevel: "IC" as const };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Resume Builder
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Step {step} of {STEPS.length}: {STEPS[step - 1]}
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              i + 1 === step
                ? "bg-accent-green text-white"
                : i + 1 < step
                  ? "bg-muted text-muted-foreground"
                  : "bg-muted/60 text-muted-foreground"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main content */}
        <div className="flex-1">
          <div className="ascend-card p-6 md:p-8">
            {step === 1 && (
              <CareerIntentStep
                key={editingId ?? "new"}
                defaultValues={
                  defaultValuesForEdit
                    ? {
                        targetRole: defaultValuesForEdit.targetRole,
                        targetIndustry: defaultValuesForEdit.targetIndustry,
                        targetLevel: defaultValuesForEdit.targetLevel,
                        careerGoal: defaultValuesForEdit.careerGoal,
                        switchingIndustry: defaultValuesForEdit.switchingIndustry,
                        fromIndustry: defaultValuesForEdit.fromIndustry,
                        toIndustry: defaultValuesForEdit.toIndustry,
                      }
                    : undefined
                }
                onSaveDraft={handleSaveDraft}
                onContinue={handleContinue}
                isSubmitting={isSubmitting}
              />
            )}
            {step === 2 && (
              careerIntentId ? (
                <ProfileMappingStep
                  careerIntentId={careerIntentId}
                  onBack={() => setStep(1)}
                  onContinue={() => setStep(3)}
                />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No career intent selected. Go back and complete Step 1.</p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-4 text-sm text-accent-green hover:underline"
                  >
                    ← Back to Career Intent
                  </button>
                </div>
              )
            )}
            {step === 3 && careerIntentId && (
              <AIContentStep
                careerIntentId={careerIntentId}
                onBack={() => setStep(2)}
                onContinue={() => setStep(4)}
              />
            )}
            {step === 4 && (
              <TemplateStep
                careerIntent={careerIntentForTemplate}
                onBack={() => setStep(3)}
                onContinue={() => setStep(5)}
              />
            )}
            {step === 5 && (
              <div className="py-8">
                <h2 className="text-lg font-semibold text-text-primary">ATS Review</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review your ATS score and suggested fixes in the panel on the right. When you&apos;re ready, continue to export.
                </p>
                <div className="mt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-sm text-accent-green hover:underline"
                  >
                    ← Back to Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(6)}
                    className="rounded-md bg-accent-green px-4 py-2 text-sm font-medium text-white hover:bg-accent-green/90"
                  >
                    Continue to Export →
                  </button>
                </div>
              </div>
            )}
            {step === 6 && (
              <ExportStep
                careerIntent={careerIntentForTemplate}
                onBack={() => setStep(5)}
              />
            )}
          </div>
        </div>

        {/* Sidebar: Resume versions / existing intents */}
        <aside className="w-full lg:w-72">
          <div className="ascend-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              Resume Versions
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Edit an existing intent or start a new one.
            </p>
            <ul className="mt-4 space-y-2">
              {intents.map((intent) => (
                <li
                  key={intent.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm"
                >
                  <span className="truncate font-medium">
                    {intent.targetRole}
                    {intent.targetIndustry ? ` · ${intent.targetIndustry}` : ""}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(intent.id)}
                      className="rounded p-1 hover:bg-accent"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Start New
            </button>
          </div>
          {step >= 3 && careerIntentId && (
            <ATSScorePanel
              contentSnapshot={contentSnapshot}
              careerIntentId={careerIntentId}
              isLoading={atsScoreLoading}
              targetRole={intents.find((i) => i.id === careerIntentId)?.targetRole ?? ""}
            />
          )}
        </aside>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/dashboard/seeker" className="text-accent-green hover:underline">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
