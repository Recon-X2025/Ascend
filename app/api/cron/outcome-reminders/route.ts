import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logAudit } from "@/lib/audit/log";
import { addHours } from "date-fns";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/outcome-reminders
 * Run daily. CRON_SECRET. 48h reminder for PENDING_MENTEE; ops alert for DISPUTED > 5 days.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in48h = addHours(now, 48);
  const sendLog: string[] = [];

  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "";

    // 1. PENDING_MENTEE with acknowledgementDeadline within 48h → reminder to mentee
    const pending = await prisma.mentorshipOutcome.findMany({
      where: {
        status: "PENDING_MENTEE",
        acknowledgementDeadline: { gte: now, lte: in48h },
      },
      include: { mentee: { select: { email: true, name: true } } },
    });
    const { sendOutcomeReminder } = await import("@/lib/email/templates/mentorship/outcome-reminder");
    for (const o of pending) {
      if (o.mentee.email) {
        await sendOutcomeReminder({
          to: o.mentee.email,
          menteeName: o.mentee.name ?? "Mentee",
          deadline: o.acknowledgementDeadline,
          outcomeUrl: `${baseUrl}/mentorship/engagements/${o.contractId}`,
        });
        sendLog.push(`reminder:${o.id}`);
      }
    }

    // 2. DISPUTED > 5 business days → ops alert (simplified: 5 calendar days)
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const disputed = await prisma.mentorshipOutcome.findMany({
      where: {
        status: "DISPUTED",
        menteeDisputedAt: { lt: fiveDaysAgo },
      },
      include: {
        mentor: { select: { name: true } },
        mentee: { select: { name: true } },
      },
    });
    const opsEmail = process.env.OPS_EMAIL;
    if (opsEmail && disputed.length > 0) {
      const { sendOutcomeDisputed } = await import("@/lib/email/templates/mentorship/outcome-disputed");
      for (const o of disputed) {
        await sendOutcomeDisputed({
          to: opsEmail,
          mentorName: o.mentor.name ?? "Mentor",
          menteeName: o.mentee.name ?? "Mentee",
          transitionType: o.transitionType,
          menteeNote: `[Ops alert] Disputed > 5 days. Outcome ID: ${o.id}. Please review.`,
          outcomeId: o.id,
          engagementUrl: `${baseUrl}/dashboard/admin/mentorship/outcomes`,
        });
        sendLog.push(`ops-alert:${o.id}`);
      }
    }

    await logAudit({
      category: "SYSTEM",
      action: "CRON_OUTCOME_REMINDERS",
      targetType: "Cron",
      targetId: "outcome-reminders",
      metadata: { sendCount: sendLog.length, sends: sendLog },
    });
  } catch (err) {
    console.error("[CRON outcome-reminders]", err);
    await logAudit({
      category: "SYSTEM",
      action: "CRON_OUTCOME_REMINDERS",
      targetType: "Cron",
      targetId: "outcome-reminders",
      success: false,
      errorCode: err instanceof Error ? err.message : "Unknown",
    });
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sends: sendLog.length });
}
