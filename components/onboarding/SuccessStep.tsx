import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessStepProps {
  name?: string | null;
  role: "JOB_SEEKER" | "RECRUITER";
}

export function SuccessStep({ name, role }: SuccessStepProps) {
  const dashboardHref = role === "JOB_SEEKER" ? "/dashboard/seeker" : "/dashboard/recruiter";
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-green text-white">
          <Check className="h-7 w-7" strokeWidth={3} />
        </span>
      </div>
      <h2 className="text-2xl font-semibold text-text-primary">
        You&apos;re all set{name ? `, ${name}` : ""}!
      </h2>
      <p className="text-text-secondary">
        Your Ascend account is ready.
      </p>
      <ul className="list-inside list-disc text-left text-sm text-text-secondary max-w-sm mx-auto">
        {role === "JOB_SEEKER" && (
          <>
            <li>Complete your profile to stand out to recruiters</li>
            <li>Search jobs and save your favourites</li>
            <li>Get matched to roles that fit your skills</li>
          </>
        )}
        {role === "RECRUITER" && (
          <>
            <li>Post jobs and reach qualified candidates</li>
            <li>Search and shortlist talent</li>
            <li>Manage your hiring pipeline</li>
          </>
        )}
      </ul>
      <Link href={dashboardHref}>
        <Button className="btn-primary w-full">Go to your dashboard</Button>
      </Link>
    </div>
  );
}
