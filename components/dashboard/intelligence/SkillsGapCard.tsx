"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkillsGapItem {
  skill: string;
  frequency: number;
  urgency: "high" | "medium" | "low";
}

interface SkillsGapCardProps {
  targetRole: string | null;
  items: SkillsGapItem[];
  totalJDs: number;
  premiumRequiredFull: boolean;
}

const URGENCY_STYLE = {
  high: "bg-red-500/15 text-red-600 dark:text-red-400",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
};

export function SkillsGapCard({
  targetRole,
  items,
  totalJDs,
  premiumRequiredFull,
}: SkillsGapCardProps) {
  const visibleItems = items;
  const showBlur = premiumRequiredFull && items.length > 0;

  return (
    <Card className="h-full relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Skills Gap {targetRole ? `— ${targetRole}` : ""}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Based on analysis of {totalJDs > 0 ? totalJDs : 50} recent job postings
        </p>
      </CardHeader>
      <CardContent>
        {!targetRole ? (
          <>
            <p className="text-sm text-muted-foreground">
              Set a target role in your career context to see your skills gap.
            </p>
            <Link
              href="/onboarding/context"
              className="inline-block mt-3 text-sm text-[#16A34A] hover:underline"
            >
              Update career context →
            </Link>
          </>
        ) : visibleItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No missing skills identified — your profile aligns well with common
            requirements for this role.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <div
                  key={item.skill}
                  className="flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2 justify-between">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium truncate block">
                        {item.skill}
                      </span>
                      <div className="h-1 w-full bg-muted rounded-full mt-0.5 overflow-hidden">
                        <div
                          className="h-full bg-[#16A34A] rounded-full transition-all duration-500"
                          style={{ width: `${item.frequency}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full shrink-0 uppercase font-medium",
                        URGENCY_STYLE[item.urgency]
                      )}
                    >
                      {item.urgency === "high" ? "High" : item.urgency === "medium" ? "Med" : "Low"}
                    </span>
                  </div>
                  <Link
                    href={`/marketplace/courses?skill=${encodeURIComponent(item.skill)}`}
                    className="text-xs text-[#16A34A] hover:underline"
                  >
                    Learn {item.skill} →
                  </Link>
                </div>
              ))}
            </div>
            {showBlur && (
              <div className="relative mt-4 rounded-lg border border-dashed border-muted p-4">
                <div className="blur-[4px] select-none pointer-events-none space-y-2">
                  {[1, 2, 3, 4, 5].map((key) => (
                    <div key={key} className="h-8 bg-muted/50 rounded" />
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#F7F6F1]/80 dark:bg-ink/10 rounded-lg">
                  <Lock className="h-6 w-6 text-[#0F1A0F]" />
                  <p className="text-xs font-medium text-center">
                    Upgrade to see full report
                  </p>
                  <Link href="/dashboard/billing/upgrade">
                    <Button variant="default" size="sm">
                      Upgrade to Premium
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            <Link
              href="/marketplace/courses"
              className="inline-block mt-4 text-sm text-[#16A34A] hover:underline"
            >
              Browse course recommendations →
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
