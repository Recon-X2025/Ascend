/**
 * M-7: Session join/leave logging.
 * recordJoin, recordLeave, checkNoShow, calculateEffectiveDuration, meetsMinimumDuration.
 */

import { prisma } from "@/lib/prisma/client";
import { differenceInSeconds, addMinutes } from "date-fns";

/** Record participant join. */
export async function recordJoin(
  sessionId: string,
  userId: string,
  dailyParticipantId: string | null,
  joinedAt: Date
): Promise<void> {
  await prisma.sessionJoinLog.create({
    data: {
      sessionId,
      userId,
      dailyParticipantId: dailyParticipantId ?? undefined,
      joinedAt,
    },
  });
}

/** Record participant leave; compute durationSeconds. */
export async function recordLeave(
  sessionId: string,
  userId: string,
  leftAt: Date
): Promise<void> {
  const openLog = await prisma.sessionJoinLog.findFirst({
    where: {
      sessionId,
      userId,
      leftAt: null,
    },
    orderBy: { joinedAt: "desc" },
  });
  if (!openLog) return;

  const durationSeconds = differenceInSeconds(leftAt, openLog.joinedAt);
  await prisma.sessionJoinLog.update({
    where: { id: openLog.id },
    data: { leftAt, durationSeconds },
  });
}

/** Check no-show: 15 min after scheduled start, neither joined. */
export async function checkNoShow(sessionId: string): Promise<boolean> {
  const session = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: { contract: true, joinLogs: true },
  });
  if (!session?.scheduledAt) return false;

  const cutoff = addMinutes(session.scheduledAt, 15);
  if (new Date() < cutoff) return false;

  const mentorId = session.contract.mentorUserId;
  const menteeId = session.contract.menteeUserId;

  const mentorJoined = session.joinLogs.some(
    (j) => j.userId === mentorId && j.joinedAt <= cutoff
  );
  const menteeJoined = session.joinLogs.some(
    (j) => j.userId === menteeId && j.joinedAt <= cutoff
  );

  return !mentorJoined && !menteeJoined;
}

/** Calculate effective duration = overlap where both present. */
export async function calculateEffectiveDuration(sessionId: string): Promise<number> {
  const session = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: { contract: true, joinLogs: { where: { leftAt: { not: null } } } },
  });
  if (!session) return 0;

  const mentorId = session.contract.mentorUserId;
  const menteeId = session.contract.menteeUserId;

  const mentorLogs = session.joinLogs
    .filter((j) => j.userId === mentorId && j.leftAt)
    .map((j) => ({ start: j.joinedAt, end: j.leftAt! }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const menteeLogs = session.joinLogs
    .filter((j) => j.userId === menteeId && j.leftAt)
    .map((j) => ({ start: j.joinedAt, end: j.leftAt! }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  let totalSeconds = 0;
  for (const m of mentorLogs) {
    for (const e of menteeLogs) {
      const overlapStart = new Date(Math.max(m.start.getTime(), e.start.getTime()));
      const overlapEnd = new Date(Math.min(m.end.getTime(), e.end.getTime()));
      if (overlapStart < overlapEnd) {
        totalSeconds += differenceInSeconds(overlapEnd, overlapStart);
      }
    }
  }
  return totalSeconds;
}

/** Persist effectiveDurationMins and return it. */
export async function persistEffectiveDuration(sessionId: string): Promise<number> {
  const totalSeconds = await calculateEffectiveDuration(sessionId);
  const effectiveDurationMins = Math.floor(totalSeconds / 60);
  await prisma.engagementSession.update({
    where: { id: sessionId },
    data: { effectiveDurationMins },
  });
  return effectiveDurationMins;
}

/** 60% of effectiveSlotMins = minimum required. */
const MIN_DURATION_THRESHOLD = 0.6;

export async function meetsMinimumDuration(sessionId: string): Promise<boolean> {
  const session = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
  });
  if (!session?.effectiveSlotMins) return false;

  const effectiveMins = session.effectiveDurationMins ?? 0;
  const requiredMins = Math.ceil(session.effectiveSlotMins * MIN_DURATION_THRESHOLD);
  return effectiveMins >= requiredMins;
}
