"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FitScoreBadge } from "@/components/jobs/FitScoreBadge";
import { Loader2, X } from "lucide-react";

interface RecommendedJob {
  id: number;
  title: string;
  slug: string;
  companyName: string;
  companySlug: string | null;
  locations: string[];
  type: string;
  workMode: string;
  fitScore: number;
  matchingSkills: string[];
}

export function RecommendedJobsCard() {
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/jobs/recommended")
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.jobs)) setJobs(j.jobs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = (jobId: number) => {
    setDismissingId(jobId);
    fetch(`/api/jobs/${jobId}/dismiss`, { method: "POST" })
      .then(() => setJobs((prev) => prev.filter((j) => j.id !== jobId)))
      .finally(() => setDismissingId(null));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="font-semibold">Recommended for You</h3>
        <p className="text-sm text-muted-foreground">
          Jobs that match your profile
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 scrollbar-thin">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex-shrink-0 w-64 rounded-lg border bg-card p-3 relative group"
            >
              <button
                type="button"
                className="absolute top-2 right-2 p-1 rounded hover:bg-muted text-muted-foreground"
                onClick={() => handleDismiss(job.id)}
                disabled={dismissingId === job.id}
                title="Not interested"
              >
                <X className="h-4 w-4" />
              </button>
              <Link href={`/jobs/${job.slug}`} className="block">
                <p className="font-medium text-sm line-clamp-2 pr-6">{job.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{job.companyName}</p>
                {job.locations?.length > 0 && (
                  <p className="text-xs text-muted-foreground">{job.locations.slice(0, 2).join(", ")}</p>
                )}
              </Link>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <FitScoreBadge score={job.fitScore} size="sm" />
                {job.matchingSkills?.length > 0 && (
                  <span
                    className="text-xs text-muted-foreground"
                    title={`Matching: ${job.matchingSkills.join(", ")}`}
                  >
                    Why this? {job.matchingSkills.slice(0, 2).join(", ")}
                  </span>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1" asChild>
                  <Link href={`/jobs/${job.slug}/apply`}>Apply</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/jobs/${job.slug}`}>View</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
