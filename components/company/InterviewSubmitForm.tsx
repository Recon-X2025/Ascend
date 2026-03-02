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

const schema = z.object({
  jobTitle: z.string().min(1).max(200),
  experience: z.enum(["positive", "neutral", "negative"]),
  difficulty: z.number().int().min(1).max(5),
  gotOffer: z.boolean().optional().nullable(),
  process: z.string().min(50),
  questions: z.array(z.string().max(500)).max(10).default([]),
  durationDays: z.number().int().optional().nullable(),
  anonymous: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const DURATION_OPTIONS = [
  { value: 7, label: "< 1 week" },
  { value: 14, label: "1–2 weeks" },
  { value: 28, label: "2–4 weeks" },
  { value: 60, label: "1–2 months" },
  { value: 90, label: "> 2 months" },
];

export function InterviewSubmitForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      jobTitle: "",
      experience: "neutral",
      difficulty: 3,
      gotOffer: undefined,
      process: "",
      questions: [],
      durationDays: undefined,
      anonymous: false,
    },
  });

  const addQuestion = () => {
    if (questions.length >= 10 || !newQuestion.trim()) return;
    const added = newQuestion.trim();
    setNewQuestion("");
    setQuestions((q) => {
      const next = [...q, added];
      form.setValue("questions", next);
      return next;
    });
  };

  const removeQuestion = (i: number) => {
    setQuestions((prev) => {
      const next = prev.filter((_, j) => j !== i);
      form.setValue("questions", next);
      return next;
    });
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${slug}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: data.jobTitle,
          experience: data.experience,
          difficulty: data.difficulty,
          gotOffer: data.gotOffer,
          process: data.process,
          questions: data.questions,
          durationDays: data.durationDays,
          anonymous: data.anonymous,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to submit");
        return;
      }
      router.push(`/companies/${slug}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div>
        <Label>Job title</Label>
        <Input {...form.register("jobTitle")} className="mt-1" />
        {form.formState.errors.jobTitle && <p className="text-destructive text-xs mt-1">{form.formState.errors.jobTitle.message}</p>}
      </div>
      <div>
        <Label>Experience</Label>
        <div className="flex gap-2 mt-2">
          {(["positive", "neutral", "negative"] as const).map((v) => (
            <Button key={v} type="button" variant={form.watch("experience") === v ? "default" : "outline"} size="sm" onClick={() => form.setValue("experience", v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</Button>
          ))}
        </div>
      </div>
      <div>
        <Label>Difficulty (1–5)</Label>
        <div className="flex gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button key={n} type="button" variant={form.watch("difficulty") === n ? "default" : "outline"} size="sm" onClick={() => form.setValue("difficulty", n)}>{n}</Button>
          ))}
        </div>
      </div>
      <div>
        <Label>Got offer?</Label>
        <div className="flex gap-2 mt-2">
          <Button type="button" variant={form.watch("gotOffer") === true ? "default" : "outline"} size="sm" onClick={() => form.setValue("gotOffer", true)}>Yes</Button>
          <Button type="button" variant={form.watch("gotOffer") === false ? "default" : "outline"} size="sm" onClick={() => form.setValue("gotOffer", false)}>No</Button>
          <Button type="button" variant={form.watch("gotOffer") === undefined ? "default" : "outline"} size="sm" onClick={() => form.setValue("gotOffer", undefined)}>Didn&apos;t finish</Button>
        </div>
      </div>
      <div>
        <Label>Process description (min 50 chars)</Label>
        <textarea className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" {...form.register("process")} />
        {form.formState.errors.process && <p className="text-destructive text-xs mt-1">{form.formState.errors.process.message}</p>}
      </div>
      <div>
        <Label>Sample questions (up to 10)</Label>
        <div className="flex gap-2 mt-2">
          <Input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Add a question" />
          <Button type="button" variant="outline" onClick={addQuestion} disabled={questions.length >= 10}>Add</Button>
        </div>
        <ul className="mt-2 space-y-1">
          {questions.map((q, i) => (
            <li key={i} className="flex justify-between text-sm"><span>{q}</span><Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(i)}>Remove</Button></li>
          ))}
        </ul>
      </div>
      <div>
        <Label>Duration</Label>
        <Select value={form.watch("durationDays")?.toString() ?? ""} onValueChange={(v) => form.setValue("durationDays", v ? parseInt(v, 10) : undefined)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="anon" checked={form.watch("anonymous")} onCheckedChange={(c) => form.setValue("anonymous", !!c)} />
        <Label htmlFor="anon">Post anonymously</Label>
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit"}</Button>
    </form>
  );
}
