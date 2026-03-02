import { Worker, type Job } from "bullmq";
import type { SessionFinaliseJobData } from "../index";
import { prisma } from "@/lib/prisma/client";
import {
  persistEffectiveDuration,
  meetsMinimumDuration,
} from "@/lib/sessions/join";
import { expireSessionRoom } from "@/lib/sessions/room";
import { stenoExtractionQueue, sessionRecordQueue } from "../index";
import { trackOutcome } from "@/lib/tracking/outcomes";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const sessionFinaliseWorker = new Worker<SessionFinaliseJobData>(
  "session-finalise",
  async (job: Job<SessionFinaliseJobData>) => {
    const { sessionId } = job.data;

    const session = await prisma.engagementSession.findUnique({
      where: { id: sessionId },
      include: {
        contract: { include: { mentor: true, mentee: true } },
        transcripts: true,
        stenoExtractions: true,
      },
    });
    if (!session) throw new Error("Session not found");

    await persistEffectiveDuration(sessionId);
    const meetsMin = await meetsMinimumDuration(sessionId);

    const status = meetsMin ? "COMPLETED" : "INCOMPLETE_SESSION";
    await prisma.engagementSession.update({
      where: { id: sessionId },
      data: { status, completedAt: meetsMin ? new Date() : undefined },
    });

    const systemUserId = process.env.M16_SYSTEM_ACTOR_ID;
    if (systemUserId) {
      await trackOutcome(systemUserId, meetsMin ? "M7_SESSION_COMPLETED" : "M7_SESSION_INCOMPLETE", {
        entityId: sessionId,
        entityType: "EngagementSession",
        metadata: { sessionId, contractId: session.contractId },
      }).catch(() => {});
    }

    const hasTranscript = session.transcripts.length > 0;
    const hasExtraction = session.stenoExtractions.length > 0;

    if (hasTranscript && !hasExtraction) {
      await stenoExtractionQueue.add("extract", { sessionId });
    } else {
      await sessionRecordQueue.add("generate", { sessionId });
    }

    await expireSessionRoom(sessionId);
  },
  { connection, concurrency: 2 }
);

sessionFinaliseWorker.on("failed", (job, err) => {
  console.error("[SessionFinaliseWorker] Failed:", job?.id, err.message);
});
