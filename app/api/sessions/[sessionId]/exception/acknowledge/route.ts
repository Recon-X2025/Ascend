/**
 * M-7: Acknowledge or decline session exception.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { z } from "zod";

const bodySchema = z.object({ action: z.enum(["acknowledge", "decline"]) });

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
  const { action } = parsed.data;

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

  const exception = await prisma.sessionExceptionNote.findFirst({
    where: {
      sessionId,
      status: "PENDING_ACKNOWLEDGEMENT",
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!exception) {
    return NextResponse.json({ error: "No pending exception to acknowledge" }, { status: 404 });
  }

  if (exception.filedBy === session.user.id) {
    return NextResponse.json({ error: "Cannot acknowledge your own exception" }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const filedByUser = await prisma.user.findUnique({
    where: { id: exception.filedBy },
    select: { email: true, name: true },
  });

  if (action === "acknowledge") {
    await prisma.sessionExceptionNote.update({
      where: { id: exception.id },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
        acknowledgedBy: session.user.id,
      },
    });
    await prisma.engagementSession.update({
      where: { id: sessionId },
      data: { status: "EXCEPTION_ACKNOWLEDGED" },
    });

    const systemUserId = process.env.M16_SYSTEM_ACTOR_ID;
    if (systemUserId) {
      await trackOutcome(systemUserId, "M7_EXCEPTION_ACKNOWLEDGED", {
        entityId: sessionId,
        entityType: "EngagementSession",
        metadata: { sessionId, exceptionId: exception.id },
      }).catch(() => {});
    }

    if (filedByUser?.email) {
      const { sendSessionExceptionAcknowledged } = await import("@/lib/email/templates/mentorship/session-exception-acknowledged");
      await sendSessionExceptionAcknowledged({
        to: filedByUser.email,
        recipientName: filedByUser.name ?? "Participant",
        sessionNumber: eng.sessionNumber,
        acknowledgedByName: session.user.name ?? session.user.email ?? "Participant",
        engagementUrl: `${baseUrl}/mentorship/engagements/${eng.contractId}`,
      }).catch(() => {});
    }
  } else {
    await prisma.sessionExceptionNote.update({
      where: { id: exception.id },
      data: {
        status: "DECLINED",
        declinedAt: new Date(),
        declinedBy: session.user.id,
      },
    });

    if (filedByUser?.email) {
      const { sendSessionExceptionDeclined } = await import("@/lib/email/templates/mentorship/session-exception-declined");
      await sendSessionExceptionDeclined({
        to: filedByUser.email,
        recipientName: filedByUser.name ?? "Participant",
        sessionNumber: eng.sessionNumber,
        declinedByName: session.user.name ?? session.user.email ?? "Participant",
        engagementUrl: `${baseUrl}/mentorship/engagements/${eng.contractId}`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true });
}
