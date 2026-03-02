"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FitScoreBadge } from "@/components/jobs/FitScoreBadge";
import { buildApplySchema, type ApplyFormValues } from "@/lib/validations/application";

interface ScreeningQuestion {
  id: string;
  question: string;
  type: string;
  options: string[];
  required: boolean;
  order: number;
}

interface ApplyFormProps {
  jobId: number;
  jobSlug: string;
  jobTitle: string;
  companyName: string;
  screeningQuestions: ScreeningQuestion[];
  profile: {
    name: string;
    currentRole: string | null;
    location: string | null;
    yearsExperience: number | null;
    completionScore: number;
  };
}

export function ApplyForm({
  jobId,
  jobSlug,
  jobTitle,
  companyName,
  screeningQuestions,
  profile,
}: ApplyFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [resumeVersions, setResumeVersions] = useState<{ id: string; name: string; status: string }[]>([]);
  const [fitScore, setFitScore] = useState<number | null>(null);
  const [coverLetterGenerated, setCoverLetterGenerated] = useState<{ id: string; content: string } | null>(null);
  const [coverLetterGenerating, setCoverLetterGenerating] = useState(false);
  const [includeGeneratedCoverLetter, setIncludeGeneratedCoverLetter] = useState(false);
  const requiredIds = screeningQuestions.filter((q) => q.required).map((q) => q.id);
  const schema = buildApplySchema(requiredIds);

  const defaultResponses = screeningQuestions.map((q) => ({
    questionId: q.id,
    question: q.question,
    type: q.type as "TEXT" | "YES_NO" | "MULTIPLE_CHOICE",
    answer: "",
  }));

  const form = useForm<ApplyFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      resumeVersionId: null,
      coverLetter: "",
      coverLetterId: null,
      responses: defaultResponses,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = form;
  const resumeVersionId = watch("resumeVersionId");
  const coverLetter = watch("coverLetter");

  useEffect(() => {
    fetch("/api/resume/versions")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) {
          const complete = j.data.filter((v: { status: string }) => v.status === "COMPLETE");
          setResumeVersions(complete.map((v: { id: string; name: string; status: string }) => ({ id: v.id, name: v.name, status: v.status })));
          if (complete.length > 0 && !resumeVersionId) {
            const defaultVersion = complete.find((v: { isDefault: boolean }) => v.isDefault) ?? complete[0];
            setValue("resumeVersionId", defaultVersion.id);
          }
        }
      })
      .catch(() => {});
  }, [setValue, resumeVersionId]);

  useEffect(() => {
    fetch(`/api/jobs/${jobId}/fit-score`)
      .then((r) => r.json())
      .then((j) => {
        if (j.overallScore != null) setFitScore(j.overallScore);
      })
      .catch(() => {});
  }, [jobId]);

  useEffect(() => {
    fetch(`/api/ai/cover-letter/${jobId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.coverLetter?.id && j.coverLetter?.content) {
          setCoverLetterGenerated({ id: j.coverLetter.id, content: j.coverLetter.content });
          setValue("coverLetter", j.coverLetter.content);
        }
      })
      .catch(() => {});
  }, [jobId, setValue]);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "APPLY_FLOW_STARTED",
        entityId: String(jobId),
        entityType: "JobPost",
        metadata: { jobPostId: jobId },
      }),
    }).catch(() => {});
  }, [jobId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (step === 1 || step === 2) {
        const payload = JSON.stringify({
          eventType: "APPLY_FLOW_ABANDONED",
          entityId: String(jobId),
          entityType: "JobPost",
          metadata: { jobPostId: jobId, lastStep: step },
        });
        navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [jobId, step]);

  const onStep1Next = () => setStep(screeningQuestions.length > 0 ? 2 : 3);
  const onStep2Back = () => setStep(1);
  const onStep2Next = () => form.trigger("responses").then((ok) => ok && setStep(3));
  const onStep3Back = () => setStep(screeningQuestions.length > 0 ? 2 : 1);

  const handleGenerateCoverLetter = async () => {
    setCoverLetterGenerating(true);
    try {
      const r = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, resumeVersionId: resumeVersionId || null }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to start");
      const poll = async () => {
        const res = await fetch(`/api/ai/cover-letter/${jobId}`);
        const data = await res.json();
        if (data.coverLetter?.id && data.coverLetter?.content) {
          setCoverLetterGenerated({ id: data.coverLetter.id, content: data.coverLetter.content });
          setValue("coverLetter", data.coverLetter.content);
          setCoverLetterGenerating(false);
          return;
        }
        setTimeout(poll, 2000);
      };
      setTimeout(poll, 3000);
    } catch {
      setCoverLetterGenerating(false);
    }
  };

  const onSubmit = async (data: ApplyFormValues) => {
    const res = await fetch(`/api/jobs/${jobId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeVersionId: data.resumeVersionId || null,
        coverLetter: data.coverLetter?.trim() || null,
        coverLetterId: includeGeneratedCoverLetter && coverLetterGenerated?.id ? coverLetterGenerated.id : null,
        responses: (data.responses ?? []).filter((r) => r.answer.trim().length > 0),
      }),
    });
    const json = await res.json();
    if (res.ok) {
      router.push("/dashboard/seeker/applications");
      router.refresh();
      return;
    }
    form.setError("root", { message: json.error ?? "Failed to submit" });
  };

  const totalSteps = screeningQuestions.length > 0 ? 3 : 2;
  const currentStep = screeningQuestions.length === 0 && step === 2 ? 3 : step;

  return (
    <Card className="mt-6 max-w-2xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <>
            <div>
              <h2 className="font-medium mb-2">Review your application</h2>
              <div className="rounded border border-border bg-muted/30 p-3 text-sm space-y-1">
                <p><strong>{profile.name}</strong></p>
                {profile.currentRole && <p>{profile.currentRole}</p>}
                {profile.location && <p>{profile.location}</p>}
                {profile.yearsExperience != null && <p>{profile.yearsExperience} years of experience</p>}
              </div>
              {profile.completionScore < 60 && (
                <p className="text-amber-600 text-sm mt-2">
                  Your profile is incomplete. A complete profile increases your chances.{" "}
                  <Link href="/profile/edit" className="underline">Complete Profile →</Link>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {fitScore != null && (
                <>
                  <FitScoreBadge score={fitScore} size="md" />
                  <span className="text-sm text-muted-foreground">Your fit score for this role is {fitScore}/100</span>
                </>
              )}
              <Link href={`/jobs/${jobSlug}/optimise`} className="text-sm text-primary hover:underline">
                Optimise Resume for this Job →
              </Link>
            </div>
            <div>
              <Label>Resume</Label>
              <select
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={resumeVersionId ?? ""}
                onChange={(e) => setValue("resumeVersionId", e.target.value || null)}
              >
                <option value="">Use my Ascend profile (no specific resume)</option>
                {resumeVersions.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Add a cover letter (optional)</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={coverLetterGenerating}
                  onClick={handleGenerateCoverLetter}
                >
                  {coverLetterGenerating ? "Generating…" : "Generate Cover Letter"}
                </Button>
                {coverLetterGenerated && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(coverLetterGenerated.content);
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([coverLetterGenerated.content], { type: "text/plain" });
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = "cover-letter.txt";
                        a.click();
                      }}
                    >
                      Download .txt
                    </Button>
                  </>
                )}
              </div>
              <textarea
                className="mt-2 w-full min-h-[120px] rounded border border-input bg-background px-3 py-2 text-sm"
                maxLength={2000}
                {...register("coverLetter")}
              />
              <p className="text-xs text-muted-foreground mt-1">{(coverLetter?.length ?? 0)}/2000</p>
              {coverLetterGenerated && (
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeGeneratedCoverLetter}
                    onChange={(e) => setIncludeGeneratedCoverLetter(e.target.checked)}
                  />
                  Include this cover letter with my application
                </label>
              )}
            </div>
            <Button type="button" onClick={onStep1Next}>Next →</Button>
          </>
        )}

        {step === 2 && screeningQuestions.length > 0 && (
          <>
            <h2 className="font-medium">Screening questions</h2>
            <div className="space-y-4">
              {screeningQuestions.map((q, idx) => (
                <div key={q.id}>
                  <Label className="flex gap-1">
                    {q.question}
                    {q.required && <span className="text-destructive">*</span>}
                  </Label>
                  {q.type === "TEXT" && (
                    <textarea
                      className="mt-1 w-full min-h-[80px] rounded border border-input bg-background px-3 py-2 text-sm"
                      {...register(`responses.${idx}.answer` as const)}
                    />
                  )}
                  {(q.type === "YES_NO" || q.type === "MULTIPLE_CHOICE") && (
                    <div className="mt-2 space-y-2">
                      {(q.type === "YES_NO" ? ["Yes", "No"] : q.options).map((opt) => (
                        <label key={opt} className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={opt}
                            {...register(`responses.${idx}.answer` as const)}
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {errors.responses?.[idx]?.answer && (
                    <p className="text-sm text-destructive mt-1">{errors.responses[idx]?.answer?.message}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onStep2Back}>← Back</Button>
              <Button type="button" onClick={onStep2Next}>Next →</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="font-medium">Review & submit</h2>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Job: {jobTitle} at {companyName}</li>
              <li>Resume: {resumeVersionId ? resumeVersions.find((v) => v.id === resumeVersionId)?.name ?? "Selected" : "Ascend profile"}</li>
              {coverLetter?.trim() && (
                <li>Cover letter: {coverLetter.trim().slice(0, 200)}{coverLetter.length > 200 ? "…" : ""}</li>
              )}
              <li>{screeningQuestions.length} screening question(s) answered</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              By submitting, you confirm this application is accurate and complete.
            </p>
            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onStep3Back}>← Back</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting…" : "Submit Application"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
