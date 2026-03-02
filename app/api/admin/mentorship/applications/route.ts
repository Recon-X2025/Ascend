import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

/**
 * GET /api/admin/mentorship/applications
 * PLATFORM_ADMIN only. Returns all mentor applications with matchScore and matchDimensions for ops/debugging.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const applications = await prisma.mentorApplication.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      mentee: { select: { id: true, name: true, email: true } },
      mentorProfile: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const list = applications.map((a) => ({
    id: a.id,
    menteeId: a.menteeId,
    menteeName: a.mentee.name,
    menteeEmail: a.mentee.email,
    mentorProfileId: a.mentorProfileId,
    mentorUserId: a.mentorProfile.userId,
    mentorName: a.mentorProfile.user.name,
    status: a.status,
    submittedAt: a.submittedAt.toISOString(),
    expiresAt: a.expiresAt.toISOString(),
    matchReason: a.matchReason,
    matchScore: a.matchScore,
    matchScoreAtApplication: a.matchScoreAtApplication ?? null,
    matchDimensionsSnapshot: a.matchDimensionsSnapshot ?? null,
  }));

  return NextResponse.json(list);
}
