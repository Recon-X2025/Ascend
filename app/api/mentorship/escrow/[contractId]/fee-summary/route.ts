/**
 * GET /api/mentorship/escrow/[contractId]/fee-summary
 * Mentor: fee details (tier, rate, platform fee, net). Mentee: total only (never platform fee).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getEscrowByContract } from "@/lib/escrow";
import { getLiveFeeRate, formatFeeRate } from "@/lib/escrow/fees";

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
    select: { mentorUserId: true, menteeUserId: true },
  });
  if (!contract) {
    return NextResponse.json({ success: false, error: "Contract not found" }, { status: 404 });
  }

  const isMentor = contract.mentorUserId === session.user.id;
  const isMentee = contract.menteeUserId === session.user.id;
  if (!isMentor && !isMentee) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const escrow = await getEscrowByContract(contractId);
  if (!escrow) {
    return NextResponse.json({
      totalAmountPaise: 0,
      totalRupees: "0.00",
      ...(isMentor ? { feeRateDisplay: "—", platformFeePaise: 0, mentorNetPaise: 0 } : {}),
    });
  }

  const totalRupees = (escrow.totalAmountPaise / 100).toFixed(2);

  if (isMentee) {
    return NextResponse.json({
      totalAmountPaise: escrow.totalAmountPaise,
      totalRupees,
    });
  }

  const { tier, rate } = await getLiveFeeRate(session.user.id, escrow.paymentMode);
  const pilotFeeWaived = escrow.pilotFeeWaived ?? false;

  const releasedTranches = escrow.tranches.filter((t) => t.status === "RELEASED");
  let totalPlatformFeePaise = releasedTranches.reduce((s, t) => s + (t.platformFeePaise ?? 0), 0);
  let totalMentorNetPaise = releasedTranches.reduce((s, t) => s + (t.mentorNetPaise ?? 0), 0);

  const pendingTranches = escrow.tranches.filter((t) =>
    ["HELD", "PENDING_RELEASE"].includes(t.status)
  );
  const { calculateFeeAmounts } = await import("@/lib/escrow/fees");
  for (const t of pendingTranches) {
    const { platformFeePaise, mentorNetPaise } = calculateFeeAmounts(
      t.amountPaise,
      rate,
      pilotFeeWaived
    );
    totalPlatformFeePaise += platformFeePaise;
    totalMentorNetPaise += mentorNetPaise;
  }

  return NextResponse.json({
    totalAmountPaise: escrow.totalAmountPaise,
    totalRupees,
    feeRateDisplay: formatFeeRate(rate),
    tier,
    pilotFeeWaived,
    platformFeePaise: totalPlatformFeePaise,
    mentorNetPaise: totalMentorNetPaise,
  });
}
