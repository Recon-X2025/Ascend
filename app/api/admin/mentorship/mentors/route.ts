import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const tier = searchParams.get("tier") || undefined;
  const verificationStatus = searchParams.get("verificationStatus") || undefined;
  const flagged = searchParams.get("flagged") === "true";
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where: Record<string, unknown> = {};
  if (tier) where.tier = tier;
  if (verificationStatus) where.verificationStatus = verificationStatus;
  if (flagged) {
    where.OR = [
      { disputeRate: { gt: 0.25 } },
      {
        verificationStatus: "REVERIFICATION_REQUIRED",
        updatedAt: { lt: subDays(new Date(), 30) },
      },
    ];
  }

  const mentors = await prisma.mentorProfile.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      verification: { select: { id: true, status: true, verifiedAt: true } },
    },
    orderBy: [{ disputeRate: "desc" }, { verifiedOutcomeCount: "desc" }, { tierUpdatedAt: "desc" }],
    skip: page * limit,
    take: limit + 1,
  });

  const reverify30d = subDays(new Date(), 30);
  const items = mentors.slice(0, limit).map((m) => {
    const highDisputeRate = (m.disputeRate ?? 0) > 0.25;
    const lapsedReverification =
      m.verificationStatus === "REVERIFICATION_REQUIRED" && m.updatedAt < reverify30d;
    const stalledEngagement = false; // would require joining contracts — optional
    const anyFlag = highDisputeRate || lapsedReverification || stalledEngagement;

    return {
      id: m.id,
      userId: m.userId,
      name: m.user?.name ?? m.user?.email ?? m.userId,
      tier: m.tier,
      verifiedOutcomes: m.verifiedOutcomeCount,
      disputeRate: m.disputeRate,
      activeMentees: m.activeMenteeCount,
      verificationStatus: m.verificationStatus,
      lastVerifiedAt: m.verification?.verifiedAt ?? m.verifiedAt ?? null,
      flags: {
        highDisputeRate,
        lapsedReverification,
        stalledEngagement,
        flagged: anyFlag,
      },
    };
  });

  const total = await prisma.mentorProfile.count({ where });

  return NextResponse.json({
    items,
    total,
    page,
    limit,
  });
}
