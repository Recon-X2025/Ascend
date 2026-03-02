/**
 * GET /api/cron/annual-mentor-summary
 * April 1. Enqueues annual summary jobs for all active mentors.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { annualMentorSummaryQueue } from "@/lib/queues";
import { logAudit } from "@/lib/audit/log";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const mentors = await prisma.mentorProfile.findMany({
    where: { isActive: true },
    select: { userId: true },
  });

  const jobIds: string[] = [];
  for (const m of mentors) {
    const job = await annualMentorSummaryQueue.add(
      "annual-summary",
      { mentorUserId: m.userId },
      { removeOnComplete: { age: 86400 } }
    );
    if (job.id) jobIds.push(job.id);
  }

  await logAudit({
    category: "SYSTEM",
    action: "CRON_ANNUAL_MENTOR_SUMMARY",
    targetType: "Cron",
    targetId: "annual-mentor-summary",
    metadata: { mentorsEnqueued: mentors.length, jobCount: jobIds.length },
  });

  return NextResponse.json({
    ok: true,
    mentorsEnqueued: mentors.length,
    jobsAdded: jobIds.length,
  });
}
