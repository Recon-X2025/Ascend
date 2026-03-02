/**
 * M-12: Admin GET circles.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const circles = await prisma.mentorshipCircle.findMany({
    include: {
      mentorProfile: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    circles.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      startDate: c.startDate.toISOString(),
      feePaise: c.feePaise,
      maxMembers: c.maxMembers,
      mentorName: c.mentorProfile.user.name,
      mentorEmail: c.mentorProfile.user.email,
      memberCount: c._count.members,
      createdAt: c.createdAt.toISOString(),
    }))
  );
}
