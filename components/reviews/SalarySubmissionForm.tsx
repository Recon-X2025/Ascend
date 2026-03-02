"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { salarySubmissionSchema, type SalarySubmissionInput } from "@/lib/reviews/validate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

interface SalarySubmissionFormProps {
  companyId: string;
  companyName: string;
}

export function SalarySubmissionForm({ companyId, companyName }: SalarySubmissionFormProps) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<SalarySubmissionInput>({
    resolver: zodResolver(salarySubmissionSchema) as Resolver<SalarySubmissionInput>,
    defaultValues: {
      companyId,
      jobTitle: "",
      department: null,
      employmentType: "FULL_TIME",
      location: "",
      yearsExp: 0,
      year: CURRENT_YEAR,
      salaryAmount: 0,
      currency: "INR",
      baseSalary: null,
      bonus: null,
      stocks: null,
    },
  });

  const onSubmit = async (data: SalarySubmissionInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      <div className="mt-6 p-6 rounded-lg border bg-muted/50">
        <p className="font-medium text-primary">Thank you.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your salary data has been submitted and is under moderation.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="space-y-4">
        <div>
          <Label>Company</Label>
          <Input value={companyName} readOnly disabled className="bg-muted" />
        </div>
        <div>
          <Label>Job title *</Label>
          <Input {...form.register("jobTitle")} placeholder="e.g. Software Engineer" />
          {form.formState.errors.jobTitle && (
            <p className="text-destructive text-xs mt-1">{form.formState.errors.jobTitle.message}</p>
          )}
        </div>
        <div>
          <Label>Department (optional)</Label>
          <Input {...form.register("department")} placeholder="e.g. Engineering" />
        </div>
        <div>
          <Label>Employment type</Label>
          <Select
            value={form.watch("employmentType")}
            onValueChange={(v) => form.setValue("employmentType", v as SalarySubmissionInput["employmentType"])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL_TIME">Full-time</SelectItem>
              <SelectItem value="PART_TIME">Part-time</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
              <SelectItem value="INTERNSHIP">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Location / city *</Label>
          <Input {...form.register("location")} placeholder="e.g. Bangalore" />
          {form.formState.errors.location && (
            <p className="text-destructive text-xs mt-1">{form.formState.errors.location.message}</p>
          )}
        </div>
        <div>
          <Label>Total years of experience (at time of this salary)</Label>
          <Input
            type="number"
            min={0}
            max={70}
            {...form.register("yearsExp", { valueAsNumber: true })}
          />
          {form.formState.errors.yearsExp && (
            <p className="text-destructive text-xs mt-1">{form.formState.errors.yearsExp.message}</p>
          )}
        </div>
        <div>
          <Label>Year this salary applies to</Label>
          <Select
            value={String(form.watch("year"))}
            onValueChange={(v) => form.setValue("year", parseInt(v, 10))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Annual CTC (INR) *</Label>
          <Input
            type="number"
            min={1}
            step={1000}
            placeholder="e.g. 1500000"
            {...form.register("salaryAmount", { valueAsNumber: true })}
          />
          {form.formState.errors.salaryAmount && (
            <p className="text-destructive text-xs mt-1">{form.formState.errors.salaryAmount.message}</p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Base salary (optional)</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              {...form.register("baseSalary", {
                setValueAs: (v) => (v === "" || Number.isNaN(Number(v)) ? undefined : Number(v)),
              })}
            />
          </div>
          <div>
            <Label>Bonus (optional)</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              {...form.register("bonus", {
                setValueAs: (v) => (v === "" || Number.isNaN(Number(v)) ? undefined : Number(v)),
              })}
            />
          </div>
          <div>
            <Label>ESOP/RSU value (optional)</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              {...form.register("stocks", {
                setValueAs: (v) => (v === "" || Number.isNaN(Number(v)) ? undefined : Number(v)),
              })}
            />
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Your individual salary will never be displayed. Only aggregated, anonymised data is shown once enough submissions exist.
      </p>

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit anonymously"}
      </Button>
    </form>
  );
}
