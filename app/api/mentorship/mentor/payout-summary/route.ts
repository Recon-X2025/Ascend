/**
 * GET /api/mentorship/mentor/payout-summary
 * Mentor only. Returns total earned, pending, in escrow.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getMentorPayoutSummary } from "@/lib/escrow/revenue";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ success: false, error: "Mentor profile required" }, { status: 403 });
  }

  const summary = await getMentorPayoutSummary(session.user.id);

  return NextResponse.json({
    totalEarnedPaise: summary.totalEarnedPaise,
    totalEarnedRupees: (summary.totalEarnedPaise / 100).toFixed(2),
    pendingEarnedPaise: summary.pendingEarnedPaise,
    pendingEarnedRupees: (summary.pendingEarnedPaise / 100).toFixed(2),
    inEscrowPaise: summary.inEscrowPaise,
    inEscrowRupees: (summary.inEscrowPaise / 100).toFixed(2),
  });
}
