/**
 * GET /api/cron/monthly-mentor-report
 * 1st of month at 08:00 IST = 30 2 1 * * (02:30 UTC)
 * Enqueues monthly report jobs for mentors with marketplace plan or monetisation.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { monthlyMentorReportQueue } from "@/lib/queues";
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
    where: {
      isActive: true,
      OR: [
        { canChargeMentees: true },
        { monetisationStatus: { isUnlocked: true } },
        {
          user: {
            subscription: {
              planKey: "MENTOR_MARKETPLACE",
              status: "ACTIVE",
            },
          },
        },
      ],
    },
    select: { userId: true },
  });

  const jobIds: string[] = [];
  for (const m of mentors) {
    const job = await monthlyMentorReportQueue.add(
      "monthly-report",
      { mentorUserId: m.userId },
      { removeOnComplete: { age: 86400 } }
    );
    if (job.id) jobIds.push(job.id);
  }

  await logAudit({
    category: "SYSTEM",
    action: "CRON_MONTHLY_MENTOR_REPORT",
    targetType: "Cron",
    targetId: "monthly-mentor-report",
    metadata: { mentorsEnqueued: mentors.length, jobCount: jobIds.length },
  });

  return NextResponse.json({
    ok: true,
    mentorsEnqueued: mentors.length,
    jobsAdded: jobIds.length,
  });
}
