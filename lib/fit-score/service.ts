/**
 * Phase 5A: Fit score service — orchestrate extract, score, cache, async enrich.
 */

import { prisma } from "@/lib/prisma/client";
import { extractSeekerSignal } from "./extractor";
import { extractJobSignal } from "./job-extractor";
import { computeFitScore } from "./scorer";
import { enrichGapSuggestions } from "./explainer";
import { trackOutcome, updateUserJourney } from "@/lib/tracking/outcomes";
import type { FitScoreResult } from "./scorer";
import type { FitGapItem } from "./types";

const TTL_DAYS = 7;

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function fitScoreToResult(row: {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  keywordsScore: number;
  skillGaps: unknown;
  experienceGaps: unknown;
  keywordGaps: unknown;
  strengths: unknown;
  computedAt: Date;
}): FitScoreResult & { cached: boolean; computedAt: Date } {
  return {
    overallScore: row.overallScore,
    skillsScore: row.skillsScore,
    experienceScore: row.experienceScore,
    educationScore: row.educationScore,
    keywordsScore: row.keywordsScore,
    skillGaps: (row.skillGaps as FitGapItem[]) ?? [],
    experienceGaps: (row.experienceGaps as FitGapItem[]) ?? [],
    keywordGaps: (row.keywordGaps as FitGapItem[]) ?? [],
    strengths: (row.strengths as string[]) ?? [],
    cached: true,
    computedAt: row.computedAt,
  };
}

export async function getFitScore(
  userId: string,
  jobPostId: string,
  forceRefresh?: boolean
): Promise<(FitScoreResult & { cached: boolean; computedAt: Date }) | null> {
  const jobId = typeof jobPostId === "string" ? parseInt(jobPostId, 10) : jobPostId;
  if (Number.isNaN(jobId)) return null;

  const existing = await prisma.fitScore.findUnique({
    where: { userId_jobPostId: { userId, jobPostId: jobId } },
  });

  if (existing && existing.expiresAt > new Date() && !forceRefresh) {
    const seeker = await extractSeekerSignal(userId);
    if (existing.profileVersion === seeker.profileHash) {
      return fitScoreToResult(existing);
    }
  }

  const seekerSignal = await extractSeekerSignal(userId);
  const jobSignal = await extractJobSignal(String(jobId));
  if (!jobSignal) return null;

  const result = computeFitScore(seekerSignal, jobSignal);
  const expiresAt = addDays(new Date(), TTL_DAYS);

  await prisma.fitScore.upsert({
    where: { userId_jobPostId: { userId, jobPostId: jobId } },
    create: {
      userId,
      jobPostId: jobId,
      overallScore: result.overallScore,
      skillsScore: result.skillsScore,
      experienceScore: result.experienceScore,
      educationScore: result.educationScore,
      keywordsScore: result.keywordsScore,
      skillGaps: result.skillGaps as object,
      experienceGaps: result.experienceGaps as object,
      keywordGaps: result.keywordGaps as object,
      strengths: result.strengths as object,
      profileVersion: seekerSignal.profileHash,
      expiresAt,
    },
    update: {
      overallScore: result.overallScore,
      skillsScore: result.skillsScore,
      experienceScore: result.experienceScore,
      educationScore: result.educationScore,
      keywordsScore: result.keywordsScore,
      skillGaps: result.skillGaps as object,
      experienceGaps: result.experienceGaps as object,
      keywordGaps: result.keywordGaps as object,
      strengths: result.strengths as object,
      profileVersion: seekerSignal.profileHash,
      expiresAt,
      computedAt: new Date(),
    },
  });

  await prisma.fitScoreHistory.create({
    data: {
      userId,
      jobPostId: jobId,
      overallScore: result.overallScore,
    },
  });

  updateUserJourney(userId, { fitScoresRun: 1 }).catch(() => {});
  trackOutcome(userId, "FIT_SCORE_CALCULATED", {
    entityId: String(jobId),
    entityType: "JobPost",
    metadata: { overallScore: result.overallScore },
  }).catch(() => {});

  enrichGapSuggestions(
    result.skillGaps,
    jobSignal.jobTitle,
    seekerSignal.currentRole,
    userId
  ).then((enriched) => {
    prisma.fitScore
      .update({
        where: { userId_jobPostId: { userId, jobPostId: jobId } },
        data: { skillGaps: enriched as object },
      })
      .catch((err) => {
        console.error("[FitScore] Failed to update enriched skill gaps:", err);
      });
  });

  return {
    ...result,
    cached: false,
    computedAt: new Date(),
  };
}
