import { cn } from "@/lib/utils";
import { formatSalaryShort } from "@/lib/salary/format";

interface PercentileBarProps {
  p25: number;
  median: number;
  p75: number;
  p90: number;
  className?: string;
}

export function PercentileBar({ p25, median, p75, p90, className }: PercentileBarProps) {
  const min = p25;
  const max = p90;
  const range = max - min || 1;
  const pos25 = ((p25 - min) / range) * 100;
  const pos50 = ((median - min) / range) * 100;
  const pos75 = ((p75 - min) / range) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative h-3 w-full rounded-full bg-surface-2 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-green/30 via-green to-green-dark"
          style={{ width: "100%" }}
        />
        <span
          className="absolute top-0 h-full w-0.5 bg-ink shadow-sm"
          style={{ left: `${pos25}%` }}
          title={`P25: ${formatSalaryShort(p25)}`}
        />
        <span
          className="absolute top-0 h-full w-1 bg-ink"
          style={{ left: `${pos50}%` }}
          title={`Median: ${formatSalaryShort(median)}`}
        />
        <span
          className="absolute top-0 h-full w-0.5 bg-ink/80"
          style={{ left: `${pos75}%` }}
          title={`P75: ${formatSalaryShort(p75)}`}
        />
        <span
          className="absolute top-0 right-0 h-full w-0.5 bg-ink/60"
          title={`P90: ${formatSalaryShort(p90)}`}
        />
      </div>
      <div className="flex justify-between text-xs text-ink-3">
        <span>P25 {formatSalaryShort(p25)}</span>
        <span className="font-medium text-ink-2">Median {formatSalaryShort(median)}</span>
        <span>P75 {formatSalaryShort(p75)}</span>
        <span>P90 {formatSalaryShort(p90)}</span>
      </div>
    </div>
  );
}
