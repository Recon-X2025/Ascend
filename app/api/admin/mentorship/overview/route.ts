import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays, startOfMonth, endOfMonth, differenceInBusinessDays } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const verification48h = subDays(now, 2);
  const contract48h = subDays(now, 2);
  const stalledCutoff = subDays(now, 14);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    verificationPending,
    verificationSlaBreached,
    verificationDecisions,
    activeContracts,
    stalledCount,
    contractsPendingSignature,
    outcomesPendingMentee,
    outcomesDisputed,
    disputeSlaBreached,
    outcomesVerifiedThisMonth,
    mentorsTotal,
    mentorsHighDispute,
    mentorsLapsedReverification,
    tierBreakdown,
    alertsUnread,
    alertsCritical,
  ] = await Promise.all([
    prisma.mentorVerification.count({ where: { status: "PENDING" } }),
    prisma.mentorVerification.count({
      where: { status: "PENDING", createdAt: { lt: verification48h } },
    }),
    prisma.mentorVerification.findMany({
      where: { status: { in: ["VERIFIED", "UNVERIFIED"] }, reviewedAt: { not: null } },
      select: { reviewedAt: true, submittedAt: true },
      take: 500,
    }),
    prisma.mentorshipContract.count({
      where: { status: { in: ["ACTIVE", "PAUSED"] } },
    }),
    prisma.mentorshipContract.count({
      where: { status: "ACTIVE" },
    }).then(async (activeCount) => {
      if (activeCount === 0) return 0;
      const activeWithSessions = await prisma.mentorshipContract.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          sessions: {
            where: { completedAt: { not: null } },
            orderBy: { completedAt: "desc" },
            take: 1,
            select: { completedAt: true },
          },
        },
      });
      return activeWithSessions.filter((c) => {
        const last = c.sessions[0]?.completedAt;
        return !last || last < stalledCutoff;
      }).length;
    }),
    prisma.mentorshipContract.count({
      where: {
        status: { in: ["PENDING_MENTOR_SIGNATURE", "PENDING_MENTEE_SIGNATURE"] },
        createdAt: { lt: contract48h },
      },
    }),
    prisma.mentorshipOutcome.count({ where: { status: "PENDING_MENTEE" } }),
    prisma.mentorshipOutcome.count({ where: { status: "DISPUTED" } }),
    prisma.mentorshipOutcome
      .findMany({
        where: { status: "DISPUTED" },
        select: { updatedAt: true },
      })
      .then((disputed) =>
        disputed.filter((o) => differenceInBusinessDays(now, o.updatedAt) >= 5).length
      ),
    prisma.mentorshipOutcome.count({
      where: { status: "VERIFIED", menteeConfirmedAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.mentorProfile.count(),
    prisma.mentorProfile.count({ where: { disputeRate: { gt: 0.25 } } }),
    prisma.mentorProfile.count({
      where: {
        verificationStatus: "REVERIFICATION_REQUIRED",
        updatedAt: { lt: subDays(now, 30) },
      },
    }),
    prisma.mentorProfile.groupBy({
      by: ["tier"],
      _count: { id: true },
      where: { id: { not: "" } },
    }).then((rows) => {
      const map: Record<string, number> = { RISING: 0, ESTABLISHED: 0, ELITE: 0 };
      for (const r of rows) map[r.tier] = r._count.id;
      return map;
    }),
    prisma.opsAlert.count({ where: { isRead: false, resolvedAt: null } }),
    prisma.opsAlert.count({
      where: { severity: "CRITICAL", resolvedAt: null },
    }),
  ]);

  const avgDaysToDecision =
    verificationDecisions.length > 0
      ? verificationDecisions.reduce((sum, v) => {
          const sub = v.submittedAt?.getTime();
          const rev = v.reviewedAt?.getTime();
          if (sub && rev) return sum + (rev - sub) / (24 * 60 * 60 * 1000);
          return sum;
        }, 0) / verificationDecisions.length
      : 0;

  return NextResponse.json({
    verification: {
      pending: verificationPending,
      slaBreached: verificationSlaBreached,
      averageDaysToDecision: Math.round(avgDaysToDecision * 10) / 10,
    },
    engagements: {
      active: activeContracts,
      stalled: stalledCount,
      contractsPendingSignature: contractsPendingSignature,
    },
    outcomes: {
      pendingMenteeAck: outcomesPendingMentee,
      disputed: outcomesDisputed,
      disputeSlaBreached,
      verifiedThisMonth: outcomesVerifiedThisMonth,
    },
    mentors: {
      total: mentorsTotal,
      highDisputeRate: mentorsHighDispute,
      lapsedReverification: mentorsLapsedReverification,
      tierBreakdown,
    },
    alerts: {
      unread: alertsUnread,
      critical: alertsCritical,
    },
  });
}
