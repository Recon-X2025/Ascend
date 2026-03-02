import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const userSubs = await prisma.userSubscription.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const summaryMap = new Map<string, number>();
  for (const s of userSubs) {
    const key = s.planKey ?? s.plan;
    summaryMap.set(key, (summaryMap.get(key) ?? 0) + 1);
  }
  const summary = Array.from(summaryMap.entries()).map(([plan, count]) => ({ plan, count }));

  return NextResponse.json({
    subscriptions: userSubs,
    summary,
  });
}
