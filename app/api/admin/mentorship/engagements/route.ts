import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays } from "date-fns";
import type { ContractStatus } from "@prisma/client";

const STALLED_DAYS = 14;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const stalledOnly = searchParams.get("stalledOnly") === "true";
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where: { status: ContractStatus | { in: ContractStatus[] } } =
    statusParam === "ACTIVE" || statusParam === "PAUSED"
      ? { status: statusParam }
      : { status: { in: ["ACTIVE", "PAUSED"] } };

  const contracts = await prisma.mentorshipContract.findMany({
    where,
    include: {
      mentor: { select: { id: true, name: true, email: true } },
      mentee: { select: { id: true, name: true, email: true } },
      sessions: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { completedAt: true },
      },
      milestones: { select: { id: true, status: true } },
      outcome: { select: { id: true, status: true, acknowledgementDeadline: true } },
    },
    orderBy: { updatedAt: "desc" },
    skip: page * limit,
    take: limit + 1,
  });

  const stalledCutoff = subDays(new Date(), STALLED_DAYS);
  const now = new Date();

  const items = contracts.slice(0, limit).map((c) => {
    const lastSession = c.sessions[0]?.completedAt ?? null;
    const stalled = c.status === "ACTIVE" && (!lastSession || lastSession < stalledCutoff);
    const completedMilestones = c.milestones.filter((m) => m.status === "COMPLETE").length;
    const totalMilestones = c.milestones.length;
    const outcomeOverdue =
      c.outcome?.status === "PENDING_MENTEE" && c.outcome.acknowledgementDeadline < now;

    return {
      id: c.id,
      mentorName: c.mentor.name ?? c.mentor.email ?? c.mentor.id,
      menteeName: c.mentee.name ?? c.mentee.email ?? c.mentee.id,
      engagementType: c.engagementType,
      status: c.status,
      startDate: c.engagementStart,
      lastSessionAt: lastSession,
      daysSinceLastSession: lastSession
        ? Math.floor((now.getTime() - lastSession.getTime()) / (24 * 60 * 60 * 1000))
        : null,
      milestoneProgress: `${completedMilestones}/${totalMilestones}`,
      outcomeStatus: c.outcome?.status ?? null,
      outcomeOverdue,
      stalled,
      flags: {
        stalled,
        outcomeOverdue,
        critical: stalled || outcomeOverdue,
      },
    };
  });

  const resultItems = stalledOnly ? items.filter((i) => i.stalled) : items;
  let total: number;
  if (stalledOnly) {
    const activeContracts = await prisma.mentorshipContract.findMany({
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
    total = activeContracts.filter((c) => {
      const last = c.sessions[0]?.completedAt;
      return !last || last < stalledCutoff;
    }).length;
  } else {
    total = await prisma.mentorshipContract.count({
      where: statusParam ? { status: statusParam as ContractStatus } : { status: { in: ["ACTIVE", "PAUSED"] } },
    });
  }

  return NextResponse.json({
    items: resultItems,
    total,
    page,
    limit,
  });
}
