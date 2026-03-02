"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jobSeekerOnboardingSchema, type JobSeekerOnboardingInput } from "@/lib/validations/auth";

const YEARS_OPTIONS = ["0-1", "1-3", "3-5", "5-10", "10+"];

interface JobSeekerStepProps {
  defaultName?: string;
  onSubmit: (data: JobSeekerOnboardingInput) => void;
  isSubmitting: boolean;
}

export function JobSeekerStep({ defaultName = "", onSubmit, isSubmitting }: JobSeekerStepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobSeekerOnboardingInput>({
    resolver: zodResolver(jobSeekerOnboardingSchema),
    defaultValues: { name: defaultName },
  });
  const yearsValue = watch("yearsOfExperience");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="ascend-label">Full name</label>
        <Input id="name" placeholder="Jane Doe" className="ascend-input" {...register("name")} />
        {errors.name && <p className="ascend-error">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor="headline" className="ascend-label">Current job title / headline</label>
        <Input id="headline" placeholder="e.g. Software Engineer" className="ascend-input" {...register("headline")} />
        {errors.headline && <p className="ascend-error">{errors.headline.message}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor="location" className="ascend-label">Location (city + country)</label>
        <Input id="location" placeholder="e.g. Bangalore, India" className="ascend-input" {...register("location")} />
        {errors.location && <p className="ascend-error">{errors.location.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="ascend-label">Years of experience</label>
        <Select
          value={yearsValue}
          onValueChange={(v) => setValue("yearsOfExperience", v)}
        >
          <SelectTrigger className="ascend-input">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {YEARS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt} years
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.yearsOfExperience && (
          <p className="ascend-error">{errors.yearsOfExperience.message}</p>
        )}
      </div>
      <Button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
