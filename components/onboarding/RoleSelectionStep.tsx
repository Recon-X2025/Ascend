"use client";

import { Briefcase, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleSelectionStepProps {
  onSelect: (role: "JOB_SEEKER" | "RECRUITER") => void;
  selected: "JOB_SEEKER" | "RECRUITER" | null;
}

export function RoleSelectionStep({ onSelect, selected }: RoleSelectionStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-lg font-medium text-text-primary">
        How will you use Ascend?
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect("JOB_SEEKER")}
          className={cn(
            "ascend-card-hover p-6 text-left flex flex-col items-center justify-center text-center transition-all",
            selected === "JOB_SEEKER" && "border-accent-green shadow-card-active"
          )}
        >
          <Briefcase className="h-10 w-10 text-accent-green mb-2" />
          <h3 className="font-semibold text-text-primary">I&apos;m looking for a job</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Find jobs, build your profile, and get hired.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onSelect("RECRUITER")}
          className={cn(
            "ascend-card-hover p-6 text-left flex flex-col items-center justify-center text-center transition-all",
            selected === "RECRUITER" && "border-accent-green shadow-card-active"
          )}
        >
          <Users className="h-10 w-10 text-accent-green mb-2" />
          <h3 className="font-semibold text-text-primary">I&apos;m hiring / I&apos;m a recruiter</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Post jobs and find the best candidates.
          </p>
        </button>
      </div>
    </div>
  );
}
