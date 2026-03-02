import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getEscrowByContract } from "@/lib/escrow";

/**
 * GET /api/mentorship/escrow/[contractId]
 * Mentor or mentee only. Returns escrow + tranches.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await params;

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      mentorUserId: true,
      menteeUserId: true,
      agreedFeePaise: true,
      mentor: { select: { name: true } },
    },
  });
  if (!contract) {
    return NextResponse.json({ success: false, error: "Contract not found" }, { status: 404 });
  }
  const isParty =
    contract.mentorUserId === session.user.id || contract.menteeUserId === session.user.id;
  if (!isParty) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const escrow = await getEscrowByContract(contractId);
  const paymentInfo =
    contract.menteeUserId === session.user.id
      ? {
          mentorName: contract.mentor?.name ?? "Mentor",
          agreedFeePaise: contract.agreedFeePaise ?? 0,
        }
      : null;

  if (!escrow) {
    return NextResponse.json({
      escrow: null,
      paymentInfo,
      keyId: process.env.RAZORPAY_KEY_ID ?? undefined,
    });
  }

  return NextResponse.json({
    paymentInfo,
    keyId: process.env.RAZORPAY_KEY_ID ?? undefined,
    escrow: {
      id: escrow.id,
      status: escrow.status,
      paymentMode: escrow.paymentMode,
      totalAmountPaise: escrow.totalAmountPaise,
      razorpayOrderId: escrow.razorpayOrderId,
      fundedAt: escrow.fundedAt,
      tranches: escrow.tranches.map((t) => ({
        id: t.id,
        trancheNumber: t.trancheNumber,
        amountPaise: t.amountPaise,
        percentPct: t.percentPct,
        status: t.status,
        milestoneId: t.milestoneId,
        autoReleaseAt: t.autoReleaseAt,
        releasedAt: t.releasedAt,
      })),
    },
  });
}
