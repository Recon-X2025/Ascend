import { Worker, type Job } from "bullmq";
import type { DailyCoWebhookJobData } from "../index";
import { prisma } from "@/lib/prisma/client";
import { recordJoin, recordLeave, checkNoShow } from "@/lib/sessions/join";
import { sessionFinaliseQueue } from "../index";
import { trackOutcome } from "@/lib/tracking/outcomes";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

/** Extract sessionId from Daily room name (ascend-{sessionId}). */
function sessionIdFromRoom(roomName: string): string | null {
  const prefix = "ascend-";
  if (roomName.startsWith(prefix)) return roomName.slice(prefix.length);
  return null;
}

export const dailyCoWebhookWorker = new Worker<DailyCoWebhookJobData>(
  "dailyco-webhook",
  async (job: Job<DailyCoWebhookJobData>) => {
    const { payload, eventType } = job.data;
    const p = payload as Record<string, unknown>;
    const roomName = String(p?.room_name ?? p?.room ?? "");
    const sessionId = sessionIdFromRoom(roomName);
    if (!sessionId) return;

    const session = await prisma.engagementSession.findUnique({
      where: { id: sessionId },
      include: { contract: true },
    });
    if (!session) return;

    const systemUserId = process.env.M16_SYSTEM_ACTOR_ID;

    if (eventType === "meeting-started") {
      await prisma.engagementSession.update({
        where: { id: sessionId },
        data: { status: "IN_PROGRESS" },
      });
      if (systemUserId) {
        trackOutcome(systemUserId, "M7_SESSION_STARTED", {
          entityId: sessionId,
          entityType: "EngagementSession",
          metadata: { sessionId },
        }).catch(() => {});
      }
    } else if (eventType === "participant-joined") {
      const userId = String((p?.participant as Record<string, unknown>)?.user_id ?? "");
      const participantId = String((p?.participant as Record<string, unknown>)?.participant_id ?? "");
      const joinedAt = (p?.participant as { joined_at?: string })?.joined_at
        ? new Date(String((p.participant as { joined_at: string }).joined_at))
        : new Date();
      if (userId && (userId === session.contract.mentorUserId || userId === session.contract.menteeUserId)) {
        await recordJoin(sessionId, userId, participantId || null, joinedAt);
        if (systemUserId) {
          trackOutcome(systemUserId, "M7_PARTICIPANT_JOINED", {
            entityId: sessionId,
            entityType: "EngagementSession",
            metadata: { sessionId, userId },
          }).catch(() => {});
        }
      }
    } else if (eventType === "participant-left") {
      const userId = String((p?.participant as Record<string, unknown>)?.user_id ?? "");
      const leftAt = new Date();
      if (userId) {
        await recordLeave(sessionId, userId, leftAt);
      }
    } else if (eventType === "meeting-ended") {
      const noShow = await checkNoShow(sessionId);
      if (noShow) {
        await prisma.engagementSession.update({
          where: { id: sessionId },
          data: { status: "NO_SHOW" },
        });
        if (systemUserId) {
          trackOutcome(systemUserId, "M7_SESSION_NO_SHOW", {
            entityId: sessionId,
            entityType: "EngagementSession",
            metadata: { sessionId },
          }).catch(() => {});
        }
      } else {
        await sessionFinaliseQueue.add("finalise", { sessionId });
      }
    }
  },
  { connection, concurrency: 4 }
);

dailyCoWebhookWorker.on("failed", (job, err) => {
  console.error("[DailyCoWebhookWorker] Failed:", job?.id, err.message);
});
