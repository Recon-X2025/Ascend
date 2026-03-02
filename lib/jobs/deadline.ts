/**
 * Close job posts that are past their deadline.
 * Returns list of closed job IDs for search index removal (Phase 5).
 */

import { prisma } from "@/lib/prisma/client";

export async function closeExpiredJobs(): Promise<{ count: number; closedIds: number[] }> {
  const toClose = await prisma.jobPost.findMany({
    where: {
      status: "ACTIVE",
      deadline: { lt: new Date() },
    },
    select: { id: true },
  });
  const closedIds = toClose.map((r) => r.id);
  if (closedIds.length === 0) return { count: 0, closedIds: [] };
  await prisma.jobPost.updateMany({
    where: { id: { in: closedIds } },
    data: { status: "CLOSED" },
  });
  return { count: closedIds.length, closedIds };
}
