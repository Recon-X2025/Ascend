import { Worker, type Job } from "bullmq";
import { prisma } from "@/lib/prisma/client";
import { completeJSON } from "@/lib/ai/openai";
import {
  buildPrompt,
  PROMPT_VERSION,
  type InterviewPrepPromptInputs,
} from "@/lib/ai/prompts/interview-prep";
import { trackAIInteraction } from "@/lib/tracking/outcomes";
import type { InterviewPrepJobData } from "../index";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

interface InterviewPrepOutput {
  expectQuestions: Array<{ question: string; category: string; why: string }>;
  askQuestions: Array<{ question: string }>;
}

export const interviewPrepWorker = new Worker<InterviewPrepJobData>(
  "interview-prep",
  async (job: Job<InterviewPrepJobData>) => {
    const { userId, jobPostId } = job.data;

    const [jobPostRow, fitScore, profile] = await Promise.all([
      prisma.jobPost.findUniqueOrThrow({
        where: { id: jobPostId },
        include: { companyRef: { select: { name: true } } },
      }),
      prisma.fitScore.findUnique({
        where: { userId_jobPostId: { userId, jobPostId } },
        select: {
          skillsScore: true,
          experienceScore: true,
          educationScore: true,
          skillGaps: true,
          experienceGaps: true,
        },
      }),
      prisma.jobSeekerProfile.findUnique({
        where: { userId },
        include: {
          experiences: {
            orderBy: [{ isCurrent: "desc" }, { endYear: "desc" }],
            take: 3,
          },
        },
      }),
    ]);

    const parsedJD = await prisma.parsedJD.findFirst({
      where: { title: { contains: jobPostRow.title.slice(0, 50), mode: "insensitive" } },
    });

    const responsibilities = parsedJD?.responsibilities
      ? (Array.isArray(parsedJD.responsibilities) ? parsedJD.responsibilities : []) as string[]
      : [];
    if (responsibilities.length === 0 && jobPostRow.description) {
      const lines = jobPostRow.description.split(/\n/).map((s) => s.trim()).filter((s) => s.length > 15);
      responsibilities.push(...lines.slice(0, 6));
    }
    const mustHaveSkills = parsedJD?.skills
      ? ((parsedJD.skills as { mustHave?: string[] }).mustHave ?? []).slice(0, 10)
      : [];
    const fitGaps: string[] = [];
    if (fitScore) {
      if ((fitScore.skillsScore ?? 0) < 20) fitGaps.push("Skills match is low");
      if ((fitScore.experienceScore ?? 0) < 20) fitGaps.push("Experience match is low");
      if ((fitScore.educationScore ?? 0) < 5) fitGaps.push("Education match is low");
      const sg = (fitScore.skillGaps as Array<{ name?: string }>) ?? [];
      if (sg.length > 0) fitGaps.push(`Missing skills: ${sg.slice(0, 3).map((s) => s.name ?? "").join(", ")}`);
    }
    const skillGaps = (fitScore?.skillGaps as Array<{ name?: string }>) ?? [];
    const biggestSkillGap = skillGaps.length > 0 ? (skillGaps[0].name ?? null) : null;
    const experienceSummary = (profile?.experiences ?? [])
      .map((e) => `${e.designation} at ${e.company}: ${(e.achievements ?? [e.description]).filter(Boolean).join("; ")}`)
      .join(". ");

    const inputs: InterviewPrepPromptInputs = {
      roleTitle: jobPostRow.title,
      seniority: parsedJD?.seniority ?? null,
      responsibilities,
      mustHaveSkills,
      companyType: parsedJD?.companySize ?? (jobPostRow.companyRef?.name ? "company" : null),
      fitGaps,
      biggestSkillGap,
      experienceSummary: experienceSummary.slice(0, 800),
    };

    const { system, user } = buildPrompt(inputs);
    const startedAt = Date.now();
    const { data, usage } = await completeJSON<InterviewPrepOutput>(system, user, 2048);

    await trackAIInteraction(userId, "INTERVIEW_PREP", PROMPT_VERSION, {
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
      metadata: { jobPostId },
    });

    await prisma.interviewPrep.upsert({
      where: { userId_jobPostId: { userId, jobPostId } },
      create: {
        userId,
        jobPostId,
        expectQuestions: (data.expectQuestions ?? []) as object,
        askQuestions: (data.askQuestions ?? []) as object,
      },
      update: {
        expectQuestions: (data.expectQuestions ?? []) as object,
        askQuestions: (data.askQuestions ?? []) as object,
      },
    });
  },
  { connection }
);

interviewPrepWorker.on("completed", (job) => {
  console.log("[InterviewPrepWorker] Job completed:", job.id);
});

interviewPrepWorker.on("failed", (job, err) => {
  console.error("[InterviewPrepWorker] Job failed:", job?.id, err.message);
});
