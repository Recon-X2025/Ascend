import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { releaseTranche } from "@/lib/escrow";
import { z } from "zod";

const bodySchema = z.object({
  reason: z.string().min(20, "Reason must be at least 20 characters"),
});

/**
 * POST /api/admin/mentorship/escrow/tranches/[trancheId]/release
 * PLATFORM_ADMIN only. OPS_OVERRIDE release (e.g. after dispute resolution).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trancheId: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { trancheId } = await params;

  try {
    bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: e }, { status: 400 });
  }

  const tranche = await prisma.escrowTranche.findUnique({
    where: { id: trancheId },
  });
  if (!tranche) {
    return NextResponse.json({ error: "Tranche not found" }, { status: 404 });
  }

  try {
    await releaseTranche(trancheId, session.user.id, "OPS_OVERRIDE");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin/escrow/release] failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to release tranche" },
      { status: 400 }
    );
  }
}
