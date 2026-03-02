"use client";

import { cn } from "@/lib/utils";

interface FitScoreBadgeProps {
  score: number | null;
  size?: "sm" | "md";
}

function scoreColor(score: number): string {
  if (score < 40) return "bg-red-500/20 text-red-700 border-red-500/40";
  if (score < 60) return "bg-amber-500/20 text-amber-700 border-amber-500/40";
  if (score < 80) return "bg-yellow-500/20 text-yellow-700 border-yellow-500/40";
  return "bg-green-500/20 text-green-700 border-green-500/40";
}

export function FitScoreBadge({ score, size = "md" }: FitScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span
        className={cn(
          "rounded border font-medium text-muted-foreground",
          size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"
        )}
      >
        —
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded border font-medium",
        scoreColor(score),
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"
      )}
    >
      {score}
    </span>
  );
}
