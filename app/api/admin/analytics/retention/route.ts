import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { startOfWeek, subWeeks } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const cohorts: { week: string; registered: number; returnWeek1: number; returnWeek2: number; returnWeek4: number }[] = [];

  for (let w = 0; w < 12; w++) {
    const cohortStart = startOfWeek(subWeeks(now, w + 1), { weekStartsOn: 1 });
    const cohortEnd = startOfWeek(subWeeks(now, w), { weekStartsOn: 1 });

    const registered = await prisma.analyticsEvent.findMany({
      where: { event: "user_registered", createdAt: { gte: cohortStart, lt: cohortEnd } },
      select: { userId: true },
      distinct: ["userId"],
    });
    const userIds = registered.map((r) => r.userId).filter(Boolean) as string[];
    if (userIds.length === 0) {
      cohorts.push({ week: cohortStart.toISOString().slice(0, 10), registered: 0, returnWeek1: 0, returnWeek2: 0, returnWeek4: 0 });
      continue;
    }

    const week1End = startOfWeek(subWeeks(now, w - 1), { weekStartsOn: 1 });
    const week2End = startOfWeek(subWeeks(now, w - 2), { weekStartsOn: 1 });
    const week4End = startOfWeek(subWeeks(now, w - 4), { weekStartsOn: 1 });

    const [returnWeek1, returnWeek2, returnWeek4] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: {
          userId: { in: userIds },
          createdAt: { gte: cohortEnd, lt: week1End },
        },
        select: { userId: true },
        distinct: ["userId"],
      }).then((r) => r.length),
      prisma.analyticsEvent.findMany({
        where: {
          userId: { in: userIds },
          createdAt: { gte: cohortEnd, lt: week2End },
        },
        select: { userId: true },
        distinct: ["userId"],
      }).then((r) => r.length),
      prisma.analyticsEvent.findMany({
        where: {
          userId: { in: userIds },
          createdAt: { gte: cohortEnd, lt: week4End },
        },
        select: { userId: true },
        distinct: ["userId"],
      }).then((r) => r.length),
    ]);

    cohorts.push({
      week: cohortStart.toISOString().slice(0, 10),
      registered: userIds.length,
      returnWeek1,
      returnWeek2,
      returnWeek4,
    });
  }

  return NextResponse.json({
    cohorts: cohorts.map((c) => ({
      ...c,
      returnRate1: c.registered > 0 ? Math.round((c.returnWeek1 / c.registered) * 1000) / 10 : 0,
      returnRate2: c.registered > 0 ? Math.round((c.returnWeek2 / c.registered) * 1000) / 10 : 0,
      returnRate4: c.registered > 0 ? Math.round((c.returnWeek4 / c.registered) * 1000) / 10 : 0,
    })),
  });
}
