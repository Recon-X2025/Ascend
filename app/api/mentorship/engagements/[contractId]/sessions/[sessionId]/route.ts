import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { trackOutcome } from "@/lib/tracking/outcomes";

const scheduleSchema = z.object({ action: z.literal("schedule"), scheduledAt: z.string().datetime() });
const completeSchema = z.object({
  action: z.literal("complete"),
  durationMinutes: z.number().int().min(1).max(480),
  sharedNotes: z.string().max(2000).optional(),
  mentorNotes: z.string().max(2000).optional(),
});
const cancelSchema = z.object({ action: z.literal("cancel") });
const bodySchema = z.discriminatedUnion("action", [
  scheduleSchema,
  completeSchema,
  cancelSchema,
]);

/**
 * PATCH /api/mentorship/engagements/[contractId]/sessions/[sessionId]
 * Mentor only: schedule, complete, or cancel an engagement session.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string; sessionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contractId, sessionId } = await params;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: e }, { status: 400 });
  }

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      sessions: true,
      mentor: { select: { email: true, name: true } },
      mentee: { select: { email: true, name: true } },
      documents: true,
    },
  });

  if (!contract || contract.mentorUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const engagementSession = contract.sessions.find((s) => s.id === sessionId);
  if (!engagementSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  if (body.action === "schedule") {
    const scheduledAt = new Date(body.scheduledAt);
    if (contract.engagementEnd && scheduledAt > contract.engagementEnd) {
      return NextResponse.json(
        { error: "Scheduled time must be within engagement window" },
        { status: 400 }
      );
    }
    if (scheduledAt <= new Date()) {
      return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
    }

    await prisma.engagementSession.update({
      where: { id: sessionId },
      data: { scheduledAt },
    });

    const { sendSessionScheduled } = await import(
      "@/lib/email/templates/mentorship/engagement-session-scheduled"
    );
    await sendSessionScheduled({
      to: contract.mentee.email,
      menteeName: contract.mentee.name ?? "Mentee",
      sessionNumber: engagementSession.sessionNumber,
      scheduledAt,
      engagementUrl: `${baseUrl}/mentorship/engagements/${contractId}`,
    });

    await trackOutcome(contract.mentorUserId, "M8_SESSION_SCHEDULED", {
      entityId: contractId,
      entityType: "MentorshipContract",
      metadata: {
        contractId,
        sessionId,
        sessionNumber: engagementSession.sessionNumber,
        scheduledAt: scheduledAt.toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  }

  if (body.action === "complete") {
    const now = new Date();
    await prisma.engagementSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: now,
        durationMinutes: body.durationMinutes,
        sharedNotes: body.sharedNotes ?? null,
        mentorNotes: body.mentorNotes ?? null,
      },
    });

    // If session 1 and no goal document yet, we don't auto-create — mentor uses POST /documents/[contractId]/goal
    const goalDoc = contract.documents.find((d) => d.type === "GOAL_DOCUMENT");
    if (engagementSession.sessionNumber === 1 && !goalDoc) {
      // Trigger is just that mentor can now create goal doc via API
    }

    const { sendSessionCompleted } = await import(
      "@/lib/email/templates/mentorship/engagement-session-completed"
    );
    await sendSessionCompleted({
      to: contract.mentee.email,
      menteeName: contract.mentee.name ?? "Mentee",
      sessionNumber: engagementSession.sessionNumber,
      sharedNotes: body.sharedNotes ?? undefined,
      engagementUrl: `${baseUrl}/mentorship/engagements/${contractId}`,
    });

    await trackOutcome(contract.mentorUserId, "M8_SESSION_COMPLETED", {
      entityId: contractId,
      entityType: "MentorshipContract",
      metadata: {
        contractId,
        sessionId,
        sessionNumber: engagementSession.sessionNumber,
        durationMinutes: body.durationMinutes,
      },
    });

    return NextResponse.json({ success: true });
  }

  // cancel
  await prisma.engagementSession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED", scheduledAt: null },
  });

  const { sendSessionCancelled } = await import(
    "@/lib/email/templates/mentorship/engagement-session-cancelled"
  );
  await sendSessionCancelled({
    to: contract.mentee.email,
    menteeName: contract.mentee.name ?? "Mentee",
    sessionNumber: engagementSession.sessionNumber,
    engagementUrl: `${baseUrl}/mentorship/engagements/${contractId}`,
  });

  await trackOutcome(contract.mentorUserId, "M8_SESSION_CANCELLED", {
    entityId: contractId,
    entityType: "MentorshipContract",
    metadata: { contractId, sessionId, sessionNumber: engagementSession.sessionNumber },
  });

  return NextResponse.json({ success: true });
}
