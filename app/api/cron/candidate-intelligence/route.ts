/**
 * Phase 10B: Enqueue candidate intelligence computation for all active seekers.
 * Run weekly (e.g. Sunday 11pm IST) so Monday digest has fresh data.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { candidateIntelligenceQueue } from "@/lib/queues";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seekers = await prisma.user.findMany({
    where: { role: "JOB_SEEKER", bannedAt: null },
    select: { id: true },
  });

  let enqueued = 0;
  for (const u of seekers) {
    try {
      await candidateIntelligenceQueue.add("compute", { userId: u.id });
      enqueued++;
    } catch {
      // continue
    }
  }

  return NextResponse.json({ enqueued, total: seekers.length });
}
