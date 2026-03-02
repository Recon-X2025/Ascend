/**
 * M-4: Match refresh — invalidate discover cache so next GET recomputes.
 */

import { redis } from "@/lib/redis/client";
import { mentorshipMatchQueue } from "@/lib/queues";
import { getDiscoverCacheKey } from "./discover";

export const MENTORSHIP_MATCH_QUEUE = "mentorship-match";

/**
 * Whether we should trigger a refresh (e.g. after context change).
 * Can be used to avoid redundant queue jobs; for now we always allow.
 */
export function shouldRefreshMatches(): boolean {
  return true;
}

/**
 * Enqueue a cache invalidation for this mentee. Worker will DEL the discover cache key.
 */
export async function queueMatchRefresh(menteeUserId: string): Promise<void> {
  await mentorshipMatchQueue.add("invalidate", { menteeUserId });
}

/**
 * Enqueue cache invalidation for all mentees who have passed readiness (e.g. after new mentor verified).
 */
export async function queueMatchRefreshAll(): Promise<number> {
  const { prisma } = await import("@/lib/prisma/client");
  const mentees = await prisma.menteeReadinessCheck.findMany({
    where: { allGatesPassed: true },
    select: { userId: true },
  });
  for (const { userId } of mentees) {
    await queueMatchRefresh(userId);
  }
  return mentees.length;
}

/**
 * Invalidate the discover cache for one mentee. Call from BullMQ worker.
 */
export async function invalidateDiscoverCache(menteeUserId: string): Promise<void> {
  const key = getDiscoverCacheKey(menteeUserId);
  await redis.del(key);
}
