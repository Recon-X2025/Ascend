"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProfileCompletionCard } from "./ProfileCompletionCard";
import { ApplicationStatsCard } from "./ApplicationStatsCard";
import { RecentApplicationsList } from "./RecentApplicationsList";
import { SavedJobsCard } from "./SavedJobsCard";
import { AlertsCard } from "./AlertsCard";
import { OptimisedResumesCard } from "./OptimisedResumesCard";
import { NetworkCard } from "./NetworkCard";
import { FeedPreview } from "./FeedPreview";
import { MentorMatchCard } from "./MentorMatchCard";
import { MentorshipWidget } from "./MentorshipWidget";
import { AddReviewPromptCard } from "./AddReviewPromptCard";
import { InternalPortalNudgeCard } from "./InternalPortalNudgeCard";
import { ProfileOptimiserCard } from "./ProfileOptimiserCard";
import { RecommendedJobsCard } from "./RecommendedJobsCard";

const DASHBOARD_FETCH_TIMEOUT_MS = 15000;

const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DASHBOARD_FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const json = await r.json();
    if (!r.ok) throw new Error(json?.error ?? "Failed to load dashboard");
    return json;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error) {
      if (e.name === "AbortError") throw new Error("Request timed out. Please try again.");
      throw e;
    }
    throw new Error("Failed to load dashboard");
  }
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function SeekerDashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-muted rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-40 bg-muted rounded-xl" />
        <div className="md:col-span-2 h-40 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 bg-muted rounded-xl" />
        <div className="space-y-4">
          <div className="h-36 bg-muted rounded-xl" />
          <div className="h-36 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}

const SUBHEADING_BY_PERSONA: Record<string, string> = {
  ACTIVE_SEEKER: "Here's what's happening with your job search.",
  PASSIVE_SEEKER: "Here's what's on your radar.",
  EARLY_CAREER: "Here's where you're at.",
  RECRUITER: "Here's your hiring pipeline.",
};

export function SeekerDashboardClient() {
  const { data: session } = useSession();
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard/seeker", fetcher, {
    refreshInterval: 60000,
  });
  const [timeGreeting, setTimeGreeting] = useState<string>("");
  useEffect(() => setTimeGreeting(getTimeOfDay()), []);

  if (error) {
    const isUnauth = error?.message?.toLowerCase().includes("unauthorised");
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">
            {isUnauth ? "Session expired or invalid. Please sign in again." : "Unable to load your dashboard."}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {isUnauth ? (
              <Link
                href="/auth/login?callbackUrl=/dashboard/seeker"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                Sign in
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => mutate()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <SeekerDashboardSkeleton />;

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const greeting = timeGreeting ? `Good ${timeGreeting}, ${firstName}` : `Hello, ${firstName}`;
  const subheading =
    SUBHEADING_BY_PERSONA[session?.user?.persona ?? ""] ?? "Here's what's happening.";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" suppressHydrationWarning>
            {greeting}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {subheading}
          </p>
        </div>
        <Link
          href="/jobs"
          className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Browse Jobs
        </Link>
      </div>

      <ErrorBoundary>
        <RecommendedJobsCard />
      </ErrorBoundary>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ErrorBoundary>
          <ProfileCompletionCard
            completionScore={data?.profile?.completionScore ?? 0}
            profileViews={data?.profile?.profileViews ?? 0}
            headline={data?.profile?.headline}
          />
        </ErrorBoundary>
        <div className="md:col-span-2">
          <ErrorBoundary>
            <ApplicationStatsCard stats={data?.applications?.stats} />
          </ErrorBoundary>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <RecentApplicationsList
              applications={data?.applications?.recent ?? []}
            />
          </ErrorBoundary>
        </div>
        <div className="space-y-4">
          {data?.employeePortals?.length ? (
            <ErrorBoundary>
              <InternalPortalNudgeCard portals={data.employeePortals} />
            </ErrorBoundary>
          ) : null}
          {data?.companiesForReviewPrompt?.length ? (
            <ErrorBoundary>
              <AddReviewPromptCard companies={data.companiesForReviewPrompt} />
            </ErrorBoundary>
          ) : null}
          <ErrorBoundary>
            <MentorshipWidget />
          </ErrorBoundary>
          {data?.hasMentorMatch && (
            <ErrorBoundary>
              <MentorMatchCard />
            </ErrorBoundary>
          )}
          <ErrorBoundary>
            <ProfileOptimiserCard />
          </ErrorBoundary>
          <ErrorBoundary>
            <NetworkCard />
          </ErrorBoundary>
          <ErrorBoundary>
            <FeedPreview />
          </ErrorBoundary>
          <ErrorBoundary>
            <SavedJobsCard jobs={data?.savedJobs ?? []} />
          </ErrorBoundary>
          <ErrorBoundary>
            <AlertsCard alerts={data?.alerts ?? []} />
          </ErrorBoundary>
        </div>
      </div>

      {data?.optimisedResumes?.length > 0 && (
        <ErrorBoundary>
          <OptimisedResumesCard resumes={data.optimisedResumes} />
        </ErrorBoundary>
      )}
    </div>
  );
}
