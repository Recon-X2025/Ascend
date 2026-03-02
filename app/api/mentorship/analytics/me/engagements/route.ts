import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  filter: z.enum(["active", "completed", "all"]).optional().default("all"),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Not a mentor" }, { status: 403 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { filter } = parsed.data;
  const where: Prisma.MentorshipContractWhereInput = { mentorUserId: session.user.id };
  if (filter === "active") where.status = { in: ["ACTIVE", "PAUSED"] };
  else if (filter === "completed") where.status = "COMPLETED";

  const contracts = await prisma.mentorshipContract.findMany({
    where,
    orderBy: { engagementStart: "desc" },
    include: {
      mentee: {
        select: { id: true, name: true },
      },
      sessions: { where: { completedAt: { not: null } }, select: { id: true } },
      milestones: { select: { id: true, status: true } },
      outcome: { select: { id: true, status: true } },
    },
  });

  const list = contracts.map((c) => {
    const firstName = c.mentee?.name?.split(/\s+/)[0] ?? "Mentee";
    return {
      id: c.id,
      menteeFirstName: firstName,
      type: c.engagementType,
      startDate: c.engagementStart?.toISOString() ?? null,
      status: c.status,
      sessionsCount: c.sessions.length,
      milestonesTotal: c.milestones.length,
      milestonesComplete: c.milestones.filter((m: { status: string }) => m.status === "COMPLETE").length,
      outcomeStatus: c.outcome?.status ?? null,
    };
  });

  return NextResponse.json(list);
}
