"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const DISMISS_KEY_PREFIX = "ascend_review_prompt_dismiss_";

interface CompanyForReview {
  companyId: string;
  companyName: string;
  companySlug: string;
}

interface AddReviewPromptCardProps {
  companies: CompanyForReview[];
}

function getDismissedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISS_KEY_PREFIX + "set");
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function dismissCompany(companyId: string) {
  try {
    const set = getDismissedSet();
    set.add(companyId);
    localStorage.setItem(DISMISS_KEY_PREFIX + "set", JSON.stringify(Array.from(set)));
  } catch {}
}

export function AddReviewPromptCard({ companies: initialCompanies }: AddReviewPromptCardProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDismissed(getDismissedSet());
    setMounted(true);
  }, []);

  const companies = mounted
    ? initialCompanies.filter((c) => !dismissed.has(c.companyId))
    : initialCompanies;

  if (companies.length === 0) return null;

  const handleDismiss = (companyId: string) => {
    dismissCompany(companyId);
    setDismissed((prev) => new Set(prev).add(companyId));
  };

  return (
    <div className="space-y-3">
      {companies.slice(0, 3).map((c) => (
        <Card key={c.companyId} className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
            <p className="text-sm font-medium">
              Share your experience at <span className="text-primary">{c.companyName}</span> — Help other seekers
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild size="sm">
                <Link href={`/reviews/company/new?companyId=${c.companyId}`}>Write a review</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Dismiss"
                onClick={() => handleDismiss(c.companyId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
