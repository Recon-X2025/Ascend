import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { startOfDay, subDays } from "date-fns";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const yesterday = subDays(now, 1);
  const snapshotDate = startOfDay(yesterday);
  const nextDay = startOfDay(now);

  const weekStart = subDays(snapshotDate, 6);
  const monthStart = subDays(snapshotDate, 29);

  const [
    totalUsers,
    newUsersToday,
    usersByPersona,
    noPersonaCount,
    personaCompletedToday,
    contextCompletedToday,
    firstJobViewToday,
    firstApplicationToday,
    fitScoresRunToday,
    resumeOptimisationsToday,
    resumeBuildsToday,
    mentorSessionsRequested,
    mentorSessionsCompleted,
    activeJobPostings,
    applicationsToday,
    jobsIndexedTotal,
    activeTodayGroups,
    activeWeekGroups,
    activeMonthGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: snapshotDate, lt: nextDay } } }),
    prisma.user.groupBy({ by: ["persona"], where: { persona: { not: null } }, _count: true }),
    prisma.user.count({ where: { persona: null } }),
    prisma.analyticsEvent.count({ where: { event: "persona_selected", createdAt: { gte: snapshotDate, lt: nextDay } } }),
    prisma.analyticsEvent.count({ where: { event: "context_completed", createdAt: { gte: snapshotDate, lt: nextDay } } }),
    prisma.analyticsEvent.count({ where: { event: "job_viewed", createdAt: { gte: snapshotDate, lt: nextDay } } }),
    prisma.analyticsEvent.count({ where: { event: "job_applied", createdAt: { gte: snapshotDate, lt: nextDay } } }),
    prisma.analyticsEvent.count({ where: { event: "fit_score_viewed", createdAt: { gte: snapshotDate, lt: nextDay } } }),
    prisma.analyticsEvent.count({ where: { event: "resume_optimised", createdAt: { gte: snapshotDate, lt: nextDay } } }),
    prisma.analyticsEvent.count({ where: { event: "resume_built", createdAt: { gte: snapshotDate, lt: nextDay } } }),
    prisma.mentorSession.count({ where: { createdAt: { gte: snapshotDate, lt: nextDay }, status: "REQUESTED" } }),
    prisma.mentorSession.count({ where: { updatedAt: { gte: snapshotDate, lt: nextDay }, status: "COMPLETED" } }),
    prisma.jobPost.count({ where: { status: "ACTIVE" } }),
    prisma.jobApplication.count({ where: { submittedAt: { gte: snapshotDate, lt: nextDay } } }),
    prisma.parsedJD.count(),
    prisma.analyticsEvent.groupBy({ by: ["userId"], where: { userId: { not: null }, createdAt: { gte: snapshotDate, lt: nextDay } } }),
    prisma.analyticsEvent.groupBy({ by: ["userId"], where: { userId: { not: null }, createdAt: { gte: weekStart, lt: nextDay } } }),
    prisma.analyticsEvent.groupBy({ by: ["userId"], where: { userId: { not: null }, createdAt: { gte: monthStart, lt: nextDay } } }),
  ]);

  const personaMap: Record<string, number> = { ACTIVE_SEEKER: 0, PASSIVE_SEEKER: 0, EARLY_CAREER: 0, RECRUITER: 0 };
  for (const g of usersByPersona) {
    if (g.persona) personaMap[g.persona] = g._count;
  }

  const activeUsersToday = activeTodayGroups.length;
  const activeUsersWeek = activeWeekGroups.length;
  const activeUsersMonth = activeMonthGroups.length;

  await prisma.dailyMetricSnapshot.upsert({
    where: { date: snapshotDate },
    create: {
      date: snapshotDate,
      totalUsers,
      newUsersToday,
      activeUsersToday,
      activeUsersWeek,
      activeUsersMonth,
      activeSeekersCount: personaMap.ACTIVE_SEEKER ?? 0,
      passiveSeekersCount: personaMap.PASSIVE_SEEKER ?? 0,
      earlyCareerCount: personaMap.EARLY_CAREER ?? 0,
      recruiterCount: personaMap.RECRUITER ?? 0,
      noPersonaCount,
      registrationsToday: newUsersToday,
      personaCompletedToday,
      contextCompletedToday,
      firstJobViewToday,
      firstApplicationToday,
      fitScoresRunToday,
      resumeOptimisationsToday,
      resumeBuildsToday,
      mentorSessionsRequested,
      mentorSessionsCompleted,
      activeJobPostings,
      applicationsToday,
      jobsIndexedTotal,
    },
    update: {
      totalUsers,
      newUsersToday,
      activeUsersToday,
      activeUsersWeek,
      activeUsersMonth,
      activeSeekersCount: personaMap.ACTIVE_SEEKER ?? 0,
      passiveSeekersCount: personaMap.PASSIVE_SEEKER ?? 0,
      earlyCareerCount: personaMap.EARLY_CAREER ?? 0,
      recruiterCount: personaMap.RECRUITER ?? 0,
      noPersonaCount,
      registrationsToday: newUsersToday,
      personaCompletedToday,
      contextCompletedToday,
      firstJobViewToday,
      firstApplicationToday,
      fitScoresRunToday,
      resumeOptimisationsToday,
      resumeBuildsToday,
      mentorSessionsRequested,
      mentorSessionsCompleted,
      activeJobPostings,
      applicationsToday,
      jobsIndexedTotal,
    },
  });

  return NextResponse.json({ success: true, date: snapshotDate.toISOString() });
}
