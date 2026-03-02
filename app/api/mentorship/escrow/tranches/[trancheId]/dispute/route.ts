import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { freezeTranche } from "@/lib/escrow";
import { z } from "zod";

const bodySchema = z.object({
  reason: z.string().min(1).max(2000),
});

/**
 * POST /api/mentorship/escrow/tranches/[trancheId]/dispute
 * Mentee only. Disputes tranche → freeze for ops review.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trancheId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { trancheId } = await params;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: e }, { status: 400 });
  }

  const tranche = await prisma.escrowTranche.findUnique({
    where: { id: trancheId },
    include: { escrow: { select: { menteeId: true } } },
  });
  if (!tranche) {
    return NextResponse.json({ error: "Tranche not found" }, { status: 404 });
  }
  if (tranche.escrow.menteeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden — mentee only" }, { status: 403 });
  }

  try {
    await freezeTranche(trancheId, session.user.id, body.reason);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[escrow/dispute] failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to dispute tranche" },
      { status: 400 }
    );
  }
}
