import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  let body: { rating?: number; feedback?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rating = typeof body.rating === "number" ? Math.min(5, Math.max(1, Math.round(body.rating))) : undefined;
  const feedback = typeof body.feedback === "string" ? body.feedback.trim().slice(0, 2000) : undefined;

  if (rating === undefined) {
    return NextResponse.json({ error: "rating (1-5) required" }, { status: 400 });
  }

  const mentorSession = await prisma.mentorSession.findUnique({
    where: { id: sessionId },
    include: { mentorProfile: true },
  });

  if (!mentorSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (mentorSession.menteeId !== session.user.id) {
    return NextResponse.json({ error: "Only the mentee can leave a review" }, { status: 403 });
  }
  if (mentorSession.status !== "COMPLETED") {
    return NextResponse.json({ error: "Session must be completed to review" }, { status: 400 });
  }
  if (mentorSession.menteeRating != null) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.mentorSession.update({
      where: { id: sessionId },
      data: { menteeRating: rating, menteeFeedback: feedback ?? null },
    }),
  ]);

  const sessionsWithRating = await prisma.mentorSession.findMany({
    where: {
      mentorProfileId: mentorSession.mentorProfileId,
      status: "COMPLETED",
      menteeRating: { not: null },
    },
    select: { menteeRating: true },
  });

  const sum = sessionsWithRating.reduce((a, s) => a + (s.menteeRating ?? 0), 0);
  const averageRating = sessionsWithRating.length ? sum / sessionsWithRating.length : null;

  await prisma.mentorProfile.update({
    where: { id: mentorSession.mentorProfileId },
    data: { averageRating: averageRating ?? undefined },
  });

  return NextResponse.json({ success: true });
}
