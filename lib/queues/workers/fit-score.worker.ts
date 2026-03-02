import { Worker } from "bullmq";
import type { FitScoreJobData } from "../index";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const fitScoreWorker = new Worker<FitScoreJobData>(
  "fit-score",
  async (job) => {
    console.log("[FitScoreWorker] Processing job:", job.id, job.data);
    throw new Error("Fit score worker not yet implemented");
  },
  { connection }
);

fitScoreWorker.on("completed", (job) => {
  console.log("[FitScoreWorker] Job completed:", job.id);
});

fitScoreWorker.on("failed", (job, err) => {
  console.error("[FitScoreWorker] Job failed:", job?.id, err.message);
});
