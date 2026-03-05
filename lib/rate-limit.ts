import { redis } from "@/lib/redis/client";
import { withTimeout } from "@/lib/redis/with-timeout";
import { logSecurityEvent } from "@/lib/audit/log";

const RATE_LIMIT_FALLBACK = {
  allowed: true,
  remaining: 999,
  resetIn: 60,
};

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const fullKey = key.startsWith("rl:") ? key : `rl:${key}`;
  const doCheck = async () => {
    const current = await redis.incr(fullKey);
    if (current === 1) {
      await redis.expire(fullKey, windowSeconds);
    }
    const ttl = await redis.ttl(fullKey);
    const allowed = current <= maxRequests;
    return {
      allowed,
      remaining: Math.max(0, maxRequests - current),
      resetIn: ttl,
    };
  };
  return withTimeout(doCheck(), RATE_LIMIT_FALLBACK);
}

/** Call when returning 429 so the hit is logged to SecurityEvent. */
export async function reportRateLimitHit(
  req: Request,
  identifier: string,
  limit: number,
  windowSeconds: number,
  userId?: string
): Promise<void> {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const pathname = new URL(req.url).pathname;
    await logSecurityEvent(
      "RATE_LIMIT_HIT",
      ip ?? "unknown",
      pathname,
      userId,
      { limit, window: windowSeconds, identifier }
    );
  } catch {
    // non-blocking
  }
}
