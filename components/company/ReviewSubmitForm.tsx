"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const step1Schema = z.object({
  employmentStatus: z.enum(["current", "former"]),
  jobTitle: z.string().min(1).max(200),
  location: z.string().max(200).optional(),
  startYear: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  endYear: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
});
const step2Schema = z.object({
  overallRating: z.number().min(1).max(5),
  workLifeRating: z.number().min(1).max(5).optional().nullable(),
  salaryRating: z.number().min(1).max(5).optional().nullable(),
  cultureRating: z.number().min(1).max(5).optional().nullable(),
  careerRating: z.number().min(1).max(5).optional().nullable(),
  managementRating: z.number().min(1).max(5).optional().nullable(),
});
const step3Schema = z.object({
  pros: z.string().min(50),
  cons: z.string().min(50),
  advice: z.string().max(5000).optional(),
  recommend: z.boolean(),
  ceoApproval: z.boolean().optional().nullable(),
  anonymous: z.boolean().optional(),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type FormData = z.infer<typeof fullSchema>;

export function ReviewSubmitForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(fullSchema) as Resolver<FormData>,
    defaultValues: {
      employmentStatus: "current",
      jobTitle: "",
      location: "",
      startYear: undefined,
      endYear: undefined,
      overallRating: 3,
      workLifeRating: undefined,
      salaryRating: undefined,
      cultureRating: undefined,
      careerRating: undefined,
      managementRating: undefined,
      pros: "",
      cons: "",
      advice: "",
      recommend: true,
      ceoApproval: undefined,
      anonymous: false,
    },
  });

  const next = async () => {
    if (step === 1) {
      const ok = await form.trigger(["employmentStatus", "jobTitle", "location", "startYear", "endYear"]);
      if (ok) setStep(2);
    } else if (step === 2) {
      const ok = await form.trigger(["overallRating", "workLifeRating", "salaryRating", "cultureRating", "careerRating", "managementRating"]);
      if (ok) setStep(3);
    } else if (step === 3) {
      const ok = await form.trigger(["pros", "cons", "advice", "recommend", "ceoApproval", "anonymous"]);
      if (!ok) return;
      setLoading(true);
      setError(null);
      try {
        const data = form.getValues();
        const res = await fetch(`/api/companies/${slug}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employmentStatus: data.employmentStatus,
            jobTitle: data.jobTitle,
            location: data.location || undefined,
            startYear: data.startYear ?? undefined,
            endYear: data.endYear ?? undefined,
            overallRating: data.overallRating,
            workLifeRating: data.workLifeRating ?? undefined,
            salaryRating: data.salaryRating ?? undefined,
            cultureRating: data.cultureRating ?? undefined,
            careerRating: data.careerRating ?? undefined,
            managementRating: data.managementRating ?? undefined,
            pros: data.pros,
            cons: data.cons,
            advice: data.advice ?? undefined,
            recommend: data.recommend,
            ceoApproval: data.ceoApproval ?? undefined,
            anonymous: data.anonymous,
          }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "Failed"); return; }
        setStep(4);
      } catch { setError("Something went wrong"); } finally { setLoading(false); }
    }
  };

  if (step === 4) {
    return (
      <div className="mt-6 p-4 rounded-lg bg-muted">
        <p className="font-medium">Review submitted and pending approval.</p>
        <Button className="mt-4" onClick={() => router.push(`/companies/${slug}/reviews`)}>Back to reviews</Button>
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); next(); }}>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {step === 1 && (
        <>
          <div><Label>Employment</Label><Select value={form.watch("employmentStatus")} onValueChange={(v) => form.setValue("employmentStatus", v as "current" | "former")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="current">Current</SelectItem><SelectItem value="former">Former</SelectItem></SelectContent></Select></div>
          <div><Label>Job title</Label><Input {...form.register("jobTitle")} /></div>
          <div><Label>Location (optional)</Label><Input {...form.register("location")} /></div>
          <div className="grid grid-cols-2 gap-2"><div><Label>Start year</Label><Input type="number" {...form.register("startYear")} /></div><div><Label>End year (if former)</Label><Input type="number" {...form.register("endYear")} /></div></div>
        </>
      )}
      {step === 2 && (
        <>
          <div><Label>Overall rating (1–5) *</Label><div className="flex gap-1 mt-2">{[1,2,3,4,5].map((n) => <Button key={n} type="button" variant={form.watch("overallRating") === n ? "default" : "outline"} size="sm" onClick={() => form.setValue("overallRating", n)}>{n} ★</Button>)}</div></div>
          <div><Label>Work-life (optional)</Label><div className="flex gap-1 mt-1">{[1,2,3,4,5].map((n) => <Button key={n} type="button" variant={form.watch("workLifeRating") === n ? "default" : "outline"} size="sm" onClick={() => form.setValue("workLifeRating", n)}>{n}</Button>)}</div></div>
          <div><Label>Salary (optional)</Label><div className="flex gap-1 mt-1">{[1,2,3,4,5].map((n) => <Button key={n} type="button" variant={form.watch("salaryRating") === n ? "default" : "outline"} size="sm" onClick={() => form.setValue("salaryRating", n)}>{n}</Button>)}</div></div>
          <div><Label>Culture (optional)</Label><div className="flex gap-1 mt-1">{[1,2,3,4,5].map((n) => <Button key={n} type="button" variant={form.watch("cultureRating") === n ? "default" : "outline"} size="sm" onClick={() => form.setValue("cultureRating", n)}>{n}</Button>)}</div></div>
          <div><Label>Career (optional)</Label><div className="flex gap-1 mt-1">{[1,2,3,4,5].map((n) => <Button key={n} type="button" variant={form.watch("careerRating") === n ? "default" : "outline"} size="sm" onClick={() => form.setValue("careerRating", n)}>{n}</Button>)}</div></div>
          <div><Label>Management (optional)</Label><div className="flex gap-1 mt-1">{[1,2,3,4,5].map((n) => <Button key={n} type="button" variant={form.watch("managementRating") === n ? "default" : "outline"} size="sm" onClick={() => form.setValue("managementRating", n)}>{n}</Button>)}</div></div>
        </>
      )}
      {step === 3 && (
        <>
          <div><Label>Pros (min 50 chars) *</Label><textarea className="w-full min-h-[100px] rounded-md border px-3 py-2 text-sm mt-1" {...form.register("pros")} /></div>
          {form.formState.errors.pros && <p className="text-destructive text-xs">{form.formState.errors.pros.message}</p>}
          <div><Label>Cons (min 50 chars) *</Label><textarea className="w-full min-h-[100px] rounded-md border px-3 py-2 text-sm mt-1" {...form.register("cons")} /></div>
          {form.formState.errors.cons && <p className="text-destructive text-xs">{form.formState.errors.cons.message}</p>}
          <div><Label>Advice (optional)</Label><textarea className="w-full min-h-[80px] rounded-md border px-3 py-2 text-sm mt-1" {...form.register("advice")} /></div>
          <div className="flex items-center gap-2"><Checkbox id="rec" checked={form.watch("recommend")} onCheckedChange={(c) => form.setValue("recommend", !!c)} /><Label htmlFor="rec">Recommend to a friend</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="ceo" checked={form.watch("ceoApproval") ?? false} onCheckedChange={(c) => form.setValue("ceoApproval", c === true)} /><Label htmlFor="ceo">Approve of CEO</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="anon" checked={form.watch("anonymous")} onCheckedChange={(c) => form.setValue("anonymous", !!c)} /><Label htmlFor="anon">Post anonymously</Label></div>
        </>
      )}
      <div className="flex gap-2 pt-4">
        {step > 1 && <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>}
        <Button type="submit" disabled={loading}>{step === 3 ? (loading ? "Submitting..." : "Submit") : "Next"}</Button>
      </div>
    </form>
  );
}
