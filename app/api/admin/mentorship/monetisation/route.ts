/**
 * GET /api/admin/mentorship/monetisation
 * PLATFORM_ADMIN only. List mentors with monetisation status.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const unlocked = searchParams.get("unlocked");
  const canCharge = searchParams.get("canCharge");

  const where: Prisma.MentorProfileWhereInput = { isActive: true };
  if (unlocked === "true") {
    where.monetisationStatus = { isUnlocked: true };
  } else if (unlocked === "false") {
    where.OR = [
      { monetisationStatus: { isUnlocked: false } },
      { monetisationStatus: null },
    ];
  }
  if (canCharge === "true") {
    where.canChargeMentees = true;
  } else if (canCharge === "false") {
    where.canChargeMentees = false;
  }

  const [items, total] = await Promise.all([
    prisma.mentorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        monetisationStatus: true,
        seoBoosts: {
          where: { active: true, endDate: { gte: new Date() } },
          select: { id: true, boostType: true, endDate: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: page * limit,
      take: limit,
    }),
    prisma.mentorProfile.count({ where }),
  ]);

  const userIds = items.map((p) => p.userId);
  const subscriptions = await prisma.userSubscription.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, planKey: true, status: true, expiresAt: true },
  });
  const subByUser = new Map(subscriptions.map((s) => [s.userId, s]));

  return NextResponse.json({
    items: items.map((p) => ({
      mentorProfileId: p.id,
      userId: p.userId,
      user: p.user,
      isUnlocked: p.monetisationStatus?.isUnlocked ?? false,
      canChargeMentees: p.canChargeMentees ?? false,
      sessionFeePaise: p.sessionFeePaise,
      verifiedOutcomeCount: p.verifiedOutcomeCount,
      stenoRate: p.stenoRate,
      upheldDisputeCount: p.upheldDisputeCount ?? 0,
      lockedReason: p.monetisationStatus?.lockedReason ?? null,
      lastCheckedAt: p.monetisationStatus?.lastCheckedAt ?? null,
      subscription: subByUser.get(p.userId) ?? null,
      activeSeoBoosts: p.seoBoosts,
    })),
    total,
    page,
    limit,
  });
}
