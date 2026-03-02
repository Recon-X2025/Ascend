"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { interviewReviewSchema, type InterviewReviewInput } from "@/lib/reviews/validate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CURRENT_YEAR = new Date().getFullYear();

interface InterviewReviewFormProps {
  companyId: string;
  companyName: string;
}

export function InterviewReviewForm({ companyId, companyName }: InterviewReviewFormProps) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<InterviewReviewInput>({
    resolver: zodResolver(interviewReviewSchema),
    defaultValues: {
      companyId,
      jobTitle: "",
      interviewYear: CURRENT_YEAR,
      interviewResult: "PENDING",
      difficulty: "MEDIUM",
      experience: "NEUTRAL",
      overallRating: 3,
      headline: "",
      processDesc: "",
      questions: "",
      tips: "",
      roundCount: null,
      durationWeeks: null,
      applicationId: null,
    },
  });

  const onSubmit = async (data: InterviewReviewInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          questions: data.questions || null,
          tips: data.tips || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? json.error ?? "Failed to submit");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="font-medium">Thank you for sharing your experience.</p>
        <p className="text-muted-foreground mt-1">Your review for {companyName} is under moderation.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-lg border bg-card p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job title</Label>
        <Input id="jobTitle" {...form.register("jobTitle")} placeholder="e.g. Software Engineer" />
        {form.formState.errors.jobTitle && (
          <p className="text-sm text-destructive">{form.formState.errors.jobTitle.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="interviewYear">Interview year</Label>
        <Input
          id="interviewYear"
          type="number"
          {...form.register("interviewYear", { valueAsNumber: true })}
          min={2019}
          max={CURRENT_YEAR}
        />
        {form.formState.errors.interviewYear && (
          <p className="text-sm text-destructive">{form.formState.errors.interviewYear.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Result</Label>
        <Select
          value={form.watch("interviewResult")}
          onValueChange={(v) => form.setValue("interviewResult", v as InterviewReviewInput["interviewResult"])}
        >
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="OFFER">Got offer</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="WITHDREW">Withdrew</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Difficulty</Label>
        <Select
          value={form.watch("difficulty")}
          onValueChange={(v) => form.setValue("difficulty", v as InterviewReviewInput["difficulty"])}
        >
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
            <SelectItem value="VERY_HARD">Very hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Experience</Label>
        <Select
          value={form.watch("experience")}
          onValueChange={(v) => form.setValue("experience", v as InterviewReviewInput["experience"])}
        >
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="POSITIVE">Positive</SelectItem>
            <SelectItem value="NEUTRAL">Neutral</SelectItem>
            <SelectItem value="NEGATIVE">Negative</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="overallRating">Overall rating (1–5)</Label>
        <Input
          id="overallRating"
          type="number"
          min={1}
          max={5}
          {...form.register("overallRating", { valueAsNumber: true })}
        />
        {form.formState.errors.overallRating && (
          <p className="text-sm text-destructive">{form.formState.errors.overallRating.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input id="headline" {...form.register("headline")} placeholder="Short summary" maxLength={80} />
        {form.formState.errors.headline && (
          <p className="text-sm text-destructive">{form.formState.errors.headline.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="processDesc">Process description (50–1500 chars)</Label>
        <Textarea id="processDesc" {...form.register("processDesc")} rows={5} />
        {form.formState.errors.processDesc && (
          <p className="text-sm text-destructive">{form.formState.errors.processDesc.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="questions">Sample questions (optional)</Label>
        <Textarea id="questions" {...form.register("questions")} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tips">Tips (optional)</Label>
        <Textarea id="tips" {...form.register("tips")} rows={3} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Submitting…" : "Submit"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
