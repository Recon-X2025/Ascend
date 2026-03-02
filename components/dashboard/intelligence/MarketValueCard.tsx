"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatLakhs(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}

interface MarketValueCardProps {
  marketValue: {
    min: number;
    max: number;
    median: number;
    basis: string;
    sourceLabel: string;
    targetRoleSlug?: string | null;
  } | null;
  premiumRequired: boolean;
  stale?: boolean;
}

export function MarketValueCard({
  marketValue,
  premiumRequired,
  stale,
}: MarketValueCardProps) {
  const showBlur = premiumRequired && marketValue != null;
  const empty = !marketValue && !premiumRequired;

  return (
    <Card className={cn("h-full relative", showBlur && "overflow-hidden")}>
      {showBlur && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#F7F6F1]/80 dark:bg-ink/10 rounded-xl"
          aria-hidden="true"
        >
          <Lock className="h-8 w-8 text-[#0F1A0F]" />
          <p className="text-sm font-medium text-center px-4">
            Upgrade to see your market value
          </p>
          <Link href="/dashboard/billing/upgrade">
            <Button variant="default" size="sm">
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      )}
      <div className={cn(showBlur && "blur-[6px] select-none pointer-events-none")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Your Market Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          {marketValue ? (
            <>
              <div className="font-sans text-2xl font-bold text-foreground">
                ₹{formatLakhs(marketValue.min)} – ₹{formatLakhs(marketValue.max)}{" "}
                <span className="text-sm font-normal text-muted-foreground">/ year</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Median ₹{formatLakhs(marketValue.median)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {marketValue.basis}
              </p>
              <span className="inline-block mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                {marketValue.sourceLabel}
              </span>
              <div className="mt-3">
                <Link
                  href={
                    marketValue.targetRoleSlug
                      ? `/salary/roles/${marketValue.targetRoleSlug}`
                      : "/salary"
                  }
                  className="text-sm text-[#16A34A] hover:underline"
                >
                  See full salary breakdown →
                </Link>
              </div>
            </>
          ) : empty ? (
            <>
              <p className="text-sm text-muted-foreground">
                No salary data available yet for your target role. Add your salary
                to help build the dataset.
              </p>
              <Link
                href="/salary"
                className="inline-block mt-3 text-sm text-[#16A34A] hover:underline"
              >
                Add your salary →
              </Link>
            </>
          ) : null}
        </CardContent>
      </div>
      {stale && (
        <p className="absolute bottom-2 left-4 text-xs text-muted-foreground">
          Refreshing…
        </p>
      )}
    </Card>
  );
}
