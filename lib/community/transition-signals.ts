/**
 * BL-4: Transition Community Signals — "X people are on the same path as you."
 * Aggregate counts only, no individual names. Rounded to avoid false precision.
 */

import { prisma } from "@/lib/prisma/client";

function normalizePath(from: string, to: string): string {
  const f = (from || "").trim().toLowerCase();
  const t = (to || "").trim().toLowerCase();
  if (!f || !t) return "";
  return `${f} → ${t}`;
}

function roundCount(n: number): number {
  if (n < 20) return Math.max(0, Math.round(n / 5) * 5) || (n > 0 ? 5 : 0);
  if (n < 100) return Math.round(n / 10) * 10;
  if (n < 500) return Math.round(n / 25) * 25;
  return Math.round(n / 50) * 50;
}

/** Get transition path string from UserCareerContext currentRole + targetRole. */
export function getTransitionPathFromContext(
  currentRole: string | null,
  targetRole: string | null
): string | null {
  const path = normalizePath(currentRole ?? "", targetRole ?? "");
  return path || null;
}

/**
 * Count of people on the same transition path.
 * Sources: UserCareerContext (seekers), MentorshipOutcome (verified completions).
 * Privacy: aggregate counts only, no individual names.
 */
export async function getTransitionPathCount(path: string): Promise<{
  count: number;
  pathLabel: string;
  rounded: number;
  completions: number;
}> {
  const normalized = path.trim().toLowerCase();
  if (!normalized || !normalized.includes("→")) {
    return { count: 0, pathLabel: path, rounded: 0, completions: 0 };
  }

  const [fromPart, toPart] = normalized.split("→").map((s) => s.trim());
  if (!fromPart || !toPart) {
    return { count: 0, pathLabel: path, rounded: 0, completions: 0 };
  }

  const [seekersCount, completionsCount] = await Promise.all([
    prisma.userCareerContext.count({
      where: {
        currentRole: { not: null },
        targetRole: { not: null },
        AND: [
          { currentRole: { contains: fromPart, mode: "insensitive" } },
          { targetRole: { contains: toPart, mode: "insensitive" } },
        ],
      },
    }),
    prisma.mentorshipOutcome.count({
      where: {
        status: "VERIFIED",
        AND: [
          { transitionType: { contains: fromPart, mode: "insensitive" } },
          { transitionType: { contains: toPart, mode: "insensitive" } },
        ],
      },
    }),
  ]);

  const total = seekersCount + completionsCount;
  return {
    count: total,
    pathLabel: path,
    rounded: roundCount(total),
    completions: completionsCount,
  };
}
