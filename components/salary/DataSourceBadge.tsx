import { cn } from "@/lib/utils";

type SourceLabel = "Community reported" | "From job postings" | "Combined";

interface DataSourceBadgeProps {
  sourceLabel: SourceLabel | string | null;
  className?: string;
}

export function DataSourceBadge({ sourceLabel, className }: DataSourceBadgeProps) {
  if (!sourceLabel) return null;
  const isCommunity = sourceLabel === "Community reported" || sourceLabel === "Combined";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        isCommunity
          ? "border border-green/50 bg-green/10 text-green-dark"
          : "border border-border-mid bg-surface-2 text-ink-3",
        className
      )}
    >
      {sourceLabel}
    </span>
  );
}
