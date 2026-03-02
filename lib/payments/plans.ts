/**
 * Phase 12 Pricing Restructure: New plan keys and limits.
 * PlanKey is the canonical plan identifier; legacy PlanType maps to these for backward compat.
 */

export const PLAN_KEYS = [
  "SEEKER_FREE",
  "SEEKER_PAID",
  "MENTOR_FREE",
  "MENTOR_PAID",
  "MENTOR_MARKETPLACE",
  "RECRUITER_FREE",
  "RECRUITER_STARTER",
  "RECRUITER_PRO",
  "RECRUITER_ENTERPRISE",
  "BOOST_STANDARD",
  "BOOST_FEATURED",
  "BOOST_URGENT",
] as const;

export type PlanKey = (typeof PLAN_KEYS)[number];

/** Legacy PlanType for backward compat during migration. */
export type LegacyPlanType =
  | "FREE"
  | "SEEKER_PREMIUM"
  | "SEEKER_ELITE"
  | "MENTOR_MARKETPLACE"
  | "RECRUITER_STARTER"
  | "RECRUITER_PRO"
  | "RECRUITER_ENTERPRISE";

export interface PlanLimits {
  resumeVersions: number;
  /** Seeker: 0 = pay-per-use only, -1 = unlimited */
  resumeOptimisationsPerMonth: number;
  fitScoreDetailed: boolean;
  salaryInsights: boolean;
  salary_percentiles: boolean;
  salary_top_payers: boolean;
  salary_city_comparison: boolean;
  salary_estimator_full: boolean;
  candidate_intelligence_market_value: boolean;
  candidate_intelligence_skills_gap_full: boolean;
  profileOptimiser: boolean;
  whoViewedProfile: boolean;
  /** Recruiter: job posts max; -1 = unlimited */
  jobPostsMax: number;
  inMailCreditsPerMonth: number;
  resumeDbViewsPerMonth: number;
  featuredListingsPerMonth: number;
  teamSeats: number;
  candidateFitScores: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  ssoEnabled: boolean;
  bulkImport: boolean;
  atsWebhooks: boolean;
  customDomain: boolean;
  maxApiKeys: number;
  apiRequestsPerHour: number;
}

const FREE_LIMITS: PlanLimits = {
  resumeVersions: 3,
  resumeOptimisationsPerMonth: 0,
  fitScoreDetailed: false,
  salaryInsights: false,
  salary_percentiles: false,
  salary_top_payers: false,
  salary_city_comparison: false,
  salary_estimator_full: false,
  candidate_intelligence_market_value: false,
  candidate_intelligence_skills_gap_full: false,
  profileOptimiser: false,
  whoViewedProfile: false,
  jobPostsMax: 0,
  inMailCreditsPerMonth: 0,
  resumeDbViewsPerMonth: 0,
  featuredListingsPerMonth: 0,
  teamSeats: 1,
  candidateFitScores: false,
  apiAccess: false,
  whiteLabel: false,
  ssoEnabled: false,
  bulkImport: false,
  atsWebhooks: false,
  customDomain: false,
  maxApiKeys: 0,
  apiRequestsPerHour: 0,
};

const SEEKER_FREE: PlanLimits = { ...FREE_LIMITS };
const SEEKER_PAID: PlanLimits = {
  ...FREE_LIMITS,
  resumeVersions: 10,
  resumeOptimisationsPerMonth: 5,
  fitScoreDetailed: true,
  salaryInsights: true,
  salary_percentiles: true,
  salary_top_payers: true,
  salary_city_comparison: true,
  salary_estimator_full: true,
  candidate_intelligence_market_value: true,
  candidate_intelligence_skills_gap_full: true,
  profileOptimiser: true,
  whoViewedProfile: true,
};

const MENTOR_FREE: PlanLimits = { ...FREE_LIMITS };
const MENTOR_PAID: PlanLimits = { ...SEEKER_PAID };
const MENTOR_MARKETPLACE: PlanLimits = { ...FREE_LIMITS };
const RECRUITER_FREE: PlanLimits = { ...FREE_LIMITS, jobPostsMax: 0 };
const RECRUITER_STARTER: PlanLimits = {
  ...FREE_LIMITS,
  jobPostsMax: 3,
  inMailCreditsPerMonth: 10,
};
const RECRUITER_PRO: PlanLimits = {
  ...FREE_LIMITS,
  jobPostsMax: 15,
  inMailCreditsPerMonth: 50,
  resumeDbViewsPerMonth: 500,
  featuredListingsPerMonth: 2,
  teamSeats: 3,
  candidateFitScores: true,
};
const RECRUITER_ENTERPRISE: PlanLimits = {
  ...FREE_LIMITS,
  jobPostsMax: -1,
  inMailCreditsPerMonth: -1,
  resumeDbViewsPerMonth: -1,
  featuredListingsPerMonth: 10,
  teamSeats: -1,
  candidateFitScores: true,
  apiAccess: true,
  whiteLabel: true,
  ssoEnabled: true,
  bulkImport: true,
  atsWebhooks: true,
  customDomain: true,
  maxApiKeys: 10,
  apiRequestsPerHour: 1000,
};
const BOOST_STANDARD: PlanLimits = { ...FREE_LIMITS };
const BOOST_FEATURED: PlanLimits = { ...FREE_LIMITS };
const BOOST_URGENT: PlanLimits = { ...FREE_LIMITS };

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  SEEKER_FREE,
  SEEKER_PAID,
  MENTOR_FREE,
  MENTOR_PAID,
  MENTOR_MARKETPLACE,
  RECRUITER_FREE,
  RECRUITER_STARTER,
  RECRUITER_PRO,
  RECRUITER_ENTERPRISE,
  BOOST_STANDARD,
  BOOST_FEATURED,
  BOOST_URGENT,
} as const;

export function getLimits(plan: PlanKey | LegacyPlanType): PlanLimits {
  const key = legacyPlanToKey(plan);
  return PLAN_LIMITS[key] ?? PLAN_LIMITS.SEEKER_FREE;
}

/** Map legacy PlanType to new PlanKey (backward compat during migration). */
export function legacyPlanToKey(plan: PlanKey | LegacyPlanType): PlanKey {
  if (PLAN_KEYS.includes(plan as PlanKey)) return plan as PlanKey;
  switch (plan) {
    case "SEEKER_PREMIUM":
    case "SEEKER_ELITE":
      return "SEEKER_PAID";
    case "FREE":
    case "MENTOR_MARKETPLACE":
    case "RECRUITER_STARTER":
    case "RECRUITER_PRO":
    case "RECRUITER_ENTERPRISE":
      return plan as PlanKey;
    default:
      return "SEEKER_FREE";
  }
}

export function isPilotFreeOverride(): boolean {
  return process.env.SEEKER_PILOT_OPEN === "true";
}

export const MENTOR_MARKETPLACE_PLAN = {
  monthlyPricePaise: 119900,
  annualPricePaise: 1194200,
  canListInMarketplace: true,
  seoBoostEligible: true,
  canReceivePaidEngagements: true,
  /** M-13: SEO boost pricing (paise). */
  seoBoostPricing: {
    MONTHLY_RECURRING: 299900,
    ONE_TIME_30_DAYS: 199900,
    ONE_TIME_14_DAYS: 99900,
  } as const,
} as const;

/** Returns mentor plan info if mentor has active MENTOR_MARKETPLACE subscription. */
export async function getMentorActivePlan(mentorId: string): Promise<typeof MENTOR_MARKETPLACE_PLAN | null> {
  const { prisma } = await import("@/lib/prisma/client");
  const sub = await prisma.userSubscription.findUnique({
    where: { userId: mentorId },
    select: { planKey: true, plan: true, status: true },
  });
  if (!sub || sub.status !== "ACTIVE") return null;
  const isMarketplace =
    (sub.planKey && sub.planKey === "MENTOR_MARKETPLACE") ||
    (sub.plan && String(sub.plan) === "MENTOR_MARKETPLACE");
  if (!isMarketplace) return null;
  return MENTOR_MARKETPLACE_PLAN;
}
