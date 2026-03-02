import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const contracts = await prisma.mentorshipContract.findMany({
    where: { menteeUserId: session.user.id },
    orderBy: { engagementStart: "desc" },
    include: {
      mentor: { select: { name: true } },
      sessions: { where: { completedAt: { not: null } }, select: { id: true } },
      milestones: { select: { id: true, status: true } },
      outcome: {
        select: {
          status: true,
          transitionType: true,
          checkInStatus: true,
          checkInDueAt: true,
          checkInCompletedAt: true,
        },
      },
    },
  });

  const list = contracts.map((c) => {
    const mentorFirstName = c.mentor?.name?.split(/\s+/)[0] ?? "Mentor";
    return {
      id: c.id,
      mentorFirstName,
      transitionType: c.outcome?.transitionType ?? null,
      startDate: c.engagementStart?.toISOString() ?? null,
      status: c.status,
      milestonesComplete: c.milestones.filter((m) => m.status === "COMPLETE").length,
      milestonesTotal: c.milestones.length,
      outcomeStatus: c.outcome?.status ?? null,
      checkInStatus: c.outcome?.checkInStatus ?? null,
      checkInDueAt: c.outcome?.checkInDueAt?.toISOString() ?? null,
      checkInCompletedAt: c.outcome?.checkInCompletedAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json(list);
}
