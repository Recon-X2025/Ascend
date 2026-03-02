import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import {
  notifyMentorSessionAccepted,
  notifyMentorSessionDeclined,
  notifyMentorSessionCompleted,
} from "@/lib/notifications/create";
import { emitSignal } from "@/lib/signals/emit";
import { SignalType } from "@prisma/client";

const VALID_ACTIONS = ["accept", "decline", "schedule", "complete", "cancel"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  let body: { action?: string; scheduledAt?: string; meetingLink?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const action = body.action as string | undefined;
  if (!action || !VALID_ACTIONS.includes(action as (typeof VALID_ACTIONS)[number])) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const mentorSession = await prisma.mentorSession.findUnique({
    where: { id: sessionId },
    include: {
      mentorProfile: { include: { user: { select: { id: true, name: true } } } },
      mentee: { select: { id: true, name: true } },
    },
  });

  if (!mentorSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isMentor = mentorSession.mentorProfile.userId === session.user.id;
  const isMentee = mentorSession.menteeId === session.user.id;

  if (action === "accept" || action === "decline" || action === "schedule" || action === "complete") {
    if (!isMentor) {
      return NextResponse.json({ error: "Only the mentor can perform this action" }, { status: 403 });
    }
  }
  if (action === "cancel") {
    if (!isMentor && !isMentee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let newStatus: string;
  let scheduledAt: Date | null = mentorSession.scheduledAt;
  let meetingLink: string | null = mentorSession.meetingLink;

  switch (action) {
    case "accept":
      newStatus = "ACCEPTED";
      if (body.scheduledAt) scheduledAt = new Date(body.scheduledAt);
      if (body.meetingLink) meetingLink = body.meetingLink;
      break;
    case "decline":
      newStatus = "DECLINED";
      break;
    case "schedule":
      newStatus = "SCHEDULED";
      if (body.scheduledAt) scheduledAt = new Date(body.scheduledAt);
      if (body.meetingLink) meetingLink = body.meetingLink;
      break;
    case "complete":
      newStatus = "COMPLETED";
      break;
    case "cancel":
      newStatus = "CANCELLED";
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updateData: { status: "ACCEPTED" | "DECLINED" | "SCHEDULED" | "COMPLETED" | "CANCELLED"; scheduledAt?: Date | null; meetingLink?: string | null } = {
    status: newStatus as "ACCEPTED" | "DECLINED" | "SCHEDULED" | "COMPLETED" | "CANCELLED",
  };
  if (action === "accept" || action === "schedule") {
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt;
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
  }

  const updated = await prisma.mentorSession.update({
    where: { id: sessionId },
    data: updateData,
  });

  if (action === "accept" || action === "decline") {
    if (action === "accept") {
      await notifyMentorSessionAccepted(
        mentorSession.menteeId,
        mentorSession.mentorProfile.user.name ?? "Your mentor",
        scheduledAt
      );
    } else {
      await notifyMentorSessionDeclined(
        mentorSession.menteeId,
        mentorSession.mentorProfile.user.name ?? "Mentor"
      );
    }
  }

  if (action === "complete") {
    await notifyMentorSessionCompleted(
      mentorSession.menteeId,
      mentorSession.mentorProfile.user.name ?? "Mentor",
      sessionId
    );
    if (!mentorSession.careerSignalFired) {
      await emitSignal({
        type: SignalType.MENTOR_SESSION_COMPLETED,
        actorId: mentorSession.mentorProfile.userId,
        audienceUserIds: [mentorSession.menteeId],
        metadata: {
          mentorName: mentorSession.mentorProfile.user.name,
          focusArea: mentorSession.mentorProfile.focusAreas[0] ?? null,
        },
      });
      await prisma.mentorSession.update({
        where: { id: sessionId },
        data: { careerSignalFired: true },
      });
    }
    await prisma.mentorProfile.update({
      where: { id: mentorSession.mentorProfileId },
      data: {
        totalSessions: { increment: 1 },
      },
    });
    const { queueMatchRefreshAll } = await import("@/lib/mentorship/refresh-matches");
    queueMatchRefreshAll().catch(() => {});
  }

  return NextResponse.json({ success: true, session: updated });
}
