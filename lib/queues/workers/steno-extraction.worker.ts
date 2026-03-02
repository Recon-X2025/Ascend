import { Worker, type Job } from "bullmq";
import type { StenoExtractionJobData } from "../index";
import { extractFromTranscript } from "@/lib/sessions/steno";
import { sessionRecordQueue } from "../index";
import { trackOutcome } from "@/lib/tracking/outcomes";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const stenoExtractionWorker = new Worker<StenoExtractionJobData>(
  "steno-extraction",
  async (job: Job<StenoExtractionJobData>) => {
    const { sessionId } = job.data;
    const result = await extractFromTranscript(sessionId);
    if (result) {
      await sessionRecordQueue.add("generate", { sessionId });
      const systemUserId = process.env.M16_SYSTEM_ACTOR_ID;
      if (systemUserId) {
        await trackOutcome(systemUserId, "M7_EXTRACTION_COMPLETED", {
          entityId: sessionId,
          entityType: "EngagementSession",
          metadata: { sessionId },
        }).catch(() => {});
      }
    } else {
      await sessionRecordQueue.add("generate", { sessionId });
    }
  },
  { connection, concurrency: 2 }
);

stenoExtractionWorker.on("failed", (job, err) => {
  console.error("[StenoExtractionWorker] Failed:", job?.id, err.message);
});
