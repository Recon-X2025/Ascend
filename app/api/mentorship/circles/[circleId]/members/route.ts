/**
 * M-12: GET circle members.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { circleId } = await params;

  const circle = await prisma.mentorshipCircle.findUnique({
    where: { id: circleId },
    include: {
      members: {
        include: {
          mentee: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!circle) {
    return NextResponse.json({ error: "Circle not found" }, { status: 404 });
  }

  const isMentor = circle.mentorId === session.user.id;
  const isMember = circle.members.some((m) => m.menteeId === session.user.id);
  if (!isMentor && !isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    circle.members.map((m) => ({
      id: m.id,
      status: m.status,
      menteeId: m.menteeId,
      menteeName: m.mentee.name,
      menteeImage: m.mentee.image,
      appliedAt: m.appliedAt.toISOString(),
    }))
  );
}
