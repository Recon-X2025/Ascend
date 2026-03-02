/**
 * M-4: Matching engine — multi-dimensional scoring.
 * Mentee never sees score; they see a reason string only.
 */

import type {
  MentorProfile,
  UserCareerContext,
  PrimaryNeed,
  MentorFocusArea,
  M2FocusArea,
} from "@prisma/client";

const TRANSITION_DOMAINS: Record<string, string[]> = {
  engineering: ["swe", "sde", "software engineer", "devops", "qa", "developer", "engineer"],
  product: ["pm", "apm", "cpo", "product manager", "product owner"],
  design: ["ui", "ux", "product design", "designer"],
  data: ["data analyst", "data scientist", "mle", "analytics"],
  management: ["em", "tpm", "director", "manager", "tech lead"],
  business: ["sales", "bd", "consulting", "strategy", "business development"],
};

const FOCUS_CATEGORIES: Record<string, (MentorFocusArea | M2FocusArea)[]> = {
  career_switch: ["CAREER_PIVOT" as M2FocusArea, "DOMAIN_SWITCH" as M2FocusArea],
  growth: ["LEADERSHIP" as MentorFocusArea, "IC_TO_MANAGEMENT" as M2FocusArea],
  skills: ["TECHNICAL_GROWTH" as MentorFocusArea, "PORTFOLIO_BUILDING" as M2FocusArea],
  job_search: [
    "INTERVIEW_PREP" as MentorFocusArea,
    "RESUME_REVIEW" as MentorFocusArea,
    "NETWORKING" as MentorFocusArea,
    "SALARY_NEGOTIATION" as MentorFocusArea,
  ],
};

const PRIMARY_NEED_TO_CATEGORY: Partial<Record<PrimaryNeed, string>> = {
  FIND_JOBS: "job_search",
  IMPROVE_RESUME: "job_search",
  FIND_MENTOR: "career_switch",
  PREPARE_INTERVIEWS: "job_search",
  UNDERSTAND_COMPANIES: "growth",
  BUILD_NETWORK: "job_search",
  BENCHMARK_SALARY: "job_search",
};

function roleToDomain(role: string | null): string | null {
  if (!role?.trim()) return null;
  const r = role.toLowerCase().trim();
  for (const [domain, keys] of Object.entries(TRANSITION_DOMAINS)) {
    if (keys.some((k) => r.includes(k) || k.includes(r))) return domain;
  }
  return null;
}

function sameDomain(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return roleToDomain(a) === roleToDomain(b);
}

export interface MatchInput {
  mentee: {
    careerContext: UserCareerContext | null;
    targetFromRole: string | null;
    targetToRole: string | null;
    targetFromIndustry: string | null;
    targetToIndustry: string | null;
    targetCity: string | null;
    primaryNeed: string | null;
    preferredGeography?: string | null;
  };
  mentor: MentorProfile & {
    availabilityWindows: { dayOfWeek: string }[];
    verificationStatus: string;
    currentMenteeCount: number;
    user?: { name: string | null };
  };
}

export interface MatchDimensions {
  transitionSimilarity: number;
  geographyRelevance: number;
  focusAreaAlignment: number;
  availabilityFit: number;
  capacity: number;
}

export interface MatchScore {
  mentorUserId: string;
  mentorProfileId: string;
  totalScore: number;
  dimensions: MatchDimensions;
  reason: string;
}

function scoreTransitionSimilarity(mentee: MatchInput["mentee"], mentor: MentorProfile): number {
  const mFrom = mentor.fromRole?.toLowerCase().trim() ?? "";
  const mTo = mentor.toRole?.toLowerCase().trim() ?? "";
  const eFrom = mentee.targetFromRole?.toLowerCase().trim() ?? "";
  const eTo = mentee.targetToRole?.toLowerCase().trim() ?? "";

  if (!eTo) return 0;
  if (!mTo) return 0;

  const exactFrom = eFrom && mFrom && (eFrom === mFrom || mFrom.includes(eFrom) || eFrom.includes(mFrom));
  const exactTo = eTo === mTo || mTo.includes(eTo) || eTo.includes(mTo);

  if (exactFrom && exactTo) return 40;
  if (exactTo && sameDomain(mentee.targetFromRole, mentor.fromRole)) return 25;
  if (exactTo) return 15;
  return 0;
}

function scoreGeographyRelevance(
  mentee: MatchInput["mentee"],
  mentor: MentorProfile
): number {
  const scope = mentor.geographyScope;
  const menteeWantsInternational =
    mentee.careerContext?.targetGeography === "INDIA_TO_GLOBAL" ||
    mentee.careerContext?.targetGeography === "GLOBAL_ONLY";
  const mentorIndiaToGlobal = scope === "INDIA_TO_GLOBAL";

  if (mentorIndiaToGlobal && menteeWantsInternational) return 20;

  const mentorToCity = mentor.toCity?.toLowerCase().trim() ?? "";
  const menteeCity = mentee.targetCity?.toLowerCase().trim() ?? "";
  if (menteeCity && mentorToCity && mentorToCity.includes(menteeCity)) return 20;

  const menteeIndiaOnly = mentee.careerContext?.targetGeography === "INDIA_ONLY";
  if (scope === "INDIA_ONLY" && menteeIndiaOnly) return 15;

  if (menteeWantsInternational && scope === "INDIA_ONLY") return 5;
  return 10;
}

function scoreFocusAreaAlignment(mentee: MatchInput["mentee"], mentor: MentorProfile): number {
  const category = mentee.primaryNeed
    ? PRIMARY_NEED_TO_CATEGORY[mentee.primaryNeed as PrimaryNeed]
    : null;
  if (!category) return 0;

  const areas = FOCUS_CATEGORIES[category];
  if (!areas?.length) return 0;

  const mentorFocus = new Set([
    ...(mentor.focusAreas ?? []),
    ...(mentor.m2FocusAreas ?? []),
  ]);
  const direct = areas.some((a) => mentorFocus.has(a));
  if (direct) return 20;

  const sameCategory = Object.entries(FOCUS_CATEGORIES).some(
    ([cat, arr]) => cat !== category && arr.some((a) => mentorFocus.has(a))
  );
  if (sameCategory) return 12;
  return 0;
}

function scoreAvailabilityFit(mentor: { availabilityWindows: unknown[] }): number {
  const n = mentor.availabilityWindows?.length ?? 0;
  if (n >= 2) return 10;
  if (n >= 1) return 5;
  return 3;
}

function scoreCapacity(mentor: MentorProfile): number {
  const max = mentor.maxActiveMentees ?? 2;
  const current = mentor.currentMenteeCount ?? 0;
  const open = Math.max(0, max - current);
  if (open >= 2) return 10;
  if (open >= 1) return 7;
  return 0;
}

function buildReason(
  mentor: MatchInput["mentor"],
  dimensions: MatchDimensions
): string {
  const firstName = mentor.user?.name?.split(" ")[0] ?? "This mentor";
  const from = [mentor.fromRole, mentor.fromCompanyType].filter(Boolean).join(" at ") || "their previous role";
  const to = [mentor.toRole, mentor.toCompanyType].filter(Boolean).join(" at ") || "their current role";
  const toCity = mentor.toCity ? ` in ${mentor.toCity}` : "";
  const duration =
    mentor.transitionDurationMonths != null
      ? ` — ${mentor.transitionDurationMonths} months ago`
      : mentor.transitionYear != null
        ? ` — ${mentor.transitionYear}`
        : "";

  const parts: string[] = [];

  if (dimensions.transitionSimilarity >= 25) {
    if (dimensions.transitionSimilarity >= 40) {
      parts.push(
        `${firstName} made the exact transition you're targeting — ${from} → ${to}${duration}${toCity}.`
      );
    } else {
      parts.push(
        `${firstName} made a similar transition to ${to}${toCity} and can help with your goal.`
      );
    }
  }

  if (dimensions.focusAreaAlignment >= 12 && parts.length < 2) {
    const focusBits: string[] = [];
    if (mentor.focusAreas?.length) focusBits.push(mentor.focusAreas.slice(0, 2).join(" and ").toLowerCase().replace(/_/g, " "));
    if (mentor.m2FocusAreas?.length) focusBits.push(mentor.m2FocusAreas.slice(0, 2).join(" and ").toLowerCase().replace(/_/g, " "));
    const focusStr = focusBits.length ? focusBits.join(", ") : "your primary goal";
    parts.push(
      `${firstName} specialises in ${focusStr} — which matches what you're looking for.`
    );
  }

  if (dimensions.geographyRelevance >= 15 && parts.length < 2) {
    if (mentor.toCity && parts.length === 0) {
      parts.push(
        `${firstName} made their transition in ${mentor.toCity}, aligning with your target location.`
      );
    }
  }

  if (parts.length === 0) {
    return `${firstName} has relevant experience and capacity to support you.`;
  }
  return parts.slice(0, 2).join(" ");
}

/**
 * Score one mentor. Returns null if capacity is 0 (exclude from results).
 */
export function scoreOneMentor(input: MatchInput): MatchScore | null {
  const cap = scoreCapacity(input.mentor);
  if (cap === 0) return null;

  const dimensions: MatchDimensions = {
    transitionSimilarity: scoreTransitionSimilarity(input.mentee, input.mentor),
    geographyRelevance: scoreGeographyRelevance(input.mentee, input.mentor),
    focusAreaAlignment: scoreFocusAreaAlignment(input.mentee, input.mentor),
    availabilityFit: scoreAvailabilityFit(input.mentor),
    capacity: cap,
  };

  const totalScore =
    dimensions.transitionSimilarity +
    dimensions.geographyRelevance +
    dimensions.focusAreaAlignment +
    dimensions.availabilityFit +
    dimensions.capacity;

  const reason = buildReason(input.mentor, dimensions);

  return {
    mentorUserId: input.mentor.userId,
    mentorProfileId: input.mentor.id,
    totalScore,
    dimensions,
    reason,
  };
}

/**
 * Score all eligible mentors, sort by totalScore DESC, return top 3.
 * Excludes zero-capacity mentors. Reason is the only match output for mentees.
 */
export function scoreMentors(
  menteeInput: Omit<MatchInput["mentee"], "careerContext"> & { careerContext: UserCareerContext | null },
  eligibleMentors: MatchInput["mentor"][]
): MatchScore[] {
  const scored: MatchScore[] = [];

  for (const mentor of eligibleMentors) {
    const result = scoreOneMentor({ mentee: menteeInput, mentor });
    if (result) scored.push(result);
  }

  scored.sort((a, b) => b.totalScore - a.totalScore);
  return scored.slice(0, 3);
}

/**
 * Legacy helper for mentor list route: returns a single 0–100 score for one mentor vs context.
 * Used for sorting only; not the curated discover flow.
 */
export function scoreMentorMatch(
  mentor: MentorProfile & { user?: { name: string | null }; availabilityWindows?: { dayOfWeek: string }[] },
  context: UserCareerContext | null
): number {
  const mentee = {
    careerContext: context,
    targetFromRole: null,
    targetToRole: context?.targetRole ?? null,
    targetFromIndustry: null,
    targetToIndustry: null,
    targetCity: null,
    primaryNeed: context?.primaryNeed ?? null,
  };
  const mentorWithCount = {
    ...mentor,
    availabilityWindows: mentor.availabilityWindows ?? [],
    verificationStatus: (mentor as { verificationStatus?: string }).verificationStatus ?? "VERIFIED",
    currentMenteeCount: mentor.currentMenteeCount ?? 0,
  } as MatchInput["mentor"];
  const result = scoreOneMentor({ mentee, mentor: mentorWithCount });
  return result?.totalScore ?? 0;
}
