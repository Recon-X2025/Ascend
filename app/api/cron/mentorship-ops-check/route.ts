/**
 * GET /api/cron/mentorship-ops-check
 * Run daily at 08:00 IST (02:30 UTC). Protected by CRON_SECRET.
 * 1. checkAndCreateAlerts()
 * 2. Send ops digest email if any CRITICAL or HIGH alerts created in last 24h
 * 3. Log OPS_CHECK_COMPLETE to MentorshipAuditLog (SYSTEM)
 */
import { NextResponse } from "next/server";
import { checkAndCreateAlerts } from "@/lib/mentorship/ops-alerts";
import { logMentorshipAction } from "@/lib/mentorship/audit";
import { prisma } from "@/lib/prisma/client";
import { subHours } from "date-fns";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const systemActorId = process.env.M16_SYSTEM_ACTOR_ID;
  if (!systemActorId) {
    console.warn("[mentorship-ops-check] M16_SYSTEM_ACTOR_ID not set; audit log entry may be skipped");
  }

  const { created, criticalCount, highCount } = await checkAndCreateAlerts();

  const since = subHours(new Date(), 24);
  const newCriticalHigh = await prisma.opsAlert.count({
    where: {
      createdAt: { gte: since },
      severity: { in: ["CRITICAL", "HIGH"] },
    },
  });

  if (newCriticalHigh > 0 && process.env.OPS_EMAIL) {
    const alerts = await prisma.opsAlert.findMany({
      where: {
        createdAt: { gte: since },
        severity: { in: ["CRITICAL", "HIGH"] },
      },
      select: { type: true, severity: true, message: true, entityId: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    const { sendOpsDailyDigest } = await import(
      "@/lib/email/templates/mentorship/ops-daily-digest"
    );
    await sendOpsDailyDigest({
      to: process.env.OPS_EMAIL,
      criticalCount: alerts.filter((a) => a.severity === "CRITICAL").length,
      highCount: alerts.filter((a) => a.severity === "HIGH").length,
      alertsSummary: alerts.map((a) => ({
        type: a.type,
        severity: a.severity,
        message: a.message,
        entityId: a.entityId,
      })),
      dashboardUrl: `${baseUrl}/dashboard/admin/mentorship`,
    });
  }

  if (systemActorId) {
    await logMentorshipAction({
      actorId: systemActorId,
      action: "OPS_CHECK_COMPLETE",
      category: "SYSTEM",
      entityType: "Cron",
      entityId: "mentorship-ops-check",
      newState: { alertsCreated: created, criticalCount, highCount },
    });
  }

  return NextResponse.json({
    alertsCreated: created,
    criticalCount,
    highCount,
  });
}
