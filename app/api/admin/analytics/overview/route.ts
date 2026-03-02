import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays, startOfDay } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const end = startOfDay(new Date());
  const start = subDays(end, 30);

  const [snapshots, latest] = await Promise.all([
    prisma.dailyMetricSnapshot.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
    prisma.dailyMetricSnapshot.findFirst({ orderBy: { date: "desc" } }),
  ]);

  return NextResponse.json({
    snapshots: snapshots.map((s) => ({
      date: s.date.toISOString().slice(0, 10),
      totalUsers: s.totalUsers,
      newUsersToday: s.newUsersToday,
      activeUsersToday: s.activeUsersToday,
      activeUsersWeek: s.activeUsersWeek,
      activeUsersMonth: s.activeUsersMonth,
      activeSeekersCount: s.activeSeekersCount,
      passiveSeekersCount: s.passiveSeekersCount,
      earlyCareerCount: s.earlyCareerCount,
      recruiterCount: s.recruiterCount,
      noPersonaCount: s.noPersonaCount,
      registrationsToday: s.registrationsToday,
      personaCompletedToday: s.personaCompletedToday,
      contextCompletedToday: s.contextCompletedToday,
      firstJobViewToday: s.firstJobViewToday,
      firstApplicationToday: s.firstApplicationToday,
      fitScoresRunToday: s.fitScoresRunToday,
      resumeOptimisationsToday: s.resumeOptimisationsToday,
      resumeBuildsToday: s.resumeBuildsToday,
      mentorSessionsRequested: s.mentorSessionsRequested,
      mentorSessionsCompleted: s.mentorSessionsCompleted,
      activeJobPostings: s.activeJobPostings,
      applicationsToday: s.applicationsToday,
      jobsIndexedTotal: s.jobsIndexedTotal,
    })),
    latest,
  });
}
