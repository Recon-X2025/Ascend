/**
 * M-12: POST create peer check-in, GET list peer check-ins.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import {
  createPeerCheckIn,
  PeerCheckInSchema,
} from "@/lib/mentorship/circles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { circleId } = await params;

  const member = await prisma.circleMember.findFirst({
    where: {
      circleId,
      menteeId: session.user.id,
      status: { in: ["ACCEPTED", "CONFIRMED"] },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const checkIns = await prisma.circlePeerCheckIn.findMany({
    where: { circleId },
    include: {
      fromMember: {
        include: { mentee: { select: { name: true } } },
      },
      toMember: {
        include: { mentee: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    checkIns.map((c) => ({
      id: c.id,
      fromMemberId: c.fromMemberId,
      fromMenteeName: c.fromMember.mentee.name,
      toMemberId: c.toMemberId,
      toMenteeName: c.toMember.mentee.name,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    }))
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { circleId } = await params;

  const member = await prisma.circleMember.findFirst({
    where: {
      circleId,
      menteeId: session.user.id,
      status: { in: ["ACCEPTED", "CONFIRMED"] },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PeerCheckInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await createPeerCheckIn(circleId, member.id, parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create check-in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
