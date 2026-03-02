"use client";

export function UpcomingSessionsPlaceholder() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-ink-3">
      <p>No sessions scheduled yet</p>
      <p className="text-sm mt-1">(Sessions will be wired in M-7)</p>
    </div>
  );
}
