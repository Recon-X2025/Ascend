import { prisma } from "@/lib/prisma/client";
import { getLimits, isPilotFreeOverride, legacyPlanToKey } from "./plans";
import type { PlanKey } from "./plans";
import type { PlanLimits } from "./plans";

/** Feature keys for canUseFeature. Supports both old and new names for backward compat. */
export type PlanLimitKey = keyof PlanLimits;

/** Maps legacy feature names to new ones. */
const FEATURE_ALIASES: Record<string, PlanLimitKey> = {
  optimiserSessionsPerMonth: "resumeOptimisationsPerMonth",
  fitScoreBreakdown: "fitScoreDetailed",
  activeJobPosts: "jobPostsMax",
};

function resolveFeatureKey(feature: string): PlanLimitKey {
  const resolved = FEATURE_ALIASES[feature] ?? feature;
  return resolved as PlanLimitKey;
}

/** Determine user's primary role for plan fallback. */
async function getUserRoleContext(userId: string): Promise<"SEEKER" | "MENTOR" | "RECRUITER"> {
  const [user, mentorProfile, recruiterProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, jobSeekerProfile: { select: { id: true } }, recruiterProfile: { select: { id: true } } },
    }),
    prisma.mentorProfile.findUnique({ where: { userId }, select: { id: true } }),
    prisma.recruiterProfile.findUnique({ where: { userId }, select: { id: true } }),
  ]);
  if (!user) return "SEEKER";
  if (mentorProfile) return "MENTOR";
  if (user.role === "RECRUITER" || user.role === "COMPANY_ADMIN" || recruiterProfile) return "RECRUITER";
  return "SEEKER";
}

export async function getUserPlan(userId: string): Promise<PlanKey> {
  const sub = await prisma.userSubscription.findUnique({
    where: { userId },
    select: { planKey: true, plan: true, status: true },
  });
  if (sub && sub.status === "ACTIVE") {
    if (sub.planKey) return sub.planKey as PlanKey;
    return legacyPlanToKey(sub.plan) as PlanKey;
  }
  const role = await getUserRoleContext(userId);
  switch (role) {
    case "MENTOR":
      return "MENTOR_FREE";
    case "RECRUITER":
      return "RECRUITER_FREE";
    default:
      return "SEEKER_FREE";
  }
}

export async function getCompanyPlan(companyId: string): Promise<PlanKey> {
  const sub = await prisma.companySubscription.findUnique({
    where: { companyId },
    select: { plan: true, status: true },
  });
  if (!sub || sub.status !== "ACTIVE") return "RECRUITER_FREE";
  return legacyPlanToKey(sub.plan) as PlanKey;
}

export function isUnlimited(limit: number | boolean): boolean {
  if (typeof limit === "boolean") return limit;
  return limit === -1;
}

export function getLimit(planKey: PlanKey, feature: PlanLimitKey): number | boolean {
  const limits = getLimits(planKey);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  return value ?? 0;
}

export async function canUseFeature(
  userId: string,
  feature: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (isPilotFreeOverride()) return { allowed: true };

  const plan = await getUserPlan(userId);
  const limits = getLimits(plan);
  const key = resolveFeatureKey(feature);
  const value = limits[key];

  if (value === false || value === 0) {
    return { allowed: false, reason: "Upgrade to Premium to access this feature" };
  }
  return { allowed: true };
}

/** Phase 18: Check if company plan allows a feature (for API access, white-label, etc.) */
export async function canCompanyUseFeature(
  companyId: string,
  feature: PlanLimitKey
): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getCompanyPlan(companyId);
  const limits = getLimits(plan);
  const value = limits[feature];

  if (value === false || value === 0) {
    return {
      allowed: false,
      reason:
        feature === "apiAccess"
          ? "ENTERPRISE_REQUIRED"
          : "Upgrade to Enterprise to access this feature",
    };
  }
  return { allowed: true };
}

export async function checkJobPostLimit(companyId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
}> {
  const plan = await getCompanyPlan(companyId);
  const limits = getLimits(plan);
  const limit = limits.jobPostsMax ?? 0;

  if (limit === -1) return { allowed: true, current: 0, limit: -1 };

  const current = await prisma.jobPost.count({
    where: { companyId, status: "ACTIVE" },
  });

  return {
    allowed: current < limit,
    current,
    limit,
  };
}
