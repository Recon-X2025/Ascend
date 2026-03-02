interface ProgressBarProps {
  step: number;
  totalSteps: number;
}

export function ProgressBar({ step, totalSteps }: ProgressBarProps) {
  const value = totalSteps > 0 ? (step / totalSteps) * 100 : 0;
  return (
    <div className="w-full">
      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-green transition-all duration-300 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1.5 text-center text-sm text-text-secondary">
        Step {step} of {totalSteps}
      </p>
    </div>
  );
}
