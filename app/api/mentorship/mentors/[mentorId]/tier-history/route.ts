import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

/**
 * GET /api/mentorship/mentors/[mentorId]/tier-history — Mentor (self) or PLATFORM_ADMIN. mentorId = MentorProfile.id.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mentorId } = await params;

  const profile = await prisma.mentorProfile.findFirst({
    where: { id: mentorId },
    select: { userId: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  const isAdmin = (session.user as { role?: string }).role === "PLATFORM_ADMIN";
  if (profile.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const history = await prisma.mentorTierHistory.findMany({
    where: { mentorId: profile.userId },
    orderBy: { createdAt: "desc" },
    select: {
      previousTier: true,
      newTier: true,
      reason: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    history: history.map((h) => ({
      previousTier: h.previousTier,
      newTier: h.newTier,
      reason: h.reason,
      createdAt: h.createdAt.toISOString(),
    })),
  });
}
