import { Worker, type Job } from "bullmq";
import type { SessionRecordJobData } from "../index";
import { prisma } from "@/lib/prisma/client";
import {
  generateSessionRecord,
  uploadSessionRecord,
  sha256Hash,
  persistSessionRecord,
} from "@/lib/sessions/record";
import { getSignedDownloadUrlWithExpiry } from "@/lib/storage";
import { trackOutcome } from "@/lib/tracking/outcomes";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export const sessionRecordWorker = new Worker<SessionRecordJobData>(
  "session-record",
  async (job: Job<SessionRecordJobData>) => {
    const { sessionId } = job.data;

    const session = await prisma.engagementSession.findUnique({
      where: { id: sessionId },
      include: { contract: { include: { mentor: true, mentee: true } } },
    });
    if (!session) throw new Error("Session not found");

    const buffer = await generateSessionRecord(sessionId);
    const hash = sha256Hash(buffer);
    const s3Key = await uploadSessionRecord(sessionId, buffer);
    await persistSessionRecord(sessionId, s3Key, hash);

    await prisma.engagementSession.update({
      where: { id: sessionId },
      data: { stenoStatus: "COMPLETED" },
    });

    const signedUrl = await getSignedDownloadUrlWithExpiry(s3Key, SEVEN_DAYS_SECONDS);
    const baseUrl = process.env.NEXTAUTH_URL ?? "";

    const { sendSessionRecordReady } = await import("@/lib/email/templates/mentorship/session-record-ready");
    if (session.contract.mentor.email) {
      await sendSessionRecordReady({
        to: session.contract.mentor.email,
        mentorName: session.contract.mentor.name ?? "Mentor",
        sessionNumber: session.sessionNumber,
        downloadUrl: signedUrl,
        engagementUrl: `${baseUrl}/mentorship/engagements/${session.contractId}`,
      }).catch(() => {});
    }
    if (session.contract.mentee.email) {
      await sendSessionRecordReady({
        to: session.contract.mentee.email,
        mentorName: session.contract.mentor.name ?? "Mentor",
        sessionNumber: session.sessionNumber,
        downloadUrl: signedUrl,
        engagementUrl: `${baseUrl}/mentorship/engagements/${session.contractId}`,
      }).catch(() => {});
    }

    const systemUserId = process.env.M16_SYSTEM_ACTOR_ID;
    if (systemUserId) {
      await trackOutcome(systemUserId, "M7_SESSION_RECORD_GENERATED", {
        entityId: sessionId,
        entityType: "EngagementSession",
        metadata: { sessionId, contractId: session.contractId },
      }).catch(() => {});
    }
  },
  { connection, concurrency: 2 }
);

sessionRecordWorker.on("failed", (job, err) => {
  console.error("[SessionRecordWorker] Failed:", job?.id, err.message);
});
