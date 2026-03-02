/**
 * GET /api/mentorship/disputes/[disputeId]
 * Mentor or mentee view of dispute status. Participant access only.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { disputeId } = await params;

  const dispute = await prisma.mentorshipDispute.findUnique({
    where: { id: disputeId },
    include: {
      contract: {
        select: { mentorUserId: true, menteeUserId: true },
      },
      milestone: {
        select: {
          id: true,
          milestoneNumber: true,
          type: true,
          completedAt: true,
        },
      },
      tranche: {
        select: { trancheNumber: true, amountPaise: true, status: true },
      },
      evidence: {
        select: { evidenceType: true, createdAt: true },
      },
    },
  });

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  const isParticipant =
    dispute.contract.mentorUserId === session.user.id ||
    dispute.contract.menteeUserId === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: dispute.id,
    contractId: dispute.contractId,
    milestoneId: dispute.milestoneId,
    milestoneNumber: dispute.milestone.milestoneNumber,
    milestoneType: dispute.milestone.type,
    trancheNumber: dispute.tranche.trancheNumber,
    amountPaise: dispute.tranche.amountPaise,
    trancheStatus: dispute.tranche.status,
    category: dispute.category,
    description: dispute.description,
    status: dispute.status,
    outcome: dispute.outcome,
    opsNote: dispute.opsNote,
    evidenceAssembledAt: dispute.evidenceAssembledAt?.toISOString() ?? null,
    autoResolvedAt: dispute.autoResolvedAt?.toISOString() ?? null,
    resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
    createdAt: dispute.createdAt.toISOString(),
    evidenceTypes: dispute.evidence.map((e) => e.evidenceType),
    filedByUserId: dispute.filedByUserId,
  });
}
