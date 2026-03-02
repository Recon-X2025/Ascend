/**
 * POST /api/mentorship/disputes
 * Mentee files a dispute. Zod validation. Creates MentorshipDispute, freezes tranche, queues evidence.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { fileDispute } from "@/lib/mentorship/disputes";
import { z } from "zod";
import { DisputeCategory } from "@prisma/client";

const bodySchema = z.object({
  contractId: z.string().min(1),
  milestoneId: z.string().min(1),
  category: z.enum([
    "SESSION_DID_NOT_HAPPEN",
    "BELOW_MINIMUM_DURATION",
    "STENO_NOT_GENERATED",
    "OFF_PLATFORM_SOLICITATION",
    "COMMITMENTS_NOT_MET",
  ] as const),
  description: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid body", details: e instanceof z.ZodError ? e.issues : e },
      { status: 400 }
    );
  }

  try {
    const { disputeId } = await fileDispute({
      contractId: body.contractId,
      milestoneId: body.milestoneId,
      filedByUserId: session.user.id,
      category: body.category as DisputeCategory,
      description: body.description,
    });
    return NextResponse.json({ disputeId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to file dispute";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
