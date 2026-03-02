/**
 * M-7: File session exception note.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { addDays } from "date-fns";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { z } from "zod";

const bodySchema = z.object({ note: z.string().min(1).max(5000) });

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const eng = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: { contract: true, exceptionNotes: true },
  });
  if (!eng) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const isMentor = eng.contract.mentorUserId === session.user.id;
  const isMentee = eng.contract.menteeUserId === session.user.id;
  if (!isMentor && !isMentee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pending = eng.exceptionNotes
    .filter((n) => n.status === "PENDING_ACKNOWLEDGEMENT" && n.filedBy !== session.user.id)
    .filter((n) => !n.expiresAt || n.expiresAt >= new Date())
    .map((n) => ({ id: n.id, note: n.note, filedAt: n.createdAt.toISOString() }));

  return NextResponse.json({
    contractId: eng.contractId,
    pendingExceptions: pending,
  });
}

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
  const { note } = parsed.data;

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

  const expiresAt = addDays(new Date(), 7);
  const exception = await prisma.sessionExceptionNote.create({
    data: {
      sessionId,
      filedBy: session.user.id,
      note,
      status: "PENDING_ACKNOWLEDGEMENT",
      expiresAt,
    },
  });

  const systemUserId = process.env.M16_SYSTEM_ACTOR_ID;
  if (systemUserId) {
    await trackOutcome(systemUserId, "M7_EXCEPTION_FILED", {
      entityId: sessionId,
      entityType: "EngagementSession",
      metadata: { sessionId, exceptionId: exception.id },
    }).catch(() => {});
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const otherUserId = isMentor ? eng.contract.menteeUserId : eng.contract.mentorUserId;
  const other = await prisma.user.findUnique({ where: { id: otherUserId }, select: { email: true, name: true } });
  if (other?.email) {
    const { sendSessionExceptionFiled } = await import("@/lib/email/templates/mentorship/session-exception-filed");
    await sendSessionExceptionFiled({
      to: other.email,
      recipientName: other.name ?? "Participant",
      sessionNumber: eng.sessionNumber,
      filedByName: session.user.name ?? session.user.email ?? "Participant",
      noteExcerpt: note.slice(0, 200),
      acknowledgeUrl: `${baseUrl}/mentorship/sessions/${sessionId}/exception`,
      engagementUrl: `${baseUrl}/mentorship/engagements/${eng.contractId}`,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, exceptionId: exception.id, contractId: eng.contractId });
}
