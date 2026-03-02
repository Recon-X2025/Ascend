import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.marketplaceProvider.findUnique({
    where: { userId },
  });
  if (!provider) return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });

  const [rr, mock, coaching] = await Promise.all([
    prisma.resumeReviewOrder.aggregate({
      where: { providerId: provider.id, status: "DELIVERED" },
      _sum: { providerPayout: true },
      _count: true,
    }),
    prisma.mockInterviewBooking.aggregate({
      where: { providerId: provider.id, status: "DELIVERED" },
      _sum: { providerPayout: true },
      _count: true,
    }),
    prisma.coachingSession.aggregate({
      where: { providerId: provider.id, status: "DELIVERED" },
      _sum: { providerPayout: true },
      _count: true,
    }),
  ]);

  const totalEarned = (rr._sum.providerPayout ?? 0) + (mock._sum.providerPayout ?? 0) + (coaching._sum.providerPayout ?? 0);
  const ordersCompleted = (rr._count ?? 0) + (mock._count ?? 0) + (coaching._count ?? 0);

  return NextResponse.json({
    totalEarned,
    pendingPayout: 0,
    completedPayout: totalEarned,
    currency: provider.currency,
    ordersCompleted,
  });
}
