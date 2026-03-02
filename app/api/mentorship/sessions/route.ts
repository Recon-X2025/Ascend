import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { notifyMentorSessionRequested } from "@/lib/notifications/create";
import { track, EVENTS } from "@/lib/analytics/track";
import type { SessionFormat } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const mentorProfileId = typeof o.mentorProfileId === "string" ? o.mentorProfileId : "";
  const sessionGoal = typeof o.sessionGoal === "string" ? o.sessionGoal.trim() : "";
  const sessionFormat = typeof o.sessionFormat === "string" ? (o.sessionFormat as SessionFormat) : "VIDEO_CALL";
  const scheduledAt = o.scheduledAt ? new Date(o.scheduledAt as string) : null;

  if (!mentorProfileId) {
    return NextResponse.json({ success: false, error: "mentorProfileId required" }, { status: 400 });
  }
  if (sessionGoal.length < 50 || sessionGoal.length > 500) {
    return NextResponse.json({ success: false, error: "sessionGoal must be 50–500 characters" }, { status: 400 });
  }

  const mentorProfile = await prisma.mentorProfile.findFirst({
    where: { id: mentorProfileId, isActive: true },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!mentorProfile) {
    return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });
  }
  if (mentorProfile.userId === session.user.id) {
    return NextResponse.json({ success: false, error: "Cannot request a session with yourself" }, { status: 400 });
  }

  const mentorSession = await prisma.mentorSession.create({
    data: {
      mentorProfileId,
      menteeId: session.user.id,
      sessionGoal,
      sessionFormat,
      scheduledAt,
      status: "REQUESTED",
    },
  });

  await notifyMentorSessionRequested(
    mentorProfile.userId,
    session.user.name ?? "Someone",
    sessionGoal
  );

  track(EVENTS.MENTOR_SESSION_REQUESTED, { mentorProfileId }, { userId: session.user.id, persona: (session.user as { persona?: string }).persona ?? undefined }).catch(() => {});

  return NextResponse.json({ success: true, session: { id: mentorSession.id, status: mentorSession.status } });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role"); // mentee | mentor

  if (role === "mentor") {
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!mentorProfile) {
      return NextResponse.json({ sessions: [] });
    }
    const sessions = await prisma.mentorSession.findMany({
      where: { mentorProfileId: mentorProfile.id },
      include: {
        mentee: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        status: s.status,
        sessionGoal: s.sessionGoal,
        sessionFormat: s.sessionFormat,
        scheduledAt: s.scheduledAt,
        durationMinutes: s.durationMinutes,
        meetingLink: s.meetingLink,
        menteeRating: s.menteeRating,
        menteeFeedback: s.menteeFeedback,
        mentee: s.mentee,
        createdAt: s.createdAt,
      })),
    });
  }

  // mentee (default)
  const sessions = await prisma.mentorSession.findMany({
    where: { menteeId: session.user.id },
    include: {
      mentorProfile: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      status: s.status,
      sessionGoal: s.sessionGoal,
      sessionFormat: s.sessionFormat,
      scheduledAt: s.scheduledAt,
      durationMinutes: s.durationMinutes,
      meetingLink: s.meetingLink,
      menteeRating: s.menteeRating,
      menteeFeedback: s.menteeFeedback,
      mentor: s.mentorProfile.user,
      mentorProfileId: s.mentorProfileId,
      createdAt: s.createdAt,
    })),
  });
}
