/**
 * Phase 18: Resolve custom careers domain to company slug.
 * Uses Redis cache (5 min TTL) to avoid DB lookups on every request.
 */

import { redis } from "@/lib/redis/client";
import { prisma } from "@/lib/prisma/client";

const CACHE_PREFIX = "careers:domain:";
const CACHE_TTL_SEC = 300; // 5 minutes

export async function resolveDomainToSlug(host: string): Promise<string | null> {
  if (!host || host.includes("localhost") || host.includes("127.0.0.1")) {
    return null;
  }

  const cacheKey = `${CACHE_PREFIX}${host}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return cached || null;
    }
  } catch {
    // Redis down — fall through to DB
  }

  const config = await prisma.careersPageConfig.findFirst({
    where: {
      customDomain: host,
      isActive: true,
    },
    include: { company: { select: { slug: true } } },
  });

  const slug = config?.company?.slug ?? null;
  try {
    await redis.set(cacheKey, slug ?? "", "EX", CACHE_TTL_SEC);
  } catch {
    // ignore cache set failure
  }

  return slug;
}
