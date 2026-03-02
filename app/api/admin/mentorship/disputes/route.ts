/**
 * GET /api/admin/mentorship/disputes
 * Admin list of all disputes. Supports status filter and pagination.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where = status ? { status: status as "PENDING_EVIDENCE" | "EVIDENCE_ASSEMBLED" | "AUTO_RESOLVING" | "AUTO_RESOLVED" | "PENDING_OPS" | "RESOLVED" } : {};

  const [disputes, total] = await Promise.all([
    prisma.mentorshipDispute.findMany({
      where,
      include: {
        contract: {
          include: {
            mentor: { select: { id: true, name: true, email: true } },
            mentee: { select: { id: true, name: true, email: true } },
          },
        },
        milestone: { select: { milestoneNumber: true, type: true } },
        tranche: { select: { trancheNumber: true, amountPaise: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: page * limit,
      take: limit + 1,
    }),
    prisma.mentorshipDispute.count({ where }),
  ]);

  const hasMore = disputes.length > limit;
  const items = disputes.slice(0, limit).map((d) => ({
    id: d.id,
    contractId: d.contractId,
    mentorName: d.contract.mentor.name ?? d.contract.mentor.email ?? d.contract.mentor.id,
    menteeName: d.contract.mentee.name ?? d.contract.mentee.email ?? d.contract.mentee.id,
    milestoneNumber: d.milestone.milestoneNumber,
    trancheNumber: d.tranche.trancheNumber,
    amountPaise: d.tranche.amountPaise,
    category: d.category,
    status: d.status,
    outcome: d.outcome,
    createdAt: d.createdAt.toISOString(),
    resolvedAt: d.resolvedAt?.toISOString() ?? null,
  }));

  return NextResponse.json({
    items,
    total,
    hasMore,
    page,
    limit,
  });
}
