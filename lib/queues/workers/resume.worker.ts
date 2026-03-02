import { Worker } from "bullmq";
import type { ResumeJobData, ResumeGenerateContentPayload, ResumeGenerateSummaryPayload } from "../index";
import { prisma } from "@/lib/prisma/client";
import { completeJSON } from "@/lib/ai/openai";
import { buildExperienceBulletPrompt, RESUME_CONTENT_PROMPT_VERSION } from "@/lib/ai/prompts/resume-content";
import { buildSummaryPrompt, RESUME_SUMMARY_PROMPT_VERSION } from "@/lib/ai/prompts/resume-summary";
import { trackAIInteraction } from "@/lib/tracking/outcomes";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const MAX_REGENERATIONS_PER_ITEM = 3;

type ResumePayload = ResumeJobData | ResumeGenerateContentPayload | ResumeGenerateSummaryPayload;

function isGenerateContent(data: ResumePayload): data is ResumeGenerateContentPayload {
  return (data as ResumeGenerateContentPayload).jobType === "generate-content";
}

function isGenerateSummary(data: ResumePayload): data is ResumeGenerateSummaryPayload {
  return (data as ResumeGenerateSummaryPayload).jobType === "generate-summary";
}

async function processGenerateContent(
  job: { id: string; data: ResumeGenerateContentPayload }
): Promise<{
  resumeVersionId: string;
  status: "DRAFT";
  experiences: Record<
    string,
    { rewrittenBullets: string[]; actionVerbs: string[]; transferableSkillSurfaced?: boolean }
  >;
}> {
  const { userId, careerIntentId, selectedItems, condenseExperienceIds = [], regenerateExperienceId, regenerationCount = 0 } = job.data;

  if (regenerationCount > MAX_REGENERATIONS_PER_ITEM) {
    throw new Error(`Max ${MAX_REGENERATIONS_PER_ITEM} regenerations per item exceeded`);
  }

  const intent = await prisma.careerIntent.findUnique({
    where: { id: careerIntentId },
    include: {
      profile: {
        include: {
          experiences: {
            where: { id: { in: selectedItems.experiences } },
            orderBy: [{ isCurrent: "desc" }, { endYear: "desc" }, { startYear: "desc" }],
          },
        },
      },
      resumeVersions: {
        where: {},
        take: 1,
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!intent || intent.userId !== userId) {
    throw new Error("Career intent not found or access denied");
  }

  const experiences = intent.profile.experiences;
  const experienceIdsToProcess = regenerateExperienceId
    ? experiences.filter((e) => e.id === regenerateExperienceId).map((e) => e.id)
    : selectedItems.experiences.filter((id) => experiences.some((e) => e.id === id));

  const condenseSet = new Set(condenseExperienceIds ?? []);
  const results: Record<string, { company: string; designation: string; rewrittenBullets: string[]; actionVerbs: string[]; transferableSkillSurfaced?: boolean; originalBullets: string[] }> = {};

  type SnapshotShape = {
    status: string;
    experiences?: Record<string, { rewrittenBullets: string[]; actionVerbs: string[]; transferableSkillSurfaced?: boolean; originalBullets?: string[]; company?: string; designation?: string }>;
  };
  let existingSnapshot: SnapshotShape | null = null;
  if (regenerateExperienceId && intent.resumeVersions[0]?.contentSnapshot) {
    const raw = intent.resumeVersions[0].contentSnapshot as unknown;
    if (raw && typeof raw === "object" && "experiences" in raw) existingSnapshot = raw as SnapshotShape;
  }

  for (const expId of experienceIdsToProcess) {
    const exp = experiences.find((e) => e.id === expId);
    if (!exp) continue;

    const bullets = exp.achievements?.length ? exp.achievements : (exp.description ? [exp.description] : []);
    const condenseToMax = condenseSet.has(expId) ? 2 : undefined;

    const { system, user } = buildExperienceBulletPrompt({
      experienceId: exp.id,
      company: exp.company,
      designation: exp.designation,
      bullets,
      condenseToMaxBullets: condenseToMax,
      switchingIndustry: intent.switchingIndustry,
      fromIndustry: intent.fromIndustry,
      toIndustry: intent.toIndustry,
      targetRole: intent.targetRole,
      targetIndustry: intent.targetIndustry,
    });

    const start = Date.now();
    const { data, usage } = await completeJSON<{
      rewrittenBullets: string[];
      actionVerbs: string[];
      transferableSkillSurfaced?: boolean;
    }>(system, user, 1024);
    const latencyMs = Date.now() - start;

    await trackAIInteraction(userId, "RESUME_BUILDER", RESUME_CONTENT_PROMPT_VERSION, {
      inputTokens: usage?.prompt_tokens,
      outputTokens: usage?.completion_tokens,
      latencyMs,
      metadata: { jobId: job.id, experienceId: exp.id },
    });

    const originalBullets = exp.achievements?.length ? exp.achievements : (exp.description ? [exp.description] : []);
    results[exp.id] = {
      company: exp.company,
      designation: exp.designation,
      rewrittenBullets: data.rewrittenBullets ?? [],
      actionVerbs: data.actionVerbs ?? [],
      transferableSkillSurfaced: data.transferableSkillSurfaced,
      originalBullets,
    };
  }

  type ExpContent = { company?: string; designation?: string; rewrittenBullets: string[]; actionVerbs: string[]; transferableSkillSurfaced?: boolean; originalBullets?: string[] };
  const mergedExperiences: Record<string, ExpContent> = existingSnapshot?.experiences
    ? { ...existingSnapshot.experiences, ...results }
    : results;
  for (const expId of Object.keys(mergedExperiences)) {
    const entry = mergedExperiences[expId];
    if (entry.originalBullets?.length !== undefined) continue;
    const exp = experiences.find((e) => e.id === expId);
    entry.originalBullets = exp?.achievements?.length ? exp.achievements : (exp?.description ? [exp.description] : []);
    if (exp && !entry.company) {
      entry.company = exp.company;
      entry.designation = exp.designation;
    }
  }

  const contentSnapshot = {
    status: "DRAFT" as const,
    experiences: mergedExperiences,
  };

  const versionName = intent.targetRole ? `Draft — ${intent.targetRole}` : "Draft";
  let resumeVersion = intent.resumeVersions[0];
  if (resumeVersion) {
    resumeVersion = await prisma.resumeVersion.update({
      where: { id: resumeVersion.id },
      data: { contentSnapshot: contentSnapshot as object, lastUpdatedAt: new Date(), name: versionName },
    });
  } else {
    resumeVersion = await prisma.resumeVersion.create({
      data: {
        userId,
        careerIntentId,
        name: versionName,
        contentSnapshot: contentSnapshot as object,
        lastUpdatedAt: new Date(),
      },
    });
  }

  return {
    resumeVersionId: resumeVersion.id,
    status: "DRAFT",
    experiences: mergedExperiences,
  };
}

/** Extract top 2–3 value props from rewritten experience bullets for summary prompt. */
function extractValueProps(
  experiences: Record<string, { rewrittenBullets?: string[] }>
): string[] {
  const bullets: string[] = [];
  for (const exp of Object.values(experiences)) {
    const list = exp.rewrittenBullets ?? [];
    for (const b of list) {
      if (b && typeof b === "string") bullets.push(b);
    }
  }
  return bullets.slice(0, 3);
}

async function processGenerateSummary(
  job: { id: string; data: ResumeGenerateSummaryPayload }
): Promise<{ summaries: string[] }> {
  const { userId, careerIntentId } = job.data;

  const intent = await prisma.careerIntent.findUnique({
    where: { id: careerIntentId },
    include: {
      resumeVersions: {
        take: 1,
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!intent || intent.userId !== userId) {
    throw new Error("Career intent not found or access denied");
  }

  const latest = intent.resumeVersions[0];
  const raw = latest?.contentSnapshot as unknown;
  type SnapshotWithExperiences = {
    status?: string;
    experiences?: Record<string, { rewrittenBullets?: string[] }>;
    summaries?: string[];
    selectedSummaryIndex?: number;
  };
  const contentSnapshot: SnapshotWithExperiences =
    raw && typeof raw === "object" && "experiences" in raw
      ? (raw as SnapshotWithExperiences)
      : {};

  const experiences = contentSnapshot.experiences ?? {};
  const valueProps = extractValueProps(experiences);

  const { system, user } = buildSummaryPrompt({
    targetRole: intent.targetRole,
    targetIndustry: intent.targetIndustry,
    careerGoal: intent.careerGoal,
    switchingIndustry: intent.switchingIndustry,
    fromIndustry: intent.fromIndustry ?? null,
    toIndustry: intent.toIndustry ?? null,
    valueProps,
  });

  const start = Date.now();
  const { data, usage } = await completeJSON<{ summaries: string[] }>(system, user, 1024);
  const latencyMs = Date.now() - start;

  await trackAIInteraction(userId, "RESUME_BUILDER", RESUME_SUMMARY_PROMPT_VERSION, {
    inputTokens: usage?.prompt_tokens,
    outputTokens: usage?.completion_tokens,
    latencyMs,
    metadata: { jobId: job.id, type: "generate-summary" },
  });

  const summaries = Array.isArray(data.summaries) ? data.summaries.slice(0, 3) : [];
  const mergedSnapshot = {
    ...contentSnapshot,
    status: contentSnapshot.status ?? "DRAFT",
    experiences: contentSnapshot.experiences ?? {},
    summaries,
    selectedSummaryIndex: 0,
  };

  if (latest) {
    await prisma.resumeVersion.update({
      where: { id: latest.id },
      data: { contentSnapshot: mergedSnapshot as object, lastUpdatedAt: new Date() },
    });
  } else {
    await prisma.resumeVersion.create({
      data: {
        userId,
        careerIntentId,
        name: intent.targetRole ? `Draft — ${intent.targetRole}` : "Draft",
        contentSnapshot: mergedSnapshot as object,
        lastUpdatedAt: new Date(),
      },
    });
  }

  return { summaries };
}

export const resumeWorker = new Worker<ResumePayload>(
  "resume",
  async (job) => {
    if (isGenerateContent(job.data)) {
      return processGenerateContent(job as { id: string; data: ResumeGenerateContentPayload });
    }
    if (isGenerateSummary(job.data)) {
      return processGenerateSummary(job as { id: string; data: ResumeGenerateSummaryPayload });
    }
    console.log("[ResumeWorker] Unknown job type:", (job.data as ResumeJobData).careerIntentId);
    throw new Error("Resume worker: job type not implemented");
  },
  { connection }
);

resumeWorker.on("completed", (job) => {
  console.log("[ResumeWorker] Job completed:", job.id);
});

resumeWorker.on("failed", (job, err) => {
  console.error("[ResumeWorker] Job failed:", job?.id, err.message);
});
