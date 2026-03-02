/**
 * M-12: GET circle by ID.
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
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { circleId } = await params;

  const circle = await prisma.mentorshipCircle.findUnique({
    where: { id: circleId },
    include: {
      mentorProfile: {
        include: {
          user: { select: { name: true, image: true } },
        },
      },
      members: {
        include: {
          mentee: { select: { id: true, name: true, image: true } },
        },
      },
      _count: { select: { members: true } },
    },
  });

  if (!circle) {
    return NextResponse.json({ success: false, error: "Circle not found" }, { status: 404 });
  }

  const isMentor = circle.mentorId === session.user.id;
  const isMember = circle.members.some((m) => m.menteeId === session.user.id);
  if (!isMentor && !isMember && circle.status === "DRAFT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: circle.id,
    title: circle.title,
    description: circle.description,
    maxMembers: circle.maxMembers,
    feePaise: circle.feePaise,
    startDate: circle.startDate.toISOString(),
    status: circle.status,
    leadTimeDays: circle.leadTimeDays,
    mentorName: circle.mentorProfile.user.name,
    mentorImage: circle.mentorProfile.user.image,
    memberCount: circle._count.members,
    members: circle.members.map((m) => ({
      id: m.id,
      status: m.status,
      menteeId: m.menteeId,
      menteeName: m.mentee.name,
      menteeImage: m.mentee.image,
    })),
    isMentor,
    isMember,
  });
}
