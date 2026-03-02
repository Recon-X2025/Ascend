"use client";

export type FunnelStep = { label: string; value: number; pct: number };

export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div key={step.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{step.label}</span>
            <span className="text-muted-foreground">
              {step.value.toLocaleString()} ({step.pct}%)
            </span>
          </div>
          <div className="h-8 rounded-md bg-muted overflow-hidden flex">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-l-md"
              style={{ width: `${(step.value / max) * 100}%`, minWidth: step.value > 0 ? "4px" : 0 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
