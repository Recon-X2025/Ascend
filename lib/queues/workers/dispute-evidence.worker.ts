import { Worker, type Job } from "bullmq";
import type { DisputeEvidenceJobData } from "../index";
import { assembleEvidence } from "@/lib/mentorship/disputes";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const disputeEvidenceWorker = new Worker<DisputeEvidenceJobData>(
  "dispute-evidence",
  async (job: Job<DisputeEvidenceJobData>) => {
    const { disputeId } = job.data;
    await assembleEvidence(disputeId);
  },
  { connection }
);

disputeEvidenceWorker.on("completed", (job) => {
  console.log("[DisputeEvidenceWorker] Completed:", job.id, job.data.disputeId);
});

disputeEvidenceWorker.on("failed", (job, err) => {
  console.error("[DisputeEvidenceWorker] Failed:", job?.id, err.message);
});
