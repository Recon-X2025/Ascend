import { Worker, type Job } from "bullmq";
import { prisma } from "@/lib/prisma/client";
import { complete } from "@/lib/ai/openai";
import {
  buildCoverLetterMessages,
  PROMPT_VERSION,
  type CoverLetterPromptInputs,
} from "@/lib/ai/prompts/cover-letter";
import { trackAIInteraction } from "@/lib/tracking/outcomes";
import type { CoverLetterJobData } from "../index";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const coverLetterWorker = new Worker<CoverLetterJobData>(
  "cover-letter",
  async (job: Job<CoverLetterJobData>) => {
    const { userId, jobPostId, resumeVersionId, optionalNote } = job.data;

    const [user, jobPost, profile, careerIntent, fitScore] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { name: true },
      }),
      prisma.jobPost.findUniqueOrThrow({
        where: { id: jobPostId },
        include: { companyRef: { select: { name: true } } },
      }),
      prisma.jobSeekerProfile.findUnique({
        where: { userId },
        include: {
          experiences: {
            orderBy: [{ isCurrent: "desc" }, { endYear: "desc" }, { startYear: "desc" }],
            take: 3,
          },
          skills: { include: { skill: true }, take: 15 },
        },
      }),
      prisma.careerIntent.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.fitScore.findUnique({
        where: { userId_jobPostId: { userId, jobPostId } },
        select: { strengths: true },
      }),
    ]);

    const parsedJD = await prisma.parsedJD.findFirst({
      where: { title: { contains: jobPost.title.slice(0, 50), mode: "insensitive" } },
    });

    const companyName = jobPost.companyRef?.name ?? jobPost.companyName ?? "Company";
    const keyResponsibilities = parsedJD?.responsibilities
      ? (Array.isArray(parsedJD.responsibilities) ? parsedJD.responsibilities : []) as string[]
      : [];
    const jdTone = parsedJD?.tone ?? "formal";
    if (keyResponsibilities.length === 0 && jobPost.description) {
      const lines = jobPost.description
        .split(/\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20 && s.length < 300);
      keyResponsibilities.push(...lines.slice(0, 8));
    }

    const topExperiences = (profile?.experiences ?? []).map((e) => ({
      title: e.designation ?? "",
      company: e.company ?? "",
      bullets: (e.achievements?.length ? e.achievements : e.description ? [e.description] : []).slice(0, 3),
    }));
    const strengths = (fitScore?.strengths as string[] | null) ?? [];
    const topMatchedSkills =
      strengths.length > 0
        ? strengths.slice(0, 8)
        : (profile?.skills ?? []).map((s) => s.skill.name).slice(0, 8);
    const targetRole = careerIntent?.targetRole ?? profile?.currentRole ?? "professional";

    const inputs: CoverLetterPromptInputs = {
      candidateName: user.name ?? "Candidate",
      targetRole,
      companyName,
      roleTitle: jobPost.title,
      keyResponsibilities,
      jdTone,
      topExperiences,
      topMatchedSkills,
      optionalNote: optionalNote ?? undefined,
    };

    const { system, user: userMsg } = buildCoverLetterMessages(inputs);
    const startedAt = Date.now();
    const { text: content, usage } = await complete(system, userMsg, 1024);

    await trackAIInteraction(userId, "COVER_LETTER", PROMPT_VERSION, {
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
      metadata: { jobPostId },
    });

    const generatedFrom = resumeVersionId ?? "profile";
    await prisma.coverLetter.upsert({
      where: { userId_jobPostId: { userId, jobPostId } },
      create: {
        userId,
        jobPostId,
        content: content.trim(),
        tone: jdTone,
        generatedFrom,
      },
      update: {
        content: content.trim(),
        tone: jdTone,
        generatedFrom,
      },
    });
  },
  { connection }
);

coverLetterWorker.on("completed", (job) => {
  console.log("[CoverLetterWorker] Job completed:", job.id);
});

coverLetterWorker.on("failed", (job, err) => {
  console.error("[CoverLetterWorker] Job failed:", job?.id, err.message);
});
