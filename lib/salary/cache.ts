/**
 * Phase 8: Salary insight cache read/write.
 * Cache key format: role:[slug]:[city|all]:[year|all], company:[id]:[role|all]:[city|all]:[year|all], etc.
 */

import { prisma } from "@/lib/prisma/client";

const TTL_HOURS = 24;

export function buildRoleCacheKey(roleSlug: string, city?: string | null, year?: number | null): string {
  const c = city?.toLowerCase().trim() || "all";
  const y = year != null ? String(year) : "all";
  return `role:${roleSlug}:${c}:${y}`;
}

export function buildCompanyCacheKey(companyId: string, role?: string | null, city?: string | null, year?: number | null): string {
  const r = role?.toLowerCase().trim() || "all";
  const c = city?.toLowerCase().trim() || "all";
  const y = year != null ? String(year) : "all";
  return `company:${companyId}:${r}:${c}:${y}`;
}

export function buildTopPayersCacheKey(roleSlug: string, city?: string | null): string {
  const c = city?.toLowerCase().trim() || "all";
  return `toppayers:${roleSlug}:${c}`;
}

export function buildTrendingCacheKey(): string {
  return "trending:roles";
}

export async function getCached<T>(cacheKey: string): Promise<{ data: T; submissionCount: number; jdSignalCount: number } | null> {
  const row = await prisma.salaryInsightCache.findUnique({
    where: { cacheKey },
  });
  if (!row || new Date(row.expiresAt) <= new Date()) return null;
  return {
    data: row.data as T,
    submissionCount: row.submissionCount,
    jdSignalCount: row.jdSignalCount,
  };
}

export async function setCached(
  cacheKey: string,
  data: unknown,
  submissionCount: number,
  jdSignalCount: number
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TTL_HOURS);
  await prisma.salaryInsightCache.upsert({
    where: { cacheKey },
    create: {
      cacheKey,
      data: data as object,
      submissionCount,
      jdSignalCount,
      expiresAt,
    },
    update: {
      data: data as object,
      submissionCount,
      jdSignalCount,
      computedAt: new Date(),
      expiresAt,
    },
  });
}

/** Invalidate all cache entries whose key starts with prefix (e.g. "role:software-engineer" or "company:xyz") */
export async function invalidateCacheByPrefix(prefix: string): Promise<number> {
  const result = await prisma.salaryInsightCache.deleteMany({
    where: { cacheKey: { startsWith: prefix } },
  });
  return result.count;
}
