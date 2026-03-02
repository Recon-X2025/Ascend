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

const schema = z.object({
  jobTitle: z.string().min(1, "Job title required").max(200),
  experienceYears: z.coerce.number().int().min(0).max(70),
  location: z.string().min(1, "Location required").max(200),
  employmentType: z.enum(["full-time", "part-time", "contract", "intern"]),
  baseSalary: z.coerce.number().int().min(0),
  bonus: z.coerce.number().int().min(0).optional().nullable(),
  stockValue: z.coerce.number().int().min(0).optional().nullable(),
  year: z.coerce.number().int().min(2020).max(2030),
});

type FormData = z.infer<typeof schema>;

const currentYear = new Date().getFullYear();

export function SalarySubmitForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      jobTitle: "",
      experienceYears: 0,
      location: "",
      employmentType: "full-time",
      baseSalary: 0,
      bonus: undefined,
      stockValue: undefined,
      year: currentYear,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${slug}/salaries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: data.jobTitle,
          experienceYears: data.experienceYears,
          location: data.location,
          employmentType: data.employmentType,
          baseSalary: data.baseSalary,
          bonus: data.bonus ?? undefined,
          stockValue: data.stockValue ?? undefined,
          year: data.year,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? json.message ?? "Failed to submit");
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
        <Label>Years of experience</Label>
        <Input type="number" {...form.register("experienceYears")} className="mt-1" />
        {form.formState.errors.experienceYears && <p className="text-destructive text-xs mt-1">{form.formState.errors.experienceYears.message}</p>}
      </div>
      <div>
        <Label>Location (city)</Label>
        <Input {...form.register("location")} className="mt-1" placeholder="e.g. Bangalore" />
        {form.formState.errors.location && <p className="text-destructive text-xs mt-1">{form.formState.errors.location.message}</p>}
      </div>
      <div>
        <Label>Employment type</Label>
        <Select value={form.watch("employmentType")} onValueChange={(v) => form.setValue("employmentType", v as FormData["employmentType"])}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full-time">Full-time</SelectItem>
            <SelectItem value="part-time">Part-time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="intern">Internship</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Base salary (INR per annum)</Label>
        <Input type="number" {...form.register("baseSalary")} className="mt-1" />
        {form.formState.errors.baseSalary && <p className="text-destructive text-xs mt-1">{form.formState.errors.baseSalary.message}</p>}
      </div>
      <div>
        <Label>Bonus (INR per annum, optional)</Label>
        <Input type="number" {...form.register("bonus")} className="mt-1" />
      </div>
      <div>
        <Label>Stock value (INR per annum, optional)</Label>
        <Input type="number" {...form.register("stockValue")} className="mt-1" />
      </div>
      <div>
        <Label>Year</Label>
        <Input type="number" {...form.register("year")} className="mt-1" />
        {form.formState.errors.year && <p className="text-destructive text-xs mt-1">{form.formState.errors.year.message}</p>}
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit"}</Button>
    </form>
  );
}
