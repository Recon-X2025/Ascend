"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

interface InternalPortalClientProps {
  companySlug: string;
  companyName: string;
  isEmployee: boolean;
}

export function InternalPortalClient({ companySlug, companyName, isEmployee }: InternalPortalClientProps) {
  const [jobs, setJobs] = useState<Array<JobCardData & { visibility?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEmployee) {
      setLoading(false);
      return;
    }
    fetch(`/api/companies/${companySlug}/internal-jobs`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setJobs(data.jobs ?? []);
      })
      .catch(() => setError("Failed to load jobs"))
      .finally(() => setLoading(false));
  }, [companySlug, isEmployee]);

  if (!isEmployee) {
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Internal Job Portal</h1>
        <p className="text-muted-foreground">
          This portal is for verified employees of {companyName} only. If your work email domain is
          registered with {companyName}, log in with that email and you’ll get access automatically.
        </p>
        <Button asChild>
          <Link href="/dashboard/seeker">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Internal Jobs — {companyName}</h1>
        <p className="mt-2 text-destructive">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Internal Jobs — {companyName}</h1>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Internal Jobs — {companyName}</h1>
      <p className="text-muted-foreground">
        Roles open to internal candidates. You can apply to any listed job.
      </p>
      {jobs.length === 0 ? (
        <p className="text-muted-foreground">No internal jobs right now. Check back later.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {jobs.map((job) => (
            <li key={job.id} className="relative">
              {job.visibility === "INTERNAL" && (
                <Badge variant="secondary" className="absolute right-2 top-2 gap-1">
                  <Lock className="h-3 w-3" />
                  Internal Only
                </Badge>
              )}
              <JobCard job={job as JobCardData} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
