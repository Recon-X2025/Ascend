"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJobSchema } from "@/lib/validations/job";
import type { z } from "zod";
type CreateJobInput = z.infer<typeof createJobSchema>;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const JOB_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE", "TEMPORARY"] as const;
const WORK_MODES = ["ONSITE", "REMOTE", "HYBRID"] as const;
const EDUCATION_LEVELS = ["ANY", "HIGH_SCHOOL", "DIPLOMA", "BACHELORS", "MASTERS", "PHD"] as const;

interface JobPostFormProps {
  className?: string;
  editId?: number;
  initialData?: Partial<CreateJobInput>;
}

export function JobPostForm({ className, editId, initialData }: JobPostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema) as never,
    defaultValues: {
      title: "",
      companyId: null,
      companyName: "",
      type: "FULL_TIME",
      workMode: "HYBRID",
      locations: [],
      salaryVisible: true,
      salaryCurrency: "INR",
      educationLevel: "ANY",
      openings: 1,
      easyApply: true,
      description: "",
      tags: [],
      status: "DRAFT",
      visibility: "PUBLIC",
      internalFirstDays: null,
      allowAnonymousApply: false,
      skills: [],
      screeningQuestions: [],
      ...initialData,
    },
  });

  const visibility = form.watch("visibility");
  const isInternal = visibility === "INTERNAL";

  const onSubmit = async (data: CreateJobInput, status: "DRAFT" | "ACTIVE") => {
    setLoading(true);
    setError(null);
    const payload = { ...data, status };
    try {
      const url = editId ? `/api/jobs/${editId}` : "/api/jobs";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? json.error ?? "Failed to save");
        return;
      }
      if (json.data?.slug) router.push(`/jobs/${json.data.slug}`);
      else if (editId) router.push("/dashboard/recruiter/jobs");
      else router.push("/dashboard/recruiter/jobs");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={cn("space-y-6", className)}>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div>
        <Label>Job title *</Label>
        <Input {...form.register("title")} placeholder="e.g. Senior Product Manager" className="mt-1 max-w-md" />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div>
        <Label>Company name (if not linked)</Label>
        <Input {...form.register("companyName")} placeholder="Company name" className="mt-1 max-w-md" />
      </div>
      <div>
        <Label>Job type</Label>
        <select
          {...form.register("type")}
          className="mt-1 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Work mode</Label>
        <div className="flex gap-4 mt-1">
          {WORK_MODES.map((w) => (
            <label key={w} className="flex items-center gap-2">
              <input type="radio" {...form.register("workMode")} value={w} />
              {w}
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>Locations (comma-separated)</Label>
        <Input
          placeholder="e.g. Bangalore, Mumbai"
          className="mt-1 max-w-md"
          value={(form.watch("locations") ?? []).join(", ")}
          onChange={(e) => form.setValue("locations", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        />
      </div>
      <div>
        <Label>Openings</Label>
        <Input type="number" min={1} {...form.register("openings", { valueAsNumber: true })} className="mt-1 max-w-xs" />
      </div>
      <div>
        <Label>Job visibility</Label>
        <div className="mt-1 space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" {...form.register("visibility")} value="PUBLIC" />
            Public — visible to all job seekers on Ascend
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" {...form.register("visibility")} value="INTERNAL" />
            Internal — visible only to verified employees of your company
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" {...form.register("visibility")} value="UNLISTED" />
            Unlisted — accessible via direct link only
          </label>
        </div>
      </div>
      {isInternal && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="internalFirst"
              checked={form.watch("internalFirstDays") != null}
              onChange={(e) => form.setValue("internalFirstDays", e.target.checked ? 7 : undefined)}
            />
            <Label htmlFor="internalFirst">Open to internal candidates first</Label>
          </div>
          {form.watch("internalFirstDays") != null && (
            <div className="flex items-center gap-2">
              <Label>Switch to Public after</Label>
              <Input
                type="number"
                min={1}
                max={30}
                className="w-16"
                value={form.watch("internalFirstDays") ?? 7}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  form.setValue("internalFirstDays", Number.isFinite(v) && v >= 1 && v <= 30 ? v : 7);
                }}
              />
              <span>days</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" {...form.register("allowAnonymousApply")} />
            <Label>Allow anonymous applications — applicant name hidden from recruiter until shortlisted</Label>
          </div>
        </>
      )}
      <div>
        <Label>Description * (min 100 characters)</Label>
        <textarea
          {...form.register("description")}
          rows={6}
          className="mt-1 w-full max-w-2xl rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {form.formState.errors.description && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.description.message}</p>
        )}
      </div>
      <div>
        <Label>Experience min (years)</Label>
        <Input type="number" min={0} {...form.register("experienceMin", { valueAsNumber: true, setValueAs: (v) => (v === "" ? undefined : v) })} className="mt-1 max-w-xs" />
      </div>
      <div>
        <Label>Experience max (years)</Label>
        <Input type="number" min={0} {...form.register("experienceMax", { valueAsNumber: true, setValueAs: (v) => (v === "" ? undefined : v) })} className="mt-1 max-w-xs" />
      </div>
      <div>
        <Label>Education level</Label>
        <select
          {...form.register("educationLevel")}
          className="mt-1 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {EDUCATION_LEVELS.map((e) => (
            <option key={e} value={e}>{e.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...form.register("salaryVisible")} />
          Show salary
        </label>
      </div>
      <div className="flex gap-2">
        <Input type="number" min={0} placeholder="Salary min" {...form.register("salaryMin", { valueAsNumber: true, setValueAs: (v) => (v === "" ? undefined : v) })} className="max-w-xs" />
        <Input type="number" min={0} placeholder="Salary max" {...form.register("salaryMax", { valueAsNumber: true, setValueAs: (v) => (v === "" ? undefined : v) })} className="max-w-xs" />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...form.register("easyApply")} />
          Easy Apply (candidates apply via Ascend)
        </label>
      </div>
      {!form.watch("easyApply") && (
        <div>
          <Label>Application URL *</Label>
          <Input {...form.register("applicationUrl")} placeholder="https://..." className="mt-1 max-w-md" />
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={loading}
          onClick={() => form.handleSubmit((d) => onSubmit(d, "DRAFT"))()}
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          disabled={loading}
          onClick={() => form.handleSubmit((d) => onSubmit(d, "ACTIVE"))()}
        >
          Publish
        </Button>
      </div>
    </form>
  );
}
