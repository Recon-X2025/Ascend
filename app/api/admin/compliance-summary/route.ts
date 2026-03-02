import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getBlockedIps } from "@/lib/blocklist";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalAuditLast30,
    criticalAuditLast30,
    openReportsCount,
    pendingDataRequestsCount,
    securityEventsLast24h,
    recentCriticalAudit,
    blockedIps,
  ] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.auditLog.count({
      where: { createdAt: { gte: thirtyDaysAgo }, severity: "CRITICAL" },
    }),
    prisma.userReport.count({ where: { status: "PENDING" } }),
    prisma.dataRequest.count({ where: { status: "PENDING" } }),
    prisma.securityEvent.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
    prisma.auditLog.findMany({
      where: { severity: "CRITICAL" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { actor: { select: { id: true, name: true } } },
    }),
    getBlockedIps(),
  ]);

  const summary = {
    totalAuditLast30Days: totalAuditLast30,
    criticalAuditLast30Days: criticalAuditLast30,
    openReports: openReportsCount,
    pendingDataRequests: pendingDataRequestsCount,
    securityEventsLast24h,
    blockedIpsCount: blockedIps.length,
    blockedIps: blockedIps.slice(0, 100),
    dataRetention: {
      contracts: "7yr policy active",
      transcripts: "3yr policy active",
    },
    recentCriticalAudit: recentCriticalAudit.map((e) => ({
      id: e.id,
      timestamp: e.createdAt.toISOString(),
      action: e.action,
      category: e.category,
      targetType: e.targetType,
      targetId: e.targetId,
      actorName: e.actor?.name ?? e.actorId,
    })),
  };

  return NextResponse.json(summary);
}
