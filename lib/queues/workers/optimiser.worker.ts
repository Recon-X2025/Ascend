import { Worker } from "bullmq";
import type { OptimiserJobData } from "../index";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const optimiserWorker = new Worker<OptimiserJobData>(
  "optimiser",
  async (job) => {
    console.log("[OptimiserWorker] Processing job:", job.id, job.data);
    throw new Error("Optimiser worker not yet implemented");
  },
  { connection }
);

optimiserWorker.on("completed", (job) => {
  console.log("[OptimiserWorker] Job completed:", job.id);
});

optimiserWorker.on("failed", (job, err) => {
  console.error("[OptimiserWorker] Job failed:", job?.id, err.message);
});
