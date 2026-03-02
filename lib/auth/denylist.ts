import { redis } from "@/lib/redis/client";

const DENYLIST_PREFIX = "jwt:denied:";
const DENYLIST_USER_PREFIX = "jwt:denied:user:";

/** Deny a specific token (by jti — JWT token ID) */
export async function denyToken(
  jti: string,
  expiresAt: number
): Promise<void> {
  const ttl = expiresAt - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.set(`${DENYLIST_PREFIX}${jti}`, "1", "EX", ttl);
  }
}

/** Deny ALL tokens for a user (sign out all devices) */
export async function denyAllUserTokens(userId: string): Promise<void> {
  await redis.set(
    `${DENYLIST_USER_PREFIX}${userId}`,
    Math.floor(Date.now() / 1000).toString(),
    "EX",
    60 * 60 * 24 * 31 // 31 days
  );
}

/** Check if a specific token is denied */
export async function isTokenDenied(jti: string): Promise<boolean> {
  const result = await redis.get(`${DENYLIST_PREFIX}${jti}`);
  return result !== null;
}

/** Check if a token was issued before the user's deny-all timestamp */
export async function isTokenIssuedBeforeDenyAll(
  userId: string,
  issuedAt: number
): Promise<boolean> {
  const denyTime = await redis.get(`${DENYLIST_USER_PREFIX}${userId}`);
  if (!denyTime) return false;
  return issuedAt < parseInt(denyTime, 10);
}

/** Clear deny-all for a user (called on new sign-in) */
export async function clearUserDenyAll(userId: string): Promise<void> {
  await redis.del(`${DENYLIST_USER_PREFIX}${userId}`);
}
