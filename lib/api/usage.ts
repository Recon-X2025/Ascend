/**
 * Phase 18: API usage aggregation for billing/analytics.
 */

import { prisma } from "@/lib/prisma/client";

export async function getUsageSummary(
  companyId: string,
  from: Date,
  to: Date
): Promise<{
  totalRequests: number;
  byEndpoint: Record<string, number>;
  errorRate: number;
  avgLatencyMs: number;
}> {
  const logs = await prisma.apiUsageLog.findMany({
    where: {
      apiKey: { companyId },
      createdAt: { gte: from, lte: to },
    },
    select: { endpoint: true, statusCode: true, latencyMs: true },
  });

  const totalRequests = logs.length;
  const byEndpoint: Record<string, number> = {};
  let errorCount = 0;
  let totalLatency = 0;

  for (const log of logs) {
    byEndpoint[log.endpoint] = (byEndpoint[log.endpoint] ?? 0) + 1;
    if (log.statusCode >= 400) errorCount++;
    totalLatency += log.latencyMs;
  }

  return {
    totalRequests,
    byEndpoint,
    errorRate: totalRequests > 0 ? errorCount / totalRequests : 0,
    avgLatencyMs: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
  };
}
