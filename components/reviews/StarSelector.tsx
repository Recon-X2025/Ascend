"use client";

import { cn } from "@/lib/utils";

interface StarSelectorProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  className?: string;
}

export function StarSelector({
  value,
  onChange,
  max = 5,
  className,
}: StarSelectorProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-0.5 transition-transform hover:scale-110"
          onClick={() => onChange(star)}
        >
          <span
            className={cn(
              "text-2xl",
              value >= star ? "text-primary" : "text-muted-foreground/40"
            )}
          >
            ★
          </span>
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">{value}/5</span>
      )}
    </div>
  );
}
