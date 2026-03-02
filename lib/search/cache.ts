/**
 * Redis cache for search results, suggestions, and job feed.
 * Key hashing: SHA-256 of JSON.stringify(params) → hex prefix 16 chars.
 */

import { createHash } from "crypto";
import { redis } from "@/lib/redis/client";

const SEARCH_PREFIX = "search:jobs:";
const SUGGESTIONS_PREFIX = "search:suggestions:";
const FEED_PREFIX = "feed:jobs:";
const SEARCH_TTL = 5 * 60;
const SUGGESTIONS_TTL = 10 * 60;
const FEED_TTL = 15 * 60;

function hashKey(params: unknown): string {
  const str = JSON.stringify(params);
  return createHash("sha256").update(str).digest("hex").slice(0, 16);
}

export async function getCachedSearch(key: string): Promise<unknown | null> {
  try {
    const raw = await redis.get(`${SEARCH_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export async function setCachedSearch(key: string, data: unknown, ttlSeconds: number = SEARCH_TTL): Promise<void> {
  try {
    await redis.setex(`${SEARCH_PREFIX}${key}`, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    console.error("[search] setCachedSearch error:", err);
  }
}

export function searchCacheKey(params: unknown): string {
  return hashKey(params);
}

export async function getCachedSuggestions(querySlug: string): Promise<unknown | null> {
  try {
    const raw = await redis.get(`${SUGGESTIONS_PREFIX}${querySlug}`);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export async function setCachedSuggestions(querySlug: string, data: unknown): Promise<void> {
  try {
    await redis.setex(`${SUGGESTIONS_PREFIX}${querySlug}`, SUGGESTIONS_TTL, JSON.stringify(data));
  } catch (err) {
    console.error("[search] setCachedSuggestions error:", err);
  }
}

export function suggestionsCacheKey(q: string): string {
  return hashKey({ q: (q || "").trim().toLowerCase() });
}

export async function getJobFeed(key: string): Promise<unknown | null> {
  try {
    const raw = await redis.get(`${FEED_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export async function cacheJobFeed(key: string, data: unknown, ttlSeconds: number = FEED_TTL): Promise<void> {
  try {
    await redis.setex(`${FEED_PREFIX}${key}`, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    console.error("[search] cacheJobFeed error:", err);
  }
}

export async function invalidateJobSearchCache(): Promise<void> {
  try {
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(cursor, "MATCH", `${SEARCH_PREFIX}*`, "COUNT", 100);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== "0");
  } catch (err) {
    console.error("[search] invalidateJobSearchCache error:", err);
  }
}
