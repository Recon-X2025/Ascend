"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, User, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { InviteTeammatesCard } from "@/components/growth/InviteTeammatesCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PIPELINE_STYLES: Record<string, string> = {
  SUBMITTED: "bg-blue-500/15 text-blue-400",
  UNDER_REVIEW: "bg-purple-500/15 text-purple-400",
  SHORTLISTED: "bg-amber-500/15 text-amber-400",
  INTERVIEW_SCHEDULED: "bg-indigo-500/15 text-indigo-400",
  OFFERED: "bg-green-500/15 text-green-400",
  REJECTED: "bg-red-500/15 text-red-400",
  WITHDRAWN: "bg-muted text-muted-foreground",
};

function formatStatus(s: string) {
  return s.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export function RecruiterDashboardClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading } = useSWR("/api/dashboard/recruiter", fetcher, {
    refreshInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const activeJobs = data?.activeJobs ?? [];
  const recentApplications = data?.recentApplications ?? [];
  const pipeline = data?.pipeline ?? {};

  const now = mounted ? new Date() : null;
  const sevenDaysFromNow = now ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Recruiter Dashboard</h1>
        <Link
          href="/jobs/post-a-job"
          className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Post a new job
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeJobs.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                No active jobs.{" "}
                <Link href="/jobs/post-a-job" className="text-primary hover:underline">
                  Post a job
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeJobs.map((job: {
                  id: number;
                  title: string;
                  slug: string;
                  deadline: string | null;
                  applications: number;
                }) => {
                  const deadlineSoon =
                    mounted &&
                    now &&
                    sevenDaysFromNow &&
                    job.deadline &&
                    new Date(job.deadline) <= sevenDaysFromNow &&
                    new Date(job.deadline) >= now;
                  const closesLabel = job.deadline
                    ? mounted
                      ? formatDistanceToNow(new Date(job.deadline), { addSuffix: true })
                      : job.deadline.slice(0, 10)
                    : null;
                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between px-6 py-3 hover:bg-muted/30"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/recruiter/jobs/${job.id}/applications`}
                          className="text-sm font-medium hover:text-primary truncate block"
                        >
                          {job.title}
                        </Link>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                          {job.applications} applicant{job.applications !== 1 ? "s" : ""}
                          {closesLabel != null && ` · Closes ${closesLabel}`}
                        </p>
                      </div>
                      {deadlineSoon && (
                        <span className="shrink-0 flex items-center gap-1 text-amber-600 text-xs">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Expiring soon
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(pipeline).map(([status, count]) => (
                <div
                  key={status}
                  className={`rounded-lg px-3 py-2 ${PIPELINE_STYLES[status] ?? "bg-muted"}`}
                >
                  <div className="text-lg font-bold">{count as number}</div>
                  <div className="text-xs opacity-80">{formatStatus(status)}</div>
                </div>
              ))}
              {Object.keys(pipeline).length === 0 && (
                <p className="col-span-2 text-xs text-muted-foreground">
                  No applications yet
                </p>
              )}
            </div>
            <Link
              href="/dashboard/recruiter/jobs"
              className="text-xs text-primary hover:underline mt-3 block"
            >
              View all jobs →
            </Link>
          </CardContent>
        </Card>
      </div>

      <InviteTeammatesCard />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4" /> Recent Applicants
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentApplications.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No applications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentApplications.map((app: {
                id: string;
                status: string;
                createdAt: string;
                user: { name: string | null; image: string | null };
                jobPost: { id: number; title: string; slug: string };
              }) => (
                <Link
                  key={app.id}
                  href={`/dashboard/recruiter/jobs/${app.jobPost.id}/applications`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {app.user?.name ?? "Applicant"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.jobPost.title}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${PIPELINE_STYLES[app.status] ?? ""}`}
                    >
                      {formatStatus(app.status)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground mt-1" suppressHydrationWarning>
                      {mounted
                        ? formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })
                        : app.createdAt.slice(0, 10)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
