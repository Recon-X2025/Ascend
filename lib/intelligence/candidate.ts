/**
 * Phase 10B: Candidate Intelligence — all computation logic.
 * Route handlers and workers call these; no raw Prisma in routes for intelligence.
 */

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@prisma/client";
import { getRoleSalary } from "@/lib/salary/aggregate";
import {
  scoreCompleteness,
  scoreKeywordDensity,
  scoreRecency,
  scoreApplicationActivity,
  scoreSocialProof,
  computeVisibilityResult,
  type VisibilityFactors,
} from "./visibility";
import {
  buildHeatmapFromDates,
  toPeriodHeatmap,
  getBestPeriod,
  type HeatmapMatrix,
  type PeriodHeatmap,
} from "./heatmap";

const HEATMAP_MIN_JOBS = 100;
const SKILLS_GAP_JD_LIMIT = 50;

export interface MarketValueResult {
  min: number;
  max: number;
  median: number;
  basis: string;
  sourceLabel: string;
  /** Phase 11: adjustment breakdown for display */
  adjustments?: Array<{ factor: string; impact: string }>;
  confidence?: "low" | "medium" | "high";
}

export interface VisibilityScoreResult {
  score: number;
  factors: Record<string, number>;
  recommendations: string[];
}

export interface SkillsGapItem {
  skill: string;
  frequency: number;
  urgency: "high" | "medium" | "low";
}

export interface SkillsGapResult {
  targetRole: string | null;
  items: SkillsGapItem[];
  totalJDs: number;
}

export interface AppPerformanceResult {
  applied: number;
  viewed: number | null;
  shortlisted: number;
  rejected: number;
  responseRate: number | null;
  avgDaysToResponse: number | null;
  shortlistRate: number | null;
}

export interface HeatmapResult {
  periodHeatmap: PeriodHeatmap;
  rawMatrix: HeatmapMatrix;
  totalJobs: number;
  bestPeriod: { day: string; period: string; count: number } | null;
}

export interface WeeklyDigestJobMatch {
  title: string;
  companyName: string;
  slug: string;
}

export interface WeeklyDigestData {
  firstName: string;
  marketValue: MarketValueResult | null;
  visibilityScore: number | null;
  topRecommendation: string | null;
  topMissingSkills: SkillsGapItem[];
  appliedThisPeriod: number;
  responseRate: number | null;
  bestTimeLine: string | null;
  dashboardUrl: string;
  /** BL-2: New job matches from saved search / target role */
  newJobMatches?: WeeklyDigestJobMatch[];
  /** BL-2: Platform stats for re-engagement */
  platformStats?: { newJobsThisWeek: number };
}

/**
 * Compute market value from Phase 8 salary layer + Phase 11 profile-based adjustments.
 * Base: getRoleSalary. Adjustments: experience ±5%/yr, premium skills +3% each (max +15%),
 * postgrad +5%, premium employers +7%. Confidence from data volume.
 */
export async function computeMarketValue(
  userId: string
): Promise<MarketValueResult | null> {
  const [ctx, profile] = await Promise.all([
    prisma.userCareerContext.findUnique({
      where: { userId },
      select: { targetRole: true, targetLocations: true, yearsOfExperience: true },
    }),
    prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: {
        skills: { include: { skill: true } },
        educations: { select: { degree: true }, orderBy: { order: "asc" }, take: 1 },
        experiences: {
          select: { company: true },
          take: 5,
        },
      },
    }),
  ]);

  const jdsForRole = await prisma.parsedJD.findMany({
    where: { title: { contains: (ctx?.targetRole ?? "").slice(0, 25), mode: "insensitive" } },
    take: 50,
    select: { skills: true },
  });
  const role = ctx?.targetRole?.trim();
  const city = ctx?.targetLocations?.[0]?.trim() ?? null;
  if (!role) return null;

  const salary = await getRoleSalary(role, city, new Date().getFullYear());
  if (!salary) return null;

  const dataPoints = (salary.submissionCount ?? 0) + (salary.jdSignalCount ?? 0);
  const confidence: "low" | "medium" | "high" =
    dataPoints > 20 ? "high" : dataPoints >= 5 ? "medium" : "low";
  const locationPart = city ? ` in ${city}` : "";
  const basis = `Based on ${dataPoints} data points for ${role}${locationPart}`;

  let median = salary.median;
  const adjustments: Array<{ factor: string; impact: string }> = [];

  const yearsExp = ctx?.yearsOfExperience ?? profile?.experiences?.length ?? 0;
  const medianExpForRole = 5;
  const expDelta = yearsExp - medianExpForRole;
  if (expDelta !== 0) {
    const pct = Math.max(-25, Math.min(25, expDelta * 5));
    median = median * (1 + pct / 100);
    adjustments.push({
      factor: `${yearsExp} years experience (median for role ~${medianExpForRole})`,
      impact: pct > 0 ? `+${pct}%` : `${pct}%`,
    });
  }

  const skillFreq: Record<string, number> = {};
  for (const jd of jdsForRole) {
    const s = jd.skills as { mustHave?: string[]; niceToHave?: string[] };
    for (const sk of [...(s?.mustHave ?? []), ...(s?.niceToHave ?? [])]) {
      const n = (sk || "").toLowerCase().trim();
      if (n) skillFreq[n] = (skillFreq[n] ?? 0) + 1;
    }
  }
  const topSkills = Object.entries(skillFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);
  const userSkills = new Set(
    (profile?.skills ?? []).map((s) => (s.skill.normalizedName || s.skill.name).toLowerCase())
  );
  const premiumCount = topSkills.filter((sk) => userSkills.has(sk)).length;
  if (premiumCount > 0) {
    const pct = Math.min(15, premiumCount * 3);
    median = median * (1 + pct / 100);
    adjustments.push({
      factor: `${premiumCount} premium skill(s) for this role`,
      impact: `+${pct}%`,
    });
  }

  const hasPostgrad = (profile?.educations ?? []).some(
    (e) => e.degree && /master|msc|mba|m\.?tech|phd|pg/i.test(e.degree)
  );
  if (hasPostgrad) {
    median = median * 1.05;
    adjustments.push({ factor: "Postgraduate in relevant field", impact: "+5%" });
  }

  const verifiedCompanies = await prisma.company.findMany({
    where: { verified: true },
    select: { name: true },
  });
  const verifiedNames = new Set(verifiedCompanies.map((c) => c.name?.toLowerCase().trim()).filter(Boolean));
  const expCompanies = (profile?.experiences ?? []).map((e) => e.company?.toLowerCase().trim()).filter(Boolean);
  const premiumEmployerCount = expCompanies.filter((c) => c && verifiedNames.has(c)).length;
  if (premiumEmployerCount > 0) {
    median = median * 1.07;
    adjustments.push({
      factor: "Experience at verified/premium employers",
      impact: "+7%",
    });
  }

  if (city) {
    adjustments.push({ factor: `${city} location`, impact: "baseline" });
  }

  const min = Math.round(median * 0.85);
  const max = Math.round(median * 1.15);

  return {
    min,
    max,
    median: Math.round(median),
    basis,
    sourceLabel: salary.sourceLabel,
    adjustments,
    confidence,
  };
}

/**
 * Compute visibility score (0–100) and factors.
 */
export async function computeVisibilityScore(
  userId: string
): Promise<VisibilityScoreResult> {
  const [profile, context, applicationsLast30, account] = await Promise.all([
    prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: {
        headline: true,
        summary: true,
        avatarUrl: true,
        city: true,
        state: true,
        country: true,
        currentRole: true,
        currentCompany: true,
        updatedAt: true,
        skills: { select: { skillId: true }, take: 1 },
        experiences: { select: { id: true }, take: 1 },
        educations: { select: { id: true }, take: 1 },
      },
    }),
    prisma.userCareerContext.findUnique({
      where: { userId },
      select: { targetRole: true },
    }),
    prisma.jobApplication.count({
      where: {
        applicantId: userId,
        submittedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.account.findFirst({
      where: { userId, provider: "linkedin" },
      select: { id: true },
    }),
  ]);

  const skillsCount = profile?.skills?.length ?? 0;
  const experienceCount = profile?.experiences?.length ?? 0;
  const hasEducation = (profile?.educations?.length ?? 0) > 0;
  const hasLocation = !!(
    profile?.city?.trim() ||
    profile?.state?.trim() ||
    profile?.country?.trim()
  );
  const hasCurrentRole = !!(
    profile?.currentRole?.trim() || profile?.currentCompany?.trim()
  );

  const completeness = scoreCompleteness({
    hasHeadline: !!profile?.headline?.trim(),
    hasSummary: !!profile?.summary?.trim(),
    hasPhoto: !!profile?.avatarUrl?.trim(),
    hasLocation,
    hasCurrentRole,
    skillsCount,
    experienceCount,
    hasEducation,
  });

  let keywordDensity = 50;
  const targetRole = context?.targetRole?.trim();
  if (targetRole) {
    const jds = await prisma.parsedJD.findMany({
      where: {
        title: { contains: targetRole, mode: "insensitive" },
      },
      take: 20,
      select: { keywords: true },
    });
    const allKeywords = new Set<string>();
    for (const jd of jds) {
      const kw = Array.isArray(jd.keywords) ? jd.keywords : [];
      kw.forEach((k: string) => allKeywords.add(k.toLowerCase().trim()));
    }
    const userText = [
      profile?.headline ?? "",
      profile?.summary ?? "",
    ].join(" ");
    keywordDensity = scoreKeywordDensity(
      userText,
      Array.from(allKeywords).slice(0, 30)
    );
  }

  const recency = scoreRecency(profile?.updatedAt ?? null);
  const applicationActivity = scoreApplicationActivity(applicationsLast30);
  const socialProof = scoreSocialProof(!!account);

  const factors: VisibilityFactors = {
    completeness,
    keywordDensity,
    recency,
    applicationActivity,
    socialProof,
  };
  const result = computeVisibilityResult(factors);
  return {
    score: result.score,
    factors: result.factors as unknown as Record<string, number>,
    recommendations: result.recommendations,
  };
}

/**
 * Skills gap: top missing skills vs target role JDs. Premium returns 10, free 3.
 */
export async function computeSkillsGap(
  userId: string
): Promise<SkillsGapResult> {
  const ctx = await prisma.userCareerContext.findUnique({
    where: { userId },
    select: { targetRole: true },
  });
  const targetRole = ctx?.targetRole?.trim() ?? null;
  if (!targetRole) {
    return { targetRole: null, items: [], totalJDs: 0 };
  }

  const jds = await prisma.parsedJD.findMany({
    where: {
      title: { contains: targetRole, mode: "insensitive" },
    },
    take: SKILLS_GAP_JD_LIMIT,
    select: { skills: true },
  });

  const freq: Record<string, number> = {};
  for (const jd of jds) {
    const skills = jd.skills as { mustHave?: string[]; niceToHave?: string[] };
    const must = Array.isArray(skills?.mustHave) ? skills.mustHave : [];
    const nice = Array.isArray(skills?.niceToHave) ? skills.niceToHave : [];
    for (const sk of [...must, ...nice]) {
      const n = (sk || "").toLowerCase().trim();
      if (!n) continue;
      freq[n] = (freq[n] ?? 0) + 1;
    }
  }

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  const userSkills = profile
    ? await prisma.userSkill.findMany({
        where: { profileId: profile.id },
        select: { skill: { select: { normalizedName: true, name: true } } },
      })
    : [];
  const userSkillSet = new Set(
    userSkills.map((s) => (s.skill.normalizedName || s.skill.name).toLowerCase())
  );

  const missing: SkillsGapItem[] = Object.entries(freq)
    .filter(([name]) => !userSkillSet.has(name))
    .map(([skill, count]) => ({
      skill,
      frequency: Math.round((count / jds.length) * 100),
      urgency: (count / jds.length > 0.6 ? "high" : count / jds.length > 0.3 ? "medium" : "low") as SkillsGapItem["urgency"],
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  return {
    targetRole,
    items: missing as SkillsGapItem[],
    totalJDs: jds.length,
  };
}

/**
 * Application performance from JobApplication records.
 */
export async function computeApplicationPerformance(
  userId: string
): Promise<AppPerformanceResult> {
  const apps = await prisma.jobApplication.findMany({
    where: { applicantId: userId },
    select: {
      status: true,
      submittedAt: true,
      statusUpdatedAt: true,
    },
  });

  const applied = apps.length;
  const shortlisted = apps.filter((a) =>
    ["SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFERED"].includes(a.status)
  ).length;
  const rejected = apps.filter((a) => a.status === "REJECTED").length;
  const contacted = shortlisted + rejected;
  const responseRate = applied > 0 ? (contacted / applied) * 100 : null;
  const shortlistRate = applied > 0 ? (shortlisted / applied) * 100 : null;

  const withResponse = apps.filter(
    (a) =>
      a.status !== "SUBMITTED" &&
      a.statusUpdatedAt &&
      a.submittedAt &&
      a.statusUpdatedAt.getTime() !== a.submittedAt.getTime()
  );
  let avgDaysToResponse: number | null = null;
  if (withResponse.length > 0) {
    const totalDays = withResponse.reduce((sum, a) => {
      const sub = a.submittedAt!.getTime();
      const upd = a.statusUpdatedAt!.getTime();
      return sum + (upd - sub) / (24 * 60 * 60 * 1000);
    }, 0);
    avgDaysToResponse = Math.round((totalDays / withResponse.length) * 10) / 10;
  }

  return {
    applied,
    viewed: applied > 0 ? contacted : null,
    shortlisted,
    rejected,
    responseRate,
    avgDaysToResponse,
    shortlistRate,
  };
}

/**
 * Heatmap from JobPost createdAt (last 90 days), filtered by target role/location if possible.
 */
export async function computeHeatmap(
  userId: string
): Promise<HeatmapResult | null> {
  const ctx = await prisma.userCareerContext.findUnique({
    where: { userId },
    select: { targetRole: true, targetLocations: true },
  });
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const roleLower = ctx?.targetRole?.toLowerCase().trim();
  const cityLower = ctx?.targetLocations?.[0]?.toLowerCase().trim();

  const posts = await prisma.jobPost.findMany({
    where: {
      status: "ACTIVE",
      createdAt: { gte: since },
      ...(roleLower
        ? { title: { contains: roleLower, mode: "insensitive" } }
        : {}),
      ...(cityLower
        ? { locations: { has: cityLower } }
        : {}),
    },
    select: { createdAt: true },
  });

  if (posts.length < HEATMAP_MIN_JOBS) return null;

  const matrix = buildHeatmapFromDates(posts.map((p) => p.createdAt));
  const periodHeatmap = toPeriodHeatmap(matrix);
  const best = getBestPeriod(periodHeatmap);

  return {
    periodHeatmap,
    rawMatrix: matrix,
    totalJobs: posts.length,
    bestPeriod: best
      ? {
          day: best.day,
          period: best.period,
          count: best.count,
        }
      : null,
  };
}

/**
 * Assemble weekly digest data from snapshot + fresh bits.
 * BL-2: Adds new job matches (from SavedSearch/JobAlert or target role) and platform stats.
 */
export async function computeWeeklyDigest(
  userId: string
): Promise<WeeklyDigestData | null> {
  const [user, snapshot, firstAlert, careerContext, jobCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.candidateInsightSnapshot.findUnique({
      where: { userId },
    }),
    prisma.jobAlert.findFirst({
      where: { userId, active: true },
      select: { query: true, filters: true },
    }),
    prisma.userCareerContext.findUnique({
      where: { userId },
      select: { targetRole: true },
    }),
    prisma.jobPost.count({
      where: {
        status: "ACTIVE",
        publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);
  if (!user) return null;

  const firstName = user.name?.split(" ")[0] ?? "there";
  const dashboardUrl =
    `${process.env.NEXTAUTH_URL ?? ""}/dashboard/seeker`.replace(/\/\/+/, "/");

  let marketValue: MarketValueResult | null = null;
  if (snapshot?.marketValueMin != null && snapshot.marketValueMax != null) {
    marketValue = {
      min: snapshot.marketValueMin,
      max: snapshot.marketValueMax,
      median: snapshot.marketValueMedian ?? 0,
      basis: snapshot.marketValueBasis ?? "",
      sourceLabel: "Community reported",
    };
  }

  const visibilityScore = snapshot?.visibilityScore ?? null;
  const recs = snapshot?.visibilityFactors as { recommendations?: string[] } | null;
  const topRecommendation =
    Array.isArray(recs?.recommendations) && recs.recommendations[0]
      ? recs.recommendations[0]
      : null;

  const skillsGapStored = snapshot?.skillsGapData as
    | { items?: SkillsGapItem[] }
    | null;
  const topMissingSkills = Array.isArray(skillsGapStored?.items)
    ? skillsGapStored.items.slice(0, 5)
    : [];

  const appPerf = snapshot?.appPerformanceData as
    | { applied?: number; responseRate?: number }
    | null;
  const appliedThisPeriod = typeof appPerf?.applied === "number" ? appPerf.applied : 0;
  const responseRate =
    typeof appPerf?.responseRate === "number" ? appPerf.responseRate : null;

  const heatmap = snapshot?.heatmapData as
    | { bestPeriod?: { day: string; period: string } }
    | null;
  let bestTimeLine: string | null = null;
  if (heatmap?.bestPeriod) {
    const { day, period } = heatmap.bestPeriod;
    const dayLabel =
      day.charAt(0).toUpperCase() + day.slice(1);
    bestTimeLine = `Most jobs posted ${dayLabel} ${period}`;
  }

  // BL-2: New job matches from saved search / target role
  let newJobMatches: WeeklyDigestJobMatch[] | undefined;
  try {
    const { searchJobs } = await import("@/lib/search/queries/jobs");
    const searchQuery = firstAlert?.query ?? careerContext?.targetRole ?? "jobs";
    const filters = (firstAlert?.filters ?? {}) as Record<string, unknown>;
    const result = await searchJobs({
      q: searchQuery,
      limit: 5,
      datePosted: "7d",
      location: typeof filters.location === "string" ? filters.location : undefined,
    });
    const ids = result.hits.slice(0, 5).map((h) => parseInt(h.id, 10));
    const slugs = await prisma.jobPost.findMany({
      where: { id: { in: ids } },
      select: { id: true, slug: true },
    });
    const slugById = new Map(slugs.map((s) => [s.id, s.slug]));
    newJobMatches = result.hits.slice(0, 5).map((h) => ({
      title: h.title,
      companyName: h.companyName ?? "Company",
      slug: slugById.get(parseInt(h.id, 10)) ?? h.id,
    }));
    if (newJobMatches.length === 0) newJobMatches = undefined;
  } catch {
    // Typesense may be unavailable; skip job matches
  }

  return {
    firstName,
    marketValue,
    visibilityScore,
    topRecommendation,
    topMissingSkills,
    appliedThisPeriod,
    responseRate,
    bestTimeLine,
    dashboardUrl,
    newJobMatches,
    platformStats: { newJobsThisWeek: jobCount },
  };
}

/**
 * Save full snapshot (used by worker).
 */
export async function saveSnapshot(
  userId: string,
  data: {
    marketValue?: MarketValueResult | null;
    visibility?: VisibilityScoreResult | null;
    skillsGap?: SkillsGapResult | null;
    appPerformance?: AppPerformanceResult | null;
    heatmap?: HeatmapResult | null;
  }
): Promise<void> {
  const now = new Date();
  await prisma.candidateInsightSnapshot.upsert({
    where: { userId },
    create: {
      userId,
      marketValueMin: data.marketValue?.min ?? null,
      marketValueMax: data.marketValue?.max ?? null,
      marketValueMedian: data.marketValue?.median ?? null,
      marketValueBasis: data.marketValue?.basis ?? null,
      marketValueAt: data.marketValue ? now : null,
      visibilityScore: data.visibility?.score ?? null,
      visibilityFactors: data.visibility
        ? ({
            ...data.visibility.factors,
            recommendations: data.visibility.recommendations,
          } as unknown as Prisma.InputJsonValue)
        : undefined,
      skillsGapData: data.skillsGap
        ? ({
            targetRole: data.skillsGap.targetRole,
            totalJDs: data.skillsGap.totalJDs,
            items: data.skillsGap.items ?? [],
          } as unknown as Prisma.InputJsonValue)
        : undefined,
      skillsGapAt: data.skillsGap ? now : null,
      appPerformanceData: data.appPerformance
        ? {
            applied: data.appPerformance.applied,
            viewed: data.appPerformance.viewed,
            shortlisted: data.appPerformance.shortlisted,
            rejected: data.appPerformance.rejected,
            responseRate: data.appPerformance.responseRate,
            avgDaysToResponse: data.appPerformance.avgDaysToResponse,
            shortlistRate: data.appPerformance.shortlistRate,
          }
        : undefined,
      appPerformanceAt: data.appPerformance ? now : null,
      heatmapData: data.heatmap
        ? {
            periodHeatmap: data.heatmap.periodHeatmap,
            bestPeriod: data.heatmap.bestPeriod,
            totalJobs: data.heatmap.totalJobs,
          }
        : undefined,
      heatmapAt: data.heatmap ? now : null,
      computedAt: now,
      updatedAt: now,
    },
    update: {
      marketValueMin: data.marketValue?.min ?? undefined,
      marketValueMax: data.marketValue?.max ?? undefined,
      marketValueMedian: data.marketValue?.median ?? undefined,
      marketValueBasis: data.marketValue?.basis ?? undefined,
      marketValueAt: data.marketValue ? now : undefined,
      visibilityScore: data.visibility?.score ?? undefined,
      visibilityFactors: data.visibility
        ? ({
            ...data.visibility.factors,
            recommendations: data.visibility.recommendations,
          } as unknown as Prisma.InputJsonValue)
        : undefined,
      skillsGapData: data.skillsGap
        ? ({
            targetRole: data.skillsGap.targetRole,
            totalJDs: data.skillsGap.totalJDs,
            items: data.skillsGap.items ?? [],
          } as unknown as Prisma.InputJsonValue)
        : undefined,
      skillsGapAt: data.skillsGap ? now : undefined,
      appPerformanceData: data.appPerformance
        ? {
            applied: data.appPerformance.applied,
            viewed: data.appPerformance.viewed,
            shortlisted: data.appPerformance.shortlisted,
            rejected: data.appPerformance.rejected,
            responseRate: data.appPerformance.responseRate,
            avgDaysToResponse: data.appPerformance.avgDaysToResponse,
            shortlistRate: data.appPerformance.shortlistRate,
          }
        : undefined,
      appPerformanceAt: data.appPerformance ? now : undefined,
      heatmapData: data.heatmap
        ? {
            periodHeatmap: data.heatmap.periodHeatmap,
            bestPeriod: data.heatmap.bestPeriod,
            totalJobs: data.heatmap.totalJobs,
          }
        : undefined,
      heatmapAt: data.heatmap ? now : undefined,
      computedAt: now,
      updatedAt: now,
    },
  });
}
