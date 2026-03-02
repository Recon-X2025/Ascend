import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { MentorTier } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const TIER_VALUES: MentorTier[] = ["RISING", "ESTABLISHED", "ELITE"];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const tierParam = searchParams.get("tier");
  const tierFilter = TIER_VALUES.includes(tierParam as MentorTier) ? (tierParam as MentorTier) : null;
  const overrideFilter = searchParams.get("override"); // "true" | "false" | ""
  const highDispute = searchParams.get("highDispute"); // "true" when >25%

  const where: Prisma.MentorProfileWhereInput = { isActive: true };
  if (tierFilter) {
    where.tier = tierFilter;
  }
  if (overrideFilter === "true") where.tierOverriddenByAdmin = true;
  if (overrideFilter === "false") where.tierOverriddenByAdmin = false;
  if (highDispute === "true") where.disputeRate = { gt: 0.25 };

  const mentors = await prisma.mentorProfile.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ tier: "desc" }, { verifiedOutcomeCount: "desc" }],
    take: 200,
  });

  const mentorIds = mentors.map((m) => m.userId);
  const activeCounts = await Promise.all(
    mentorIds.map((userId) =>
      prisma.mentorshipContract.count({ where: { mentorUserId: userId, status: "ACTIVE" } })
    )
  );

  const list = mentors.map((m, i) => ({
    id: m.id,
    userId: m.userId,
    name: m.user.name ?? null,
    email: m.user.email ?? null,
    tier: m.tier ?? "RISING",
    verifiedOutcomeCount: m.verifiedOutcomeCount ?? 0,
    disputeRate: m.disputeRate ?? 0,
    activeMenteeCount: activeCounts[i],
    maxActiveMentees: m.maxActiveMentees ?? 2,
    tierOverriddenByAdmin: m.tierOverriddenByAdmin ?? false,
    tierUpdatedAt: m.tierUpdatedAt?.toISOString() ?? null,
  }));

  let lastCronRun: string | null = null;
  const cronLog = await prisma.auditLog.findFirst({
    where: { action: "CRON_RECALCULATE_MENTOR_TIERS" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, metadata: true },
  });
  if (cronLog) {
    lastCronRun = cronLog.createdAt.toISOString();
  }

  return NextResponse.json({
    mentors: list,
    lastCronRun,
    cronSummary: cronLog?.metadata as { mentorsProcessed?: number; tiersChanged?: number; promotions?: number; demotions?: number } | null,
  });
}
