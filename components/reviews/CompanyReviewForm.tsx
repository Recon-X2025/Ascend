"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companyReviewSchema, type CompanyReviewInput } from "@/lib/reviews/validate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarSelector } from "./StarSelector";

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - 20 + i);

interface CompanyReviewFormProps {
  companyId: string;
  companyName: string;
}

export function CompanyReviewForm({ companyId, companyName }: CompanyReviewFormProps) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<CompanyReviewInput>({
    resolver: zodResolver(companyReviewSchema),
    defaultValues: {
      companyId,
      jobTitle: "",
      department: "",
      employmentType: "FULL_TIME",
      employmentStatus: "CURRENT",
      employmentStart: `${CURRENT_YEAR - 2}-01`,
      employmentEnd: null,
      overallRating: 3,
      workLifeBalance: 3,
      culture: 3,
      careerGrowth: 3,
      compensation: 3,
      management: 3,
      headline: "",
      pros: "",
      cons: "",
      advice: "",
      wouldRecommend: true,
      ceoApproval: "NO_OPINION",
    },
  });

  const employmentStatus = form.watch("employmentStatus");

  const onSubmit = async (data: CompanyReviewInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews/company", {
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
          Your review is under moderation and will appear within 48 hours.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-8">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <section>
        <h2 className="text-lg font-medium mb-4">Your employment</h2>
        <div className="space-y-4">
          <div>
            <Label>Company</Label>
            <Input value={companyName} readOnly disabled className="bg-muted" />
          </div>
          <div>
            <Label>Your job title at this company *</Label>
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
              onValueChange={(v) => form.setValue("employmentType", v as CompanyReviewInput["employmentType"])}
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
            <Label>Employment status</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input type="radio" value="CURRENT" {...form.register("employmentStatus")} />
                Currently employed
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="FORMER" {...form.register("employmentStatus")} />
                Former employee
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start date (month/year)</Label>
              <div className="flex gap-2 mt-1">
                <Select
                  value={form.watch("employmentStart")?.slice(5, 7) ?? "01"}
                  onValueChange={(m) => {
                    const start = form.getValues("employmentStart") ?? `${CURRENT_YEAR}-01`;
                    const y = start.slice(0, 4);
                    form.setValue("employmentStart", `${y}-${m}`);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={form.watch("employmentStart")?.slice(0, 4) ?? String(CURRENT_YEAR)}
                  onValueChange={(y) => {
                    const start = form.getValues("employmentStart") ?? `${CURRENT_YEAR}-01`;
                    const m = start.slice(5, 7);
                    form.setValue("employmentStart", `${y}-${m}`);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {employmentStatus === "FORMER" && (
              <div>
                <Label>End date (month/year)</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value={form.watch("employmentEnd")?.slice(5, 7) ?? "01"}
                    onValueChange={(m) => {
                      const end = form.getValues("employmentEnd") ?? `${CURRENT_YEAR}-01`;
                      const y = end.slice(0, 4);
                      form.setValue("employmentEnd", `${y}-${m}`);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={form.watch("employmentEnd")?.slice(0, 4) ?? String(CURRENT_YEAR)}
                    onValueChange={(y) => {
                      const end = form.getValues("employmentEnd") ?? `${CURRENT_YEAR}-01`;
                      const m = end.slice(5, 7);
                      form.setValue("employmentEnd", `${y}-${m}`);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Ratings (all required)</h2>
        <div className="space-y-4">
          {(["overallRating", "workLifeBalance", "culture", "careerGrowth", "compensation", "management"] as const).map((name) => (
            <div key={name}>
              <Label>
                {name === "overallRating"
                  ? "Overall"
                  : name === "workLifeBalance"
                    ? "Work-Life Balance"
                    : name === "culture"
                      ? "Culture & Values"
                      : name === "careerGrowth"
                        ? "Career Growth"
                        : name === "compensation"
                          ? "Compensation & Benefits"
                          : "Management"}
              </Label>
              <StarSelector
                value={form.watch(name)}
                onChange={(v) => form.setValue(name, v)}
                className="mt-2"
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">In your own words</h2>
        <div className="space-y-4">
          <div>
            <Label>Headline (max 80 characters) *</Label>
            <Input
              {...form.register("headline")}
              maxLength={80}
              placeholder="Summarise your experience in one line"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.watch("headline")?.length ?? 0}/80
            </p>
            {form.formState.errors.headline && (
              <p className="text-destructive text-xs">{form.formState.errors.headline.message}</p>
            )}
          </div>
          <div>
            <Label>What are the best things about working here? (50–1500 chars) *</Label>
            <Textarea {...form.register("pros")} rows={4} className="mt-1" />
            {form.formState.errors.pros && (
              <p className="text-destructive text-xs">{form.formState.errors.pros.message}</p>
            )}
          </div>
          <div>
            <Label>What could be improved? (50–1500 chars) *</Label>
            <Textarea {...form.register("cons")} rows={4} className="mt-1" />
            {form.formState.errors.cons && (
              <p className="text-destructive text-xs">{form.formState.errors.cons.message}</p>
            )}
          </div>
          <div>
            <Label>Advice to management (optional, max 1500 chars)</Label>
            <Textarea {...form.register("advice")} rows={3} className="mt-1" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Recommendations</h2>
        <div className="space-y-4">
          <div>
            <Label>Would you recommend this company to a friend?</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.watch("wouldRecommend") === true}
                  onChange={() => form.setValue("wouldRecommend", true)}
                />
                Yes
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.watch("wouldRecommend") === false}
                  onChange={() => form.setValue("wouldRecommend", false)}
                />
                No
              </label>
            </div>
          </div>
          <div>
            <Label>CEO approval</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input type="radio" value="APPROVE" {...form.register("ceoApproval")} />
                Approve
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="DISAPPROVE" {...form.register("ceoApproval")} />
                Disapprove
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="NO_OPINION" {...form.register("ceoApproval")} />
                No opinion
              </label>
            </div>
          </div>
        </div>
      </section>

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit review for moderation"}
      </Button>
    </form>
  );
}
