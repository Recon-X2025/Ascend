"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SaveJobButton } from "./SaveJobButton";

interface JobDetailSidebarProps {
  jobId: number;
  slug: string;
  easyApply: boolean;
  applicationUrl: string | null;
  viewCount: number;
  applicationCount: number;
}

export function JobDetailSidebar(props: JobDetailSidebarProps) {
  const { jobId, slug, easyApply, applicationUrl, viewCount, applicationCount } = props;
  const [applied, setApplied] = useState<boolean | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/jobs/${jobId}/applied`)
      .then((r) => r.json())
      .then((d) => {
        setApplied(d.applied === true);
        setApplicationStatus(d.status ?? null);
      })
      .catch(() => setApplied(false));
  }, [jobId]);

  const canShowInterviewPrep =
    applied &&
    applicationStatus &&
    ["SHORTLISTED", "INTERVIEW_SCHEDULED"].includes(applicationStatus);

  const copyLink = () => {
    if (typeof window !== "undefined") navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="ascend-card p-4 lg:sticky lg:top-4">
      <div className="hidden lg:flex gap-2 mb-3">
        {applied ? (
          <Button className="flex-1" disabled>
            Applied ✓
          </Button>
        ) : easyApply ? (
          <Button asChild className="flex-1">
            <Link href={"/jobs/" + slug + "/apply"}>Easy Apply</Link>
          </Button>
        ) : applicationUrl ? (
          <Button asChild className="flex-1">
            <a href={applicationUrl} target="_blank" rel="noopener noreferrer">
              Apply on Company Website
            </a>
          </Button>
        ) : null}
        <SaveJobButton jobId={jobId} />
      </div>
      {canShowInterviewPrep && (
        <Button variant="outline" size="sm" className="w-full mt-2" asChild>
          <Link href={`/jobs/${slug}/interview-prep`}>Prepare for Interview</Link>
        </Button>
      )}
      <Button variant="outline" size="sm" className="w-full mt-2" onClick={copyLink}>
        Copy link
      </Button>
      <p className="text-xs text-muted-foreground mt-3">Views: {viewCount}</p>
      {applicationCount > 0 && <p className="text-xs text-muted-foreground">Applicants: {applicationCount}</p>}
    </div>
  );
}
