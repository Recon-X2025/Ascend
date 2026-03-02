import { redis } from "./client";

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
  const now = Date.now();
  const window = Math.floor(now / (windowSeconds * 1000));
  const redisKey = `ratelimit:${key}:${window}`;

  const current = await redis.incr(redisKey);

  if (current === 1) {
    await redis.expire(redisKey, windowSeconds * 2);
  }

  return {
    success: current <= limit,
    remaining: Math.max(0, limit - current),
  };
}

const RATE_LIMIT_RESEND_VERIFICATION = 60; // 1 per minute

export async function checkResendVerificationRateLimit(email: string): Promise<boolean> {
  const { success } = await rateLimit(
    `resend-verification:${email.toLowerCase()}`,
    1,
    RATE_LIMIT_RESEND_VERIFICATION
  );
  return success;
}
