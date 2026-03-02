/**
 * M-7: Admin get single session detail.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { sessionId } = await params;
  const eng = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: {
      contract: {
        include: {
          mentor: { select: { id: true, name: true, email: true } },
          mentee: { select: { id: true, name: true, email: true } },
        },
      },
      sessionRoom: true,
      sessionRecord: true,
      joinLogs: true,
      stenoConsents: true,
      transcripts: { take: 1, orderBy: { createdAt: "desc" } },
      stenoExtractions: { take: 1, orderBy: { createdAt: "desc" } },
      exceptionNotes: true,
    },
  });

  if (!eng) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  return NextResponse.json({
    id: eng.id,
    contractId: eng.contractId,
    sessionNumber: eng.sessionNumber,
    status: eng.status,
    scheduledAt: eng.scheduledAt?.toISOString(),
    completedAt: eng.completedAt?.toISOString(),
    slotDurationMins: eng.slotDurationMins,
    effectiveDurationMins: eng.effectiveDurationMins,
    carryOverMins: eng.carryOverMins,
    effectiveSlotMins: eng.effectiveSlotMins,
    stenoStatus: eng.stenoStatus,
    mentor: eng.contract.mentor,
    mentee: eng.contract.mentee,
    sessionRoom: eng.sessionRoom,
    sessionRecord: eng.sessionRecord,
    joinLogs: eng.joinLogs,
    stenoConsents: eng.stenoConsents,
    transcript: eng.transcripts[0],
    extraction: eng.stenoExtractions[0],
    exceptionNotes: eng.exceptionNotes,
  });
}
