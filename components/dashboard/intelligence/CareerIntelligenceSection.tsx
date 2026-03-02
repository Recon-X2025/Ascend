"use client";

import useSWR from "swr";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketValueCard } from "./MarketValueCard";
import { VisibilityScoreCard } from "./VisibilityScoreCard";
import { SkillsGapCard } from "./SkillsGapCard";
import { ApplicationPerformanceCard } from "./ApplicationPerformanceCard";
import { BestTimeToApplyCard } from "./BestTimeToApplyCard";
import {
  MarketValueSkeleton,
  VisibilityScoreSkeleton,
  SkillsGapSkeleton,
  ApplicationPerformanceSkeleton,
  BestTimeToApplySkeleton,
} from "./IntelligenceSkeleton";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j?.error ?? "Failed to load");
  }
  return r.json();
};

function useIntelligenceRefresh(mutate: () => void) {
  return async () => {
    try {
      await fetch("/api/intelligence/candidate/refresh", { method: "POST" });
      mutate();
    } catch {
      // ignore
    }
  };
}

export function CareerIntelligenceSection() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/intelligence/candidate",
    fetcher,
    { refreshInterval: 0 }
  );
  const triggerRefresh = useIntelligenceRefresh(mutate);

  const computedAt = data?.computedAt ? new Date(data.computedAt) : null;
  const computedDaysAgo = computedAt
    ? Math.floor(
        (Date.now() - computedAt.getTime()) / (24 * 60 * 60 * 1000)
      )
    : null;

  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">
          Career Intelligence
        </h2>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load career intelligence. Try again later.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-muted-foreground font-[family-name:var(--font-syne)]">
          Career Intelligence
        </h2>
        {!isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => triggerRefresh()}
            className="text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        )}
      </div>
      <div className="border-t border-border pt-4" />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MarketValueSkeleton />
          <VisibilityScoreSkeleton />
          <div className="md:col-span-2">
            <SkillsGapSkeleton />
          </div>
          <ApplicationPerformanceSkeleton />
          <BestTimeToApplySkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MarketValueCard
            marketValue={data?.marketValue ?? null}
            premiumRequired={!!data?.premiumRequiredMarketValue}
            stale={!!data?.stale}
          />
          <VisibilityScoreCard
            visibility={data?.visibility ?? null}
            stale={!!data?.stale}
            computedDaysAgo={computedDaysAgo}
          />
          <div className="md:col-span-2">
            <SkillsGapCard
              targetRole={data?.skillsGap?.targetRole ?? null}
              items={data?.skillsGap?.items ?? []}
              totalJDs={data?.skillsGap?.totalJDs ?? 0}
              premiumRequiredFull={!!data?.premiumRequiredSkillsGapFull}
            />
          </div>
          <ApplicationPerformanceCard
            appPerformance={data?.appPerformance ?? null}
          />
          <BestTimeToApplyCard
            targetRole={data?.skillsGap?.targetRole ?? null}
            heatmap={data?.heatmap ?? null}
          />
        </div>
      )}
    </section>
  );
}
