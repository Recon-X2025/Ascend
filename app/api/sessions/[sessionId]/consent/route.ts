/**
 * M-7: Record steno consent.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { recordStenoConsent } from "@/lib/sessions/steno";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { z } from "zod";

const bodySchema = z.object({ acknowledged: z.boolean() });

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { acknowledged } = parsed.data;

  const eng = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: { contract: true },
  });
  if (!eng) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const isMentor = eng.contract.mentorUserId === session.user.id;
  const isMentee = eng.contract.menteeUserId === session.user.id;
  if (!isMentor && !isMentee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const participantType = isMentor ? "MENTOR" : "MENTEE";
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;

  await recordStenoConsent(sessionId, session.user.id, participantType, acknowledged, ip);

  const systemUserId = process.env.M16_SYSTEM_ACTOR_ID;
  if (systemUserId) {
    await trackOutcome(systemUserId, "M7_STENO_CONSENT_RECORDED", {
      entityId: sessionId,
      entityType: "EngagementSession",
      metadata: { sessionId, userId: session.user.id, acknowledged },
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
