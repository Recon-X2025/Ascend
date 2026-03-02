/**
 * GET /api/admin/mentorship/disputes/[disputeId]
 * Admin view of dispute details (full evidence, etc.)
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
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { disputeId } = await params;

  const dispute = await prisma.mentorshipDispute.findUnique({
    where: { id: disputeId },
    include: {
      contract: {
        include: {
          mentor: { select: { id: true, name: true, email: true } },
          mentee: { select: { id: true, name: true, email: true } },
        },
      },
      milestone: {
        select: {
          id: true,
          milestoneNumber: true,
          type: true,
          completedAt: true,
          mentorFiledAt: true,
          menteeFiledAt: true,
        },
      },
      tranche: {
        select: { id: true, trancheNumber: true, amountPaise: true, status: true },
      },
      evidence: true,
      strikes: true,
    },
  });

  if (!dispute) {
    return NextResponse.json({ success: false, error: "Dispute not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: dispute.id,
    contractId: dispute.contractId,
    mentor: dispute.contract.mentor,
    mentee: dispute.contract.mentee,
    milestone: dispute.milestone,
    tranche: dispute.tranche,
    category: dispute.category,
    description: dispute.description,
    status: dispute.status,
    outcome: dispute.outcome,
    opsReason: dispute.opsReason,
    opsResolvedBy: dispute.opsResolvedBy,
    opsResolvedAt: dispute.opsResolvedAt?.toISOString() ?? null,
    opsNote: dispute.opsNote,
    evidenceAssembledAt: dispute.evidenceAssembledAt?.toISOString() ?? null,
    autoResolvedAt: dispute.autoResolvedAt?.toISOString() ?? null,
    resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
    filedByUserId: dispute.filedByUserId,
    createdAt: dispute.createdAt.toISOString(),
    updatedAt: dispute.updatedAt.toISOString(),
    evidence: dispute.evidence.map((e) => ({
      evidenceType: e.evidenceType,
      content: e.content,
      createdAt: e.createdAt.toISOString(),
    })),
    strikes: dispute.strikes.map((s) => ({
      userId: s.userId,
      strikeType: s.strikeType,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}
