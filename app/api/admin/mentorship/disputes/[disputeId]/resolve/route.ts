/**
 * POST /api/admin/mentorship/disputes/[disputeId]/resolve
 * Ops resolution for PENDING_OPS disputes. Cannot override auto-resolved.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { applyResolutionOutcome } from "@/lib/mentorship/disputes";
import { z } from "zod";
import type { DisputeOutcome } from "@prisma/client";

const bodySchema = z.object({
  outcome: z.enum(["UPHELD", "REJECTED", "REJECTED_INVALID"]),
  opsNote: z.string().max(5000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { disputeId } = await params;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid body", details: e instanceof z.ZodError ? e.issues : e },
      { status: 400 }
    );
  }

  const dispute = await prisma.mentorshipDispute.findUnique({
    where: { id: disputeId },
    select: {
      id: true,
      status: true,
      outcome: true,
    },
  });

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  if (dispute.status === "RESOLVED") {
    return NextResponse.json(
      { error: "Dispute already resolved" },
      { status: 400 }
    );
  }

  if (dispute.status === "AUTO_RESOLVED") {
    return NextResponse.json(
      { error: "Cannot override auto-resolved dispute" },
      { status: 400 }
    );
  }

  if (dispute.status !== "PENDING_OPS") {
    return NextResponse.json(
      { error: "Only PENDING_OPS disputes can be resolved by ops" },
      { status: 400 }
    );
  }

  try {
    await prisma.mentorshipDispute.update({
      where: { id: disputeId },
      data: {
        opsResolvedBy: session.user.id,
        opsResolvedAt: new Date(),
        opsNote: body.opsNote ?? null,
        opsReason:
          body.outcome === "UPHELD"
            ? "UPHELD"
            : body.outcome === "REJECTED_INVALID"
              ? "REJECTED_INVALID"
              : "REJECTED",
      },
    });

    await applyResolutionOutcome(disputeId, body.outcome as DisputeOutcome);

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to resolve dispute";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
