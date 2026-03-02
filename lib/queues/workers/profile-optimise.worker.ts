import { Worker, type Job } from "bullmq";
import { prisma } from "@/lib/prisma/client";
import { completeJSON } from "@/lib/ai/openai";
import {
  buildPrompt,
  PROMPT_VERSION,
  type ProfileOptimiserPromptInputs,
} from "@/lib/ai/prompts/profile-optimiser";
import { trackAIInteraction } from "@/lib/tracking/outcomes";
import type { ProfileOptimiseJobData } from "../index";
import { redis } from "@/lib/redis/client";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const PROFILE_OPTIMISE_CACHE_KEY = (userId: string) => `profile-optimise:${userId}`;
const PROFILE_OPTIMISE_CACHE_TTL = 48 * 60 * 60; // 48 hours

interface ProfileOptimiserOutput {
  headline?: { isForwardFacing?: boolean; suggestion?: string; reason?: string };
  summary?: {
    opensWithTargetRole?: boolean;
    achievementFocused?: boolean;
    suggestion?: string;
    reason?: string;
  };
  skillGaps?: Array<{ skill: string; frequencyPct: number; suggestion: string }>;
  bulletSuggestions?: Array<{
    originalBullet: string;
    suggestedBullet: string;
    reason: string;
  }>;
}

export const profileOptimiseWorker = new Worker<ProfileOptimiseJobData>(
  "profile-optimise",
  async (job: Job<ProfileOptimiseJobData>) => {
    const { userId } = job.data;

    const [profile, careerIntent, fitScores] = await Promise.all([
      prisma.jobSeekerProfile.findUniqueOrThrow({
        where: { userId },
        include: {
          experiences: {
            orderBy: [{ isCurrent: "desc" }, { endYear: "desc" }],
          },
          skills: { include: { skill: true } },
        },
      }),
      prisma.careerIntent.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.fitScore.findMany({
        where: { userId },
        select: { overallScore: true },
      }),
    ]);

    const jds = await prisma.parsedJD.findMany({
      where: {
        title: {
          contains: (careerIntent?.targetRole ?? profile?.currentRole ?? "engineer").slice(0, 30),
          mode: "insensitive",
        },
      },
      take: 50,
      select: { skills: true, keywords: true, responsibilities: true },
    });

    const targetRole = careerIntent?.targetRole ?? profile?.currentRole ?? "professional";
    const userSkillSet = new Set(
      (profile?.skills ?? []).map((s) => (s.skill.normalizedName || s.skill.name).toLowerCase())
    );
    const skillFreq: Record<string, number> = {};
    for (const jd of jds) {
      const skills = jd.skills as { mustHave?: string[]; niceToHave?: string[] };
      const all = [...(skills?.mustHave ?? []), ...(skills?.niceToHave ?? [])];
      for (const sk of all) {
        const n = (sk || "").toLowerCase().trim();
        if (!n) continue;
        skillFreq[n] = (skillFreq[n] ?? 0) + 1;
      }
    }
    const totalJDs = jds.length;
    const topSkillGaps = Object.entries(skillFreq)
      .filter(([name]) => !userSkillSet.has(name))
      .map(([skill, count]) => ({ skill, frequencyPct: totalJDs > 0 ? Math.round((count / totalJDs) * 100) : 0 }))
      .filter((s) => s.frequencyPct >= 60)
      .sort((a, b) => b.frequencyPct - a.frequencyPct)
      .slice(0, 5);

    const allResponsibilities = jds.flatMap((j) =>
      Array.isArray(j.responsibilities) ? (j.responsibilities as string[]) : []
    );
    const jdInsightSummary =
      allResponsibilities.length > 0
        ? `Common responsibilities: ${Array.from(new Set(allResponsibilities)).slice(0, 8).join("; ")}`
        : "No aggregated JD data for this role.";

    const experiences = profile?.experiences ?? [];
    const allBullets: Array<{ role: string; company: string; bullet: string }> = [];
    for (const exp of experiences) {
      const bullets = exp.achievements?.length ? exp.achievements : exp.description ? [exp.description] : [];
      for (const b of bullets) {
        allBullets.push({
          role: exp.designation ?? "",
          company: exp.company ?? "",
          bullet: b,
        });
      }
    }
    const weakBullets = allBullets.slice(-2).length >= 2 ? allBullets.slice(-2) : allBullets.slice(0, 2);

    const avgFitScore =
      fitScores.length > 0
        ? fitScores.reduce((a, f) => a + (f.overallScore ?? 0), 0) / fitScores.length
        : null;

    const inputs: ProfileOptimiserPromptInputs = {
      targetRole,
      currentHeadline: profile?.headline ?? null,
      currentSummary: profile?.summary ?? null,
      topSkillGaps,
      jdInsightSummary,
      weakBullets,
      avgFitScore,
    };

    const { system, user } = buildPrompt(inputs);
    const startedAt = Date.now();
    const { data, usage } = await completeJSON<ProfileOptimiserOutput>(system, user, 2048);

    await trackAIInteraction(userId, "PROFILE_OPTIMISER", PROMPT_VERSION, {
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
      metadata: {},
    });

    const result = {
      headline: data.headline ?? null,
      summary: data.summary ?? null,
      skillGaps: data.skillGaps ?? [],
      bulletSuggestions: data.bulletSuggestions ?? [],
    };

    await prisma.profileOptimiserResult.upsert({
      where: { userId },
      create: {
        userId,
        result: result as object,
        promptVersion: PROMPT_VERSION,
      },
      update: {
        result: result as object,
        promptVersion: PROMPT_VERSION,
        analysedAt: new Date(),
      },
    });

    await redis.setex(PROFILE_OPTIMISE_CACHE_KEY(userId), PROFILE_OPTIMISE_CACHE_TTL, JSON.stringify(result));
  },
  { connection }
);

profileOptimiseWorker.on("completed", (job) => {
  console.log("[ProfileOptimiseWorker] Job completed:", job.id);
});

profileOptimiseWorker.on("failed", (job, err) => {
  console.error("[ProfileOptimiseWorker] Job failed:", job?.id, err.message);
});
