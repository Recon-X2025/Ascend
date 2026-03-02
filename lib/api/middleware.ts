/**
 * Phase 18: API auth middleware for /api/v1/* routes.
 * Extracts Bearer token, validates API key, checks scope, rate limits, logs usage.
 */

import { NextResponse } from "next/server";
import type { CompanyApiKey, Company } from "@prisma/client";
import { validateApiKey, hasScope } from "./keys";
import { canCompanyUseFeature } from "@/lib/payments/gate";
import { prisma } from "@/lib/prisma/client";
import { redis } from "@/lib/redis/client";
import { trackOutcome } from "@/lib/tracking/outcomes";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 1000;
const RATE_LIMIT_KEY_PREFIX = "api:ratelimit:";

export type ApiAuthContext = {
  apiKey: CompanyApiKey & { company: Company };
};

export async function withApiAuth(
  request: Request,
  requiredScope: string,
  handler: (req: Request, ctx: ApiAuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  // 1. Enterprise gate
  const authHeader = request.headers.get("Authorization");
  const rawKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!rawKey) {
    return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  const validation = await validateApiKey(rawKey);
  if (!validation.valid) {
    const status = validation.error === "EXPIRED" ? 401 : validation.error === "REVOKED" ? 403 : 401;
    return NextResponse.json({ error: validation.error ?? "INVALID" }, { status });
  }

  const { apiKey } = validation;
  if (!apiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { allowed, reason } = await canCompanyUseFeature(apiKey.companyId, "apiAccess");
  if (!allowed) {
    return NextResponse.json(
      { error: reason ?? "ENTERPRISE_REQUIRED", upgradeUrl: "/pricing" },
      { status: 402 }
    );
  }

  if (!hasScope(apiKey, requiredScope)) {
    return NextResponse.json({ error: "Insufficient scope", required: requiredScope }, { status: 403 });
  }

  // 2. Rate limiting (sliding window via sorted set)
  try {
    const key = `${RATE_LIMIT_KEY_PREFIX}${apiKey.id}`;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    await redis.zremrangebyscore(key, 0, windowStart);
    const count = await redis.zcard(key);
    if (count >= RATE_LIMIT_MAX) {
      const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
      // WITHSCORES returns [member, score, member2, score2, ...]; we want the oldest (first) score
      const oldestScore = oldest[1] ? parseInt(String(oldest[1]), 10) : 0;
      const retryAfter = Math.ceil((oldestScore + RATE_LIMIT_WINDOW_MS - now) / 1000);
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfter)) } }
      );
    }
    await redis.zadd(key, now, `${now}`);
    await redis.expire(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) + 60);
  } catch {
    // Redis down — allow request (fail open)
  }

  // 3. Execute handler
  const start = Date.now();
  let response: NextResponse;
  try {
    response = await handler(request, { apiKey });
  } catch {
    response = NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // 4. Log usage (fire-and-forget)
  const url = new URL(request.url);
  const latencyMs = Date.now() - start;
  prisma.apiUsageLog
    .create({
      data: {
        apiKeyId: apiKey.id,
        endpoint: url.pathname,
        method: request.method,
        statusCode: response.status,
        latencyMs,
      },
    })
    .catch(() => {});

  // 5. Update lastUsedAt
  prisma.companyApiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  // 6. Outcome: PHASE18_API_REQUEST_MADE (sampled 5%)
  if (Math.random() < 0.05) {
    trackOutcome(apiKey.createdById, "PHASE18_API_REQUEST_MADE", {
      metadata: { companyId: apiKey.companyId, endpoint: url.pathname, statusCode: response.status },
    }).catch(() => {});
  }

  return response;
}
