/**
 * Phase 7: Rate limit for review submissions (any type).
 * Max 3 submissions per user per rolling 24 hours. Uses Redis.
 */

import { redis } from "@/lib/redis/client";

const KEY_PREFIX = "review_submit:";
const MAX_SUBMISSIONS = 3;
const WINDOW_SECONDS = 86400; // 24 hours

export interface ReviewRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

export async function checkReviewSubmitRateLimit(
  userId: string
): Promise<ReviewRateLimitResult> {
  const key = `${KEY_PREFIX}${userId}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }
  const ttl = await redis.ttl(key);
  const allowed = current <= MAX_SUBMISSIONS;
  return {
    allowed,
    remaining: Math.max(0, MAX_SUBMISSIONS - current),
    resetIn: ttl,
  };
}
