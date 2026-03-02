/**
 * M-7: Create/get room + token for session join.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getOrCreateSessionRoom, generateRoomToken } from "@/lib/sessions/room";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
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

  if (eng.status !== "SCHEDULED" && eng.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Session not joinable" }, { status: 400 });
  }

  try {
    const { dailyRoomUrl } = await getOrCreateSessionRoom(sessionId);
    const role = isMentor ? "mentor" : "mentee";
    const token = await generateRoomToken(
      sessionId,
      session.user.id,
      role,
      session.user.name ?? session.user.email ?? "Participant"
    );
    return NextResponse.json({
      roomUrl: dailyRoomUrl,
      token,
      expiresIn: 7200,
    });
  } catch (e) {
    console.error("[SessionRoom] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create room" },
      { status: 500 }
    );
  }
}
