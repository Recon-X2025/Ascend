import { Worker, type Job } from "bullmq";
import type { CandidateIntelligenceJobData } from "../index";
import {
  computeMarketValue,
  computeVisibilityScore,
  computeSkillsGap,
  computeApplicationPerformance,
  computeHeatmap,
  saveSnapshot,
} from "@/lib/intelligence/candidate";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const candidateIntelligenceWorker = new Worker<CandidateIntelligenceJobData>(
  "compute-candidate-intelligence",
  async (job: Job<CandidateIntelligenceJobData>) => {
    const { userId } = job.data;

    let marketValue = null;
    let visibility = null;
    let skillsGap = null;
    let appPerformance = null;
    let heatmap = null;

    try {
      marketValue = await computeMarketValue(userId);
    } catch (e) {
      console.error("[CandidateIntelligenceWorker] computeMarketValue failed:", e);
    }
    try {
      visibility = await computeVisibilityScore(userId);
    } catch (e) {
      console.error("[CandidateIntelligenceWorker] computeVisibilityScore failed:", e);
    }
    try {
      skillsGap = await computeSkillsGap(userId);
    } catch (e) {
      console.error("[CandidateIntelligenceWorker] computeSkillsGap failed:", e);
    }
    try {
      appPerformance = await computeApplicationPerformance(userId);
    } catch (e) {
      console.error("[CandidateIntelligenceWorker] computeApplicationPerformance failed:", e);
    }
    try {
      heatmap = await computeHeatmap(userId);
    } catch (e) {
      console.error("[CandidateIntelligenceWorker] computeHeatmap failed:", e);
    }

    await saveSnapshot(userId, {
      marketValue,
      visibility,
      skillsGap,
      appPerformance,
      heatmap,
    });
  },
  { connection }
);

candidateIntelligenceWorker.on("completed", (job) => {
  console.log("[CandidateIntelligenceWorker] Job completed:", job.id);
});

candidateIntelligenceWorker.on("failed", (job, err) => {
  console.error("[CandidateIntelligenceWorker] Job failed:", job?.id, err.message);
});
