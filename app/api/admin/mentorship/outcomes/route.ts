import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { OutcomeStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const OUTCOME_STATUSES: OutcomeStatus[] = ["PENDING_MENTEE", "VERIFIED", "DISPUTED", "UNACKNOWLEDGED", "OPS_REVIEWED"];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const statusFilter = OUTCOME_STATUSES.includes(statusParam as OutcomeStatus) ? (statusParam as OutcomeStatus) : null;
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where: Prisma.MentorshipOutcomeWhereInput = {};
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [items, total] = await Promise.all([
    prisma.mentorshipOutcome.findMany({
      where,
      include: {
        mentor: { select: { id: true, name: true, email: true } },
        mentee: { select: { id: true, name: true, email: true } },
        contract: { select: { id: true } },
      },
      orderBy: { submittedAt: "desc" },
      skip: page * limit,
      take: limit,
    }),
    prisma.mentorshipOutcome.count({ where }),
  ]);

  const list = items.map((o) => ({
    id: o.id,
    contractId: o.contractId,
    mentorId: o.mentorId,
    menteeId: o.menteeId,
    mentorName: o.mentor.name ?? null,
    mentorEmail: o.mentor.email ?? null,
    menteeName: o.mentee.name ?? null,
    menteeEmail: o.mentee.email ?? null,
    transitionType: o.transitionType,
    claimedOutcome: o.claimedOutcome,
    mentorReflection: o.mentorReflection,
    status: o.status,
    submittedAt: o.submittedAt.toISOString(),
    menteeConfirmedAt: o.menteeConfirmedAt?.toISOString() ?? null,
    menteeDisputedAt: o.menteeDisputedAt?.toISOString() ?? null,
    menteeNote: o.menteeNote,
    acknowledgementDeadline: o.acknowledgementDeadline.toISOString(),
    opsReviewedAt: o.opsReviewedAt?.toISOString() ?? null,
    opsDecision: o.opsDecision,
    opsNote: o.opsNote,
    checkInStatus: o.checkInStatus,
    checkInBadgeGranted: o.checkInBadgeGranted,
  }));

  return NextResponse.json({
    items: list,
    total,
    page,
    limit,
    hasNext: (page + 1) * limit < total,
  });
}
