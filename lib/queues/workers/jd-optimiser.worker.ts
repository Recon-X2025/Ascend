import { Worker, type Job } from "bullmq";
import { prisma } from "@/lib/prisma/client";
import { openai } from "@/lib/ai/openai";
import { GPT4O } from "@/lib/ai/openai";
import {
  JD_OPTIMISER_SYSTEM_PROMPT,
  JD_OPTIMISER_USER_PROMPT,
} from "@/lib/ai/prompts/jd-optimiser";
import { trackAIInteraction, trackOutcome } from "@/lib/tracking/outcomes";
import { notifyResumeOptimised } from "@/lib/notifications/create";
import type { Prisma } from "@prisma/client";
import { OutcomeEventType } from "@prisma/client";
import type { JdOptimiserJobData } from "../jd-optimiser.queue";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const JD_OPTIMISER_PROMPT_VERSION = "phase-6a";

export const jdOptimiserWorker = new Worker<JdOptimiserJobData>(
  "jd-optimiser",
  async (job: Job<JdOptimiserJobData>) => {
    const { sessionId, userId, jobPostId, baseVersionId } = job.data;

    await prisma.optimisationSession.update({
      where: { id: sessionId },
      data: { status: "PROCESSING" },
    });

    try {
      const [baseVersion, jobPost, profile] = await Promise.all([
        prisma.resumeVersion.findUniqueOrThrow({ where: { id: baseVersionId } }),
        prisma.jobPost.findUniqueOrThrow({
          where: { id: jobPostId },
          include: { skills: { include: { skill: true } } },
        }),
        prisma.jobSeekerProfile.findUniqueOrThrow({
          where: { userId },
          include: {
            experiences: {
              orderBy: [{ isCurrent: "desc" }, { endYear: "desc" }, { startYear: "desc" }],
            },
            skills: { include: { skill: true } },
            educations: { orderBy: { order: "asc" } },
            projects: { orderBy: { order: "asc" } },
          },
        }),
      ]);

      const requiredSkills = jobPost.skills.map((s) => s.skill.name);

      const promptInput = {
        jobTitle: jobPost.title,
        jobDescription: jobPost.description,
        requiredSkills,
        profileData: {
          summary: profile.summary ?? "",
          experience: profile.experiences.map((exp, i) => {
            const bullets = exp.achievements?.length
              ? exp.achievements
              : exp.description
                ? [exp.description]
                : [];
            return {
              index: i,
              title: exp.designation,
              company: exp.company,
              bullets: bullets.map((text, j) => ({ index: j, text })),
            };
          }),
          skills: profile.skills.map((s) => s.skill.name),
          education: profile.educations.map((e, i) => ({
            index: i,
            degree: e.degree ?? "",
            institution: e.institution,
          })),
          projects: profile.projects.map((p, i) => ({
            index: i,
            name: p.name,
            description: p.description ?? "",
          })),
        },
        baseResumeSections: (baseVersion.contentSnapshot as Record<string, unknown>) ?? {},
      };

      const startedAt = Date.now();

      const completion = await openai.chat.completions.create({
        model: GPT4O,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: JD_OPTIMISER_SYSTEM_PROMPT },
          { role: "user", content: JD_OPTIMISER_USER_PROMPT(promptInput) },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });

      const rawOutput = completion.choices[0]?.message?.content ?? "{}";
      const optimisedContent = JSON.parse(rawOutput) as {
        rewrittenSummary?: { text?: string };
        rewrittenBullets?: Array<{
          experienceIndex: number;
          bulletIndex: number;
          rewrittenText: string;
          sourceRef: string;
        }>;
        prioritisedSkills?: { jdRelevant?: string[]; other?: string[] };
        presentKeywords?: string[];
        missingKeywords?: Array<{ keyword: string }>;
        optimisationSummary?: {
          bulletsRewritten?: number;
          fabricationBlockedCount?: number;
        };
      };

      await trackAIInteraction(userId, "JD_OPTIMISER", JD_OPTIMISER_PROMPT_VERSION, {
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
        latencyMs: Date.now() - startedAt,
        metadata: { jobPostId, baseVersionId, sessionId },
      });

      const baseContent = (baseVersion.contentSnapshot as Record<string, unknown>) ?? {};
      const baseExperiences = (baseContent.experiences as unknown[]) ?? [];
      const mergedContent = {
        ...baseContent,
        summary:
          optimisedContent.rewrittenSummary?.text ?? (baseContent.summary as string),
        skills: optimisedContent.prioritisedSkills
          ? [
              ...(optimisedContent.prioritisedSkills.jdRelevant ?? []),
              ...(optimisedContent.prioritisedSkills.other ?? []),
            ]
          : (baseContent.skills as string[] | undefined),
        experiences: mergeRewrittenBullets(
          baseExperiences,
          optimisedContent.rewrittenBullets ?? []
        ),
        _optimisationMeta: {
          rewrittenBullets: optimisedContent.rewrittenBullets,
          presentKeywords: optimisedContent.presentKeywords,
          missingKeywords: optimisedContent.missingKeywords,
          summary: optimisedContent.optimisationSummary,
        },
      };

      const newVersion = await prisma.resumeVersion.create({
        data: {
          userId,
          careerIntentId: baseVersion.careerIntentId,
          jobPostId,
          optimisedFrom: baseVersionId,
          name: `${jobPost.title} — Optimised`,
          templateId: baseVersion.templateId,
          contentSnapshot: mergedContent as Prisma.InputJsonValue,
          status: baseVersion.status,
          optimisationMeta: {
            fitScoreBefore: null,
            fitScoreAfter: null,
            keywordsAdded: optimisedContent.presentKeywords ?? [],
            keywordsGapped: (optimisedContent.missingKeywords ?? []).map(
              (m) => m.keyword
            ),
            bulletsRewritten:
              optimisedContent.optimisationSummary?.bulletsRewritten ?? 0,
            summaryRewritten: true,
          },
        },
      });

      await prisma.optimisationSession.update({
        where: { id: sessionId },
        data: {
          status: "DONE",
          outputVersionId: newVersion.id,
          gapAnalysis: {
            present: optimisedContent.presentKeywords ?? [],
            missing: (optimisedContent.missingKeywords ?? []).map((m) => m.keyword),
            rewritten:
              optimisedContent.optimisationSummary?.bulletsRewritten ?? 0,
            fabricationBlockedCount:
              optimisedContent.optimisationSummary?.fabricationBlockedCount ?? 0,
          },
        },
      });

      await trackOutcome(userId, OutcomeEventType.RESUME_OPTIMISED, {
        metadata: {
          sessionId,
          jobPostId,
          baseVersionId,
          outputVersionId: newVersion.id,
          bulletsRewritten:
            optimisedContent.optimisationSummary?.bulletsRewritten ?? 0,
          keywordsCovered: optimisedContent.presentKeywords?.length ?? 0,
          keywordsGapped: optimisedContent.missingKeywords?.length ?? 0,
        },
      });

      await notifyResumeOptimised(userId, jobPost.title, sessionId);

      return { sessionId, outputVersionId: newVersion.id };
    } catch (error) {
      await prisma.optimisationSession.update({
        where: { id: sessionId },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error;
    }
  },
  { connection }
);

function mergeRewrittenBullets(
  baseExperiences: unknown[],
  rewrittenBullets: Array<{
    experienceIndex: number;
    bulletIndex: number;
    rewrittenText: string;
    sourceRef: string;
  }>
): unknown[] {
  const experiences = JSON.parse(JSON.stringify(baseExperiences)) as unknown[];

  for (const rb of rewrittenBullets) {
    const exp = experiences[rb.experienceIndex] as Record<string, unknown> | undefined;
    if (!exp || !Array.isArray(exp.bullets)) continue;
    const bullet = (exp.bullets as Record<string, unknown>[])[rb.bulletIndex];
    if (!bullet) continue;
    bullet.text = rb.rewrittenText;
    (bullet as Record<string, unknown>)._sourceRef = rb.sourceRef;
    (bullet as Record<string, unknown>)._optimised = true;
  }

  return experiences;
}

jdOptimiserWorker.on("completed", (job) => {
  console.log("[JdOptimiserWorker] Job completed:", job.id);
});

jdOptimiserWorker.on("failed", (job, err) => {
  console.error("[JdOptimiserWorker] Job failed:", job?.id, err.message);
});
