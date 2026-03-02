/**
 * M-12: Mentorship Circles API.
 * GET: list circles (as mentor: mine; as mentee: discoverable)
 * POST: create circle (mentor only)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { createCircle, CreateCircleSchema } from "@/lib/mentorship/circles";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (mentorProfile) {
    const asMentor = await prisma.mentorshipCircle.findMany({
      where: { mentorId: session.user.id },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      asMentor: true,
      circles: asMentor.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        maxMembers: c.maxMembers,
        feePaise: c.feePaise,
        startDate: c.startDate.toISOString(),
        status: c.status,
        memberCount: c._count.members,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  }

  const openCircles = await prisma.mentorshipCircle.findMany({
    where: {
      status: "OPEN",
      startDate: { gt: new Date() },
    },
    include: {
      mentorProfile: {
        include: {
          user: { select: { name: true, image: true } },
        },
      },
      _count: { select: { members: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({
    asMentor: false,
    circles: openCircles.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      maxMembers: c.maxMembers,
      feePaise: c.feePaise,
      startDate: c.startDate.toISOString(),
      mentorName: c.mentorProfile.user.name,
      mentorImage: c.mentorProfile.user.image,
      memberCount: c._count.members,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!mentorProfile) {
    return NextResponse.json(
      { error: "Mentor profile required to create circles" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateCircleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await createCircle(session.user.id, parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create circle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
