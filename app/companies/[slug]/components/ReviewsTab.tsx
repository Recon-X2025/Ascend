"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CompanyReviewsSection } from "./CompanyReviewsSection";
import { InterviewReviewsSection } from "./InterviewReviewsSection";
import { SalariesSection } from "./SalariesSection";

const SUB_TABS = [
  { id: "company" as const, label: "Company Reviews" },
  { id: "interview" as const, label: "Interview Reviews" },
  { id: "salaries" as const, label: "Salaries" },
];

interface ReviewsTabProps {
  companyId: string;
  companySlug: string;
  initialSubTab?: "company" | "interview" | "salaries";
}

export function ReviewsTab({ companyId, companySlug, initialSubTab = "company" }: ReviewsTabProps) {
  const [subTab, setSubTab] = useState<"company" | "interview" | "salaries">(initialSubTab);

  return (
    <div className="mt-6">
      <div className="border-b border-border mb-4">
        <ul className="flex gap-1">
          {SUB_TABS.map(({ id, label }) => (
            <li key={id}>
              <button
                type="button"
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  subTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSubTab(id)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {subTab === "company" && (
        <CompanyReviewsSection companyId={companyId} companySlug={companySlug} />
      )}
      {subTab === "interview" && (
        <InterviewReviewsSection companyId={companyId} companySlug={companySlug} />
      )}
      {subTab === "salaries" && <SalariesSection companyId={companyId} />}
    </div>
  );
}
