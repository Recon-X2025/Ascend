import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logAudit } from "@/lib/audit/log";
import { addDays } from "date-fns";
import { lockCircle } from "@/lib/mentorship/circles";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET /api/cron/engagement-reminders
 * Run daily. Protected by CRON_SECRET.
 * 1. Engagement ending in 7 days → send "ending soon" to both
 * 2. Milestones due in 3 days → send reminder
 * 3. Sessions in 24h → send session reminder
 * 4. Goal Setting overdue → send overdue notice to mentor
 * 5. M-12: Lock circles where startDate <= now
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in7Days = addDays(now, 7);
  const in3Days = addDays(now, 3);
  const in24h = addDays(now, 1);
  const sendLog: string[] = [];

  try {
    // 1. ACTIVE contracts ending within 7 days
    const endingSoon = await prisma.mentorshipContract.findMany({
      where: {
        status: "ACTIVE",
        engagementEnd: { gte: now, lte: in7Days },
      },
      include: {
        mentor: { select: { email: true, name: true } },
        mentee: { select: { email: true, name: true } },
      },
    });
    const { sendEngagementEndingSoon } = await import(
      "@/lib/email/templates/mentorship/engagement-ending-soon"
    );
    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    for (const c of endingSoon) {
      if (c.mentor.email) {
        await sendEngagementEndingSoon({
          to: c.mentor.email,
          recipientName: c.mentor.name ?? "Mentor",
          engagementEnd: c.engagementEnd!,
          engagementUrl: `${baseUrl}/mentorship/engagements/${c.id}`,
        });
        sendLog.push(`ending-soon:mentor:${c.id}`);
      }
      if (c.mentee.email) {
        await sendEngagementEndingSoon({
          to: c.mentee.email,
          recipientName: c.mentee.name ?? "Mentee",
          engagementEnd: c.engagementEnd!,
          engagementUrl: `${baseUrl}/mentorship/engagements/${c.id}`,
        });
        sendLog.push(`ending-soon:mentee:${c.id}`);
      }
    }

    // 2. Milestones due within 3 days, not complete
    const milestonesDue = await prisma.engagementMilestone.findMany({
      where: {
        dueDate: { gte: now, lte: in3Days },
        status: { not: "COMPLETE" },
      },
      include: {
        contract: {
          include: {
            mentor: { select: { email: true, name: true } },
            mentee: { select: { email: true, name: true } },
          },
        },
      },
    });
    const { sendMilestoneReminder } = await import(
      "@/lib/email/templates/mentorship/engagement-milestone-reminder"
    );
    for (const m of milestonesDue) {
      const engUrl = `${baseUrl}/mentorship/engagements/${m.contractId}`;
      if (m.status === "PENDING" || m.status === "MENTEE_FILED") {
        if (m.contract.mentor.email) {
          await sendMilestoneReminder({
            to: m.contract.mentor.email,
            recipientName: m.contract.mentor.name ?? "Mentor",
            milestoneType: m.type,
            dueDate: m.dueDate,
            engagementUrl: engUrl,
          });
          sendLog.push(`milestone-reminder:mentor:${m.id}`);
        }
      }
      if (m.status === "PENDING" || m.status === "MENTOR_FILED") {
        if (m.contract.mentee.email) {
          await sendMilestoneReminder({
            to: m.contract.mentee.email,
            recipientName: m.contract.mentee.name ?? "Mentee",
            milestoneType: m.type,
            dueDate: m.dueDate,
            engagementUrl: engUrl,
          });
          sendLog.push(`milestone-reminder:mentee:${m.id}`);
        }
      }
    }

    // 3. Sessions scheduled within 24h
    const sessionsSoon = await prisma.engagementSession.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: now, lte: in24h },
      },
      include: {
        contract: {
          include: {
            mentor: { select: { email: true, name: true } },
            mentee: { select: { email: true, name: true } },
          },
        },
      },
    });
    const { sendSessionReminder } = await import(
      "@/lib/email/templates/mentorship/engagement-session-reminder"
    );
    for (const s of sessionsSoon) {
      const engUrl = `${baseUrl}/mentorship/engagements/${s.contractId}`;
      if (s.contract.mentor.email && s.scheduledAt) {
        await sendSessionReminder({
          to: s.contract.mentor.email,
          recipientName: s.contract.mentor.name ?? "Mentor",
          sessionNumber: s.sessionNumber,
          scheduledAt: s.scheduledAt,
          engagementUrl: engUrl,
        });
        sendLog.push(`session-reminder:mentor:${s.id}`);
      }
      if (s.contract.mentee.email && s.scheduledAt) {
        await sendSessionReminder({
          to: s.contract.mentee.email,
          recipientName: s.contract.mentee.name ?? "Mentee",
          sessionNumber: s.sessionNumber,
          scheduledAt: s.scheduledAt,
          engagementUrl: engUrl,
        });
        sendLog.push(`session-reminder:mentee:${s.id}`);
      }
    }

    // 5. M-12: Lock circles where startDate <= now and status is OPEN
    const circlesToLock = await prisma.mentorshipCircle.findMany({
      where: {
        status: "OPEN",
        startDate: { lte: now },
      },
      select: { id: true, mentorId: true },
    });
    for (const c of circlesToLock) {
      try {
        await lockCircle(c.id, c.mentorId);
        sendLog.push(`circle-locked:${c.id}`);
      } catch (e) {
        console.error("[CRON] lockCircle failed:", e);
      }
    }

    // 4. Goal Setting milestone overdue, not complete
    const goalOverdue = await prisma.engagementMilestone.findMany({
      where: {
        type: "GOAL_SETTING",
        dueDate: { lt: now },
        status: { not: "COMPLETE" },
      },
      include: {
        contract: {
          include: { mentor: { select: { email: true, name: true } } },
        },
      },
    });
    const { sendEngagementOverdueGoal } = await import(
      "@/lib/email/templates/mentorship/engagement-overdue-goal"
    );
    for (const m of goalOverdue) {
      if (m.contract.mentor.email) {
        await sendEngagementOverdueGoal({
          to: m.contract.mentor.email,
          mentorName: m.contract.mentor.name ?? "Mentor",
          engagementUrl: `${baseUrl}/mentorship/engagements/${m.contractId}`,
        });
        sendLog.push(`overdue-goal:mentor:${m.contractId}`);
      }
    }

    await logAudit({
      category: "SYSTEM",
      action: "CRON_ENGAGEMENT_REMINDERS",
      targetType: "Cron",
      targetId: "engagement-reminders",
      metadata: { sendCount: sendLog.length, sends: sendLog },
    });
  } catch (err) {
    console.error("[CRON engagement-reminders]", err);
    await logAudit({
      category: "SYSTEM",
      action: "CRON_ENGAGEMENT_REMINDERS",
      targetType: "Cron",
      targetId: "engagement-reminders",
      success: false,
      errorCode: err instanceof Error ? err.message : "Unknown",
    });
    return NextResponse.json({ success: false, error: "Cron failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, sends: sendLog.length });
}
