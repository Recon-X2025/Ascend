import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { confirmTranche } from "@/lib/escrow";

/**
 * POST /api/mentorship/escrow/tranches/[trancheId]/confirm
 * Mentee only. Confirms tranche → immediate release to mentor.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trancheId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { trancheId } = await params;

  const tranche = await prisma.escrowTranche.findUnique({
    where: { id: trancheId },
    include: { escrow: { select: { menteeId: true } } },
  });
  if (!tranche) {
    return NextResponse.json({ success: false, error: "Tranche not found" }, { status: 404 });
  }
  if (tranche.escrow.menteeId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden — mentee only" }, { status: 403 });
  }

  try {
    await confirmTranche(trancheId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[escrow/confirm] failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to confirm tranche" },
      { status: 400 }
    );
  }
}
