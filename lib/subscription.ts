/**
 * User plan for limits (e.g. resume versions).
 * TODO: wire to billing/subscription when available.
 */
export type Plan = "free" | "premium";

const MAX_RESUME_VERSIONS_FREE = 5;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for billing lookup
export function getPlanForUser(userId: string): Plan {
  // When billing exists: look up user subscription and return "premium" if active.
  return "free";
}

export function getMaxResumeVersions(plan: Plan): number {
  return plan === "premium" ? Number.POSITIVE_INFINITY : MAX_RESUME_VERSIONS_FREE;
}

export function isAtResumeVersionLimit(plan: Plan, currentCount: number): boolean {
  return currentCount >= getMaxResumeVersions(plan);
}
