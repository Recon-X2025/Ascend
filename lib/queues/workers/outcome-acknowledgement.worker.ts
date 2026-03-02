import { Worker, type Job } from "bullmq";
import type { OutcomeAcknowledgementJobData } from "../index";
import { markUnacknowledged } from "@/lib/mentorship/outcomes";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const outcomeAcknowledgementWorker = new Worker<OutcomeAcknowledgementJobData>(
  "outcome-acknowledgement",
  async (job: Job<OutcomeAcknowledgementJobData>) => {
    const { outcomeId } = job.data;
    await markUnacknowledged(outcomeId);
  },
  { connection }
);

outcomeAcknowledgementWorker.on("completed", (job) => {
  console.log("[OutcomeAcknowledgementWorker] Completed:", job.id, job.data.outcomeId);
});

outcomeAcknowledgementWorker.on("failed", (job, err) => {
  console.error("[OutcomeAcknowledgementWorker] Failed:", job?.id, err.message);
});
