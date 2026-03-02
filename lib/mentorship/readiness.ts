import { prisma } from "@/lib/prisma/client";
import type { MenteeReadinessCheck } from "@prisma/client";

const CAREER_CONTEXT_THRESHOLD = 80;

export interface ReadinessResult {
  check: MenteeReadinessCheck;
  targetTransition: {
    targetFromRole: string | null;
    targetFromIndustry: string | null;
    targetToRole: string | null;
    targetToIndustry: string | null;
    targetCity: string | null;
    targetTimelineMonths: number | null;
  } | null;
}

/**
 * Gate 1: Profile completeness — headline, location, currentRole, experienceYears, at least 1 skill, at least 1 experience.
 * Gate 2: Career context completion score >= 80.
 * Gate 3: Target transition declared (targetToRole set on MenteeReadinessCheck or CareerIntent).
 */
export async function computeReadiness(userId: string): Promise<ReadinessResult> {
  const now = new Date();

  // Gate 1: JobSeekerProfile
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId },
    select: {
      headline: true,
      city: true,
      state: true,
      country: true,
      currentRole: true,
      totalExpYears: true,
      skills: { select: { id: true } },
      experiences: { select: { id: true } },
    },
  });

  const hasLocation = Boolean(
    profile?.city?.trim() || profile?.state?.trim() || profile?.country?.trim()
  );
  const profileComplete =
    Boolean(profile?.headline?.trim()) &&
    hasLocation &&
    Boolean(profile?.currentRole?.trim()) &&
    profile?.totalExpYears != null &&
    (profile?.skills?.length ?? 0) >= 1 &&
    (profile?.experiences?.length ?? 0) >= 1;

  // Gate 2: UserCareerContext.completionScore >= 80 (or previously passed and transition still declared)
  const context = await prisma.userCareerContext.findUnique({
    where: { userId },
    select: { completionScore: true },
  });
  const contextScore = context?.completionScore ?? 0;
  const scoreMeetsThreshold = contextScore >= CAREER_CONTEXT_THRESHOLD;

  // Gate 3: Target transition — from MenteeReadinessCheck or CareerIntent
  const existingCheck = await prisma.menteeReadinessCheck.findUnique({
    where: { userId },
  });

  const hasTargetOnCheck = Boolean(existingCheck?.targetToRole?.trim());
  const hasCareerIntent = await prisma.careerIntent
    .findFirst({
      where: { userId },
      select: { id: true },
    })
    .then(Boolean);
  const transitionDeclared = hasTargetOnCheck || hasCareerIntent;

  // Don't roll back: if they previously had career context complete and still have transition declared, keep it complete
  const hadCareerContextComplete = existingCheck?.careerContextComplete === true;
  const careerContextComplete =
    scoreMeetsThreshold ||
    (hadCareerContextComplete && transitionDeclared) ||
    (transitionDeclared && contextScore >= 50);

  const allGatesPassed = profileComplete && careerContextComplete && transitionDeclared;

  const check = await prisma.menteeReadinessCheck.upsert({
    where: { userId },
    create: {
      userId,
      profileComplete,
      careerContextComplete,
      transitionDeclared,
      allGatesPassed,
      targetFromRole: existingCheck?.targetFromRole ?? null,
      targetFromIndustry: existingCheck?.targetFromIndustry ?? null,
      targetToRole: existingCheck?.targetToRole ?? null,
      targetToIndustry: existingCheck?.targetToIndustry ?? null,
      targetCity: existingCheck?.targetCity ?? null,
      targetTimelineMonths: existingCheck?.targetTimelineMonths ?? null,
      lastCheckedAt: now,
    },
    update: {
      profileComplete,
      careerContextComplete,
      transitionDeclared,
      allGatesPassed,
      lastCheckedAt: now,
    },
  });

  const targetTransition =
    check.targetToRole != null
      ? {
          targetFromRole: check.targetFromRole,
          targetFromIndustry: check.targetFromIndustry,
          targetToRole: check.targetToRole,
          targetToIndustry: check.targetToIndustry,
          targetCity: check.targetCity,
          targetTimelineMonths: check.targetTimelineMonths,
        }
      : null;

  return { check, targetTransition };
}
