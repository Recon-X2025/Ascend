"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OptimiseResumeButton } from "@/components/resume/OptimiseResumeButton";

interface JobDetailStickyCTAProps {
  jobId: number;
  slug: string;
  jobTitle: string;
  easyApply: boolean;
  applicationUrl: string | null;
  isActive: boolean;
}

export function JobDetailStickyCTA({
  jobId,
  slug,
  jobTitle,
  easyApply,
  applicationUrl,
  isActive,
}: JobDetailStickyCTAProps) {
  const [applied, setApplied] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`/api/jobs/${jobId}/applied`)
      .then((r) => r.json())
      .then((d) => setApplied(d.applied === true))
      .catch(() => setApplied(false));
  }, [jobId]);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 lg:hidden p-4 bg-background/95 backdrop-blur-sm border-t border-border z-30">
      <div className="max-w-6xl mx-auto px-4 flex gap-3">
        <div className="flex-1 min-w-0 [&_button]:w-full [&_button]:min-h-[44px]">
          <OptimiseResumeButton jobPostId={jobId} jobTitle={jobTitle} />
        </div>
        {applied ? (
          <Button className="flex-1 min-h-[44px]" disabled>
            Applied ✓
          </Button>
        ) : easyApply ? (
          <Button asChild className="flex-1 min-h-[44px]">
            <Link href={"/jobs/" + slug + "/apply"}>Apply</Link>
          </Button>
        ) : applicationUrl ? (
          <Button asChild className="flex-1 min-h-[44px]">
            <a href={applicationUrl} target="_blank" rel="noopener noreferrer">
              Apply
            </a>
          </Button>
        ) : (
          <Button className="flex-1 min-h-[44px]" disabled>
            Apply
          </Button>
        )}
      </div>
    </div>
  );
}
