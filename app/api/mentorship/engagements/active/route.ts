import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

/**
 * GET /api/mentorship/engagements/active
 * Returns the current user's active engagement summary (one ACTIVE contract), or null.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contract = await prisma.mentorshipContract.findFirst({
    where: {
      status: "ACTIVE",
      OR: [
        { mentorUserId: session.user.id },
        { menteeUserId: session.user.id },
      ],
    },
    include: {
      sessions: { where: { status: "SCHEDULED" }, orderBy: { scheduledAt: "asc" }, take: 1 },
      milestones: { where: { status: { not: "COMPLETE" } }, orderBy: { dueDate: "asc" }, take: 1 },
    },
  });

  if (!contract) {
    return NextResponse.json({ engagement: null });
  }

  const nextSession = contract.sessions[0];
  const nextMilestone = contract.milestones[0];

  return NextResponse.json({
    engagement: {
      contractId: contract.id,
      engagementType: contract.engagementType,
      engagementStart: contract.engagementStart?.toISOString() ?? null,
      engagementEnd: contract.engagementEnd?.toISOString() ?? null,
      nextSession: nextSession
        ? {
            sessionNumber: nextSession.sessionNumber,
            scheduledAt: nextSession.scheduledAt?.toISOString() ?? null,
          }
        : null,
      nextMilestone: nextMilestone
        ? {
            type: nextMilestone.type,
            dueDate: nextMilestone.dueDate.toISOString(),
          }
        : null,
    },
  });
}
