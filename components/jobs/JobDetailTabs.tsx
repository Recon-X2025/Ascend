"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FitScoreBreakdown } from "./FitScoreBreakdown";

interface JobDetailTabsProps {
  jobPostId: number;
  overviewContent: React.ReactNode;
}

export function JobDetailTabs({ jobPostId, overviewContent }: JobDetailTabsProps) {
  const [tab, setTab] = useState<"overview" | "fit">("overview");

  return (
    <div>
      <nav className="border-b border-border mb-4">
        <ul className="flex flex-wrap gap-1">
          <li>
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={cn(
                "inline-block px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Overview
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setTab("fit")}
              className={cn(
                "inline-block px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === "fit"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Fit
            </button>
          </li>
        </ul>
      </nav>
      {tab === "overview" && overviewContent}
      {tab === "fit" && <FitScoreBreakdown jobPostId={jobPostId} />}
    </div>
  );
}
