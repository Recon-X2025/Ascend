import { redis } from "@/lib/redis/client";

const PREFIX = "blocklist:";
const TTL_SECONDS = 24 * 3600; // 24 hours

export async function isIpBlocked(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const key = `${PREFIX}${ip}`;
  const exists = await redis.get(key);
  return exists !== null;
}

export async function blockIp(ip: string): Promise<void> {
  const key = `${PREFIX}${ip}`;
  await redis.set(key, "1", "EX", TTL_SECONDS);
}

export async function unblockIp(ip: string): Promise<void> {
  await redis.del(`${PREFIX}${ip}`);
}

export async function getBlockedIps(): Promise<string[]> {
  const keys = await redis.keys(`${PREFIX}*`);
  return keys.map((k) => k.replace(PREFIX, ""));
}
