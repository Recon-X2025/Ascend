import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const daysParam = Math.min(90, Math.max(7, parseInt(searchParams.get("days") ?? "30", 10)));
  const since = subDays(new Date(), daysParam);

  const snapshots = await prisma.investorSnapshot.findMany({
    where: { snapshotDate: { gte: since } },
    orderBy: { snapshotDate: "asc" },
  });

  return NextResponse.json(
    snapshots.map((s) => ({
      snapshotDate: s.snapshotDate.toISOString(),
      totalUsers: s.totalUsers,
      newUsersToday: s.newUsersToday,
      dau: s.dau,
      wau: s.wau,
      mau: s.mau,
      dauMauRatio: s.dauMauRatio,
      mrrInr: s.mrrInr,
      mrrUsd: s.mrrUsd,
      payingUsers: s.payingUsers,
      churnRate: s.churnRate,
      verifiedOutcomes: s.verifiedOutcomes,
      activeEngagements: s.activeEngagements,
      aiInteractionsToday: s.aiInteractionsToday,
      aiInteractions30d: s.aiInteractions30d,
    }))
  );
}
