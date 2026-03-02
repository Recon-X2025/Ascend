import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getQueueHealth } from "@/lib/queues/status";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersLast7,
    newUsersLast30,
    totalOutcomeEvents,
    aiAdoption,
    queueHealth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.outcomeEvent.count(),
    prisma.aIInteraction.groupBy({
      by: ["feature"],
      _count: { id: true },
    }),
    getQueueHealth(),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        newLast7Days: newUsersLast7,
        newLast30Days: newUsersLast30,
      },
      outcomes: {
        totalEvents: totalOutcomeEvents,
        byFeature: aiAdoption,
      },
      queues: queueHealth,
    },
  });
}
