"use client";

interface CapacityOverviewProps {
  maxActiveMentees: number;
  currentMenteeCount: number;
}

export function CapacityOverview({ maxActiveMentees, currentMenteeCount }: CapacityOverviewProps) {
  const available = Math.max(0, maxActiveMentees - currentMenteeCount);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6 flex flex-wrap gap-6">
      <span className="text-sm text-ink-3">
        Max mentees: <strong className="text-ink">{maxActiveMentees}</strong>
      </span>
      <span className="text-sm text-ink-3">
        Currently active: <strong className="text-ink">{currentMenteeCount}</strong>
      </span>
      <span className="text-sm text-ink-3">
        Available slots: <strong className="text-green">{available}</strong>
      </span>
    </div>
  );
}
