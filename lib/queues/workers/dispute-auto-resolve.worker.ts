import { Worker, type Job } from "bullmq";
import type { DisputeAutoResolveJobData } from "../index";
import {
  runAutoResolution,
  applyResolutionOutcome,
} from "@/lib/mentorship/disputes";
import type { DisputeOutcome } from "@prisma/client";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const disputeAutoResolveWorker = new Worker<DisputeAutoResolveJobData>(
  "dispute-auto-resolve",
  async (job: Job<DisputeAutoResolveJobData>) => {
    const { disputeId } = job.data;
    const outcome = await runAutoResolution(disputeId);
    const definitiveOutcomes: DisputeOutcome[] = ["UPHELD", "REJECTED", "REJECTED_INVALID"];
    if (outcome && definitiveOutcomes.includes(outcome)) {
      await applyResolutionOutcome(disputeId, outcome);
    }
  },
  { connection }
);

disputeAutoResolveWorker.on("completed", (job) => {
  console.log("[DisputeAutoResolveWorker] Completed:", job.id, job.data.disputeId);
});

disputeAutoResolveWorker.on("failed", (job, err) => {
  console.error("[DisputeAutoResolveWorker] Failed:", job?.id, err.message);
});
