/**
 * Phase 11: Smart job recommendations — composition of CareerIntent, skills, fit score.
 * No new AI call; uses existing getFitScore and job listing.
 */

import { prisma } from "@/lib/prisma/client";
import { getFitScore } from "@/lib/fit-score/service";

const RECOMMENDED_POOL_SIZE = 25;
const RECOMMENDED_TOP = 5;
const MIN_FIT_SCORE = 60;
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

export interface RecommendedJobItem {
  id: number;
  title: string;
  slug: string;
  companyName: string;
  companySlug: string | null;
  locations: string[];
  type: string;
  workMode: string;
  fitScore: number;
  matchingSkills: string[];
}

export async function getRecommendedJobs(userId: string): Promise<RecommendedJobItem[]> {
  const [context, , appliedIds, savedIds, dismissedIds] = await Promise.all([
    prisma.userCareerContext.findUnique({
      where: { userId },
      select: { targetRole: true, targetLocations: true },
    }),
    prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: { id: true },
    }),
    prisma.jobApplication.findMany({
      where: { applicantId: userId },
      select: { jobPostId: true },
    }),
    prisma.savedJob.findMany({
      where: { userId },
      select: { jobPostId: true },
    }),
    prisma.jobDismissal.findMany({
      where: { userId },
      select: { jobPostId: true },
    }),
  ]);

  const excludeIds = new Set<number>([
    ...appliedIds.map((a) => a.jobPostId),
    ...savedIds.map((s) => s.jobPostId),
    ...dismissedIds.map((d) => d.jobPostId),
  ]);

  const targetRole = context?.targetRole?.trim().toLowerCase();
  const jobs = await prisma.jobPost.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: Array.from(excludeIds) },
      ...(targetRole
        ? { title: { contains: targetRole.slice(0, 25), mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: RECOMMENDED_POOL_SIZE,
    include: {
      companyRef: { select: { name: true, slug: true } },
    },
  });

  const scored: Array<{ job: (typeof jobs)[0]; score: number; strengths: string[] }> = [];
  for (const job of jobs) {
    const result = await getFitScore(userId, String(job.id), false);
    if (!result || result.overallScore < MIN_FIT_SCORE) continue;
    const strengths = (result.strengths ?? []) as string[];
    scored.push({
      job,
      score: result.overallScore,
      strengths: strengths.slice(0, 2),
    });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, RECOMMENDED_TOP);

  return top.map(({ job, score, strengths }) => ({
    id: job.id,
    title: job.title,
    slug: job.slug,
    companyName: job.companyRef?.name ?? job.companyName ?? "Company",
    companySlug: job.companyRef?.slug ?? null,
    locations: job.locations ?? [],
    type: job.type,
    workMode: job.workMode,
    fitScore: score,
    matchingSkills: strengths,
  }));
}

export const RECOMMENDED_CACHE_KEY = (userId: string) => `jobs:recommended:${userId}`;
export const RECOMMENDED_CACHE_TTL = CACHE_TTL_SECONDS;
