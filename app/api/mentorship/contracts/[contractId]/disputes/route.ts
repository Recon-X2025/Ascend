/**
 * GET /api/mentorship/contracts/[contractId]/disputes
 * Mentor or mentee list of disputes for the contract. Participant access only.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await params;

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    select: { mentorUserId: true, menteeUserId: true },
  });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const isParticipant =
    contract.mentorUserId === session.user.id ||
    contract.menteeUserId === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const disputes = await prisma.mentorshipDispute.findMany({
    where: { contractId },
    include: {
      milestone: {
        select: { milestoneNumber: true, type: true },
      },
      tranche: {
        select: { trancheNumber: true, amountPaise: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    disputes.map((d) => ({
      id: d.id,
      milestoneId: d.milestoneId,
      milestoneNumber: d.milestone.milestoneNumber,
      milestoneType: d.milestone.type,
      trancheNumber: d.tranche.trancheNumber,
      amountPaise: d.tranche.amountPaise,
      trancheStatus: d.tranche.status,
      category: d.category,
      status: d.status,
      outcome: d.outcome,
      filedByUserId: d.filedByUserId,
      createdAt: d.createdAt.toISOString(),
      resolvedAt: d.resolvedAt?.toISOString() ?? null,
    }))
  );
}
