/**
 * Seed 30 days of DailyMetricSnapshot for analytics dashboard testing.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-analytics.ts
 * Or: npx ts-node scripts/seed-analytics.ts (if tsconfig allows)
 */
import { PrismaClient } from "@prisma/client";
import { startOfDay, subDays } from "date-fns";

const prisma = new PrismaClient();

const PERSONA_SPLIT = { ACTIVE_SEEKER: 0.45, PASSIVE_SEEKER: 0.25, EARLY_CAREER: 0.2, RECRUITER: 0.1 };
const FUNNEL = { persona: 0.95, context: 0.8, jobView: 0.7, application: 0.4 };

function round(n: number) {
  return Math.round(n);
}

async function main() {
  const today = startOfDay(new Date());
  for (let i = 29; i >= 0; i--) {
    const date = startOfDay(subDays(today, i));
    const dayIndex = 30 - i;
    const registrations = Math.min(40, Math.max(5, 5 + dayIndex * 1.2 + Math.random() * 5));
    const totalUsers = 200 + dayIndex * 25 + round(Math.random() * 20);
    const activeToday = round(registrations * 2 + Math.random() * 15);
    const activeWeek = round(totalUsers * 0.15 + Math.random() * 20);
    const activeMonth = round(totalUsers * 0.35 + Math.random() * 30);

    const personaCompleted = round(registrations * FUNNEL.persona);
    const contextCompleted = round(personaCompleted * FUNNEL.context);
    const firstJobView = round(contextCompleted * FUNNEL.jobView);
    const firstApplication = round(firstJobView * FUNNEL.application);

    const activeSeekers = round(totalUsers * PERSONA_SPLIT.ACTIVE_SEEKER);
    const passiveSeekers = round(totalUsers * PERSONA_SPLIT.PASSIVE_SEEKER);
    const earlyCareer = round(totalUsers * PERSONA_SPLIT.EARLY_CAREER);
    const recruiters = round(totalUsers * PERSONA_SPLIT.RECRUITER);
    const noPersona = Math.max(0, totalUsers - activeSeekers - passiveSeekers - earlyCareer - recruiters);

    const fitScores = round(activeToday * 1.5 + Math.random() * 10);
    const resumeOpt = round(activeToday * 0.8 + Math.random() * 5);
    const resumeBuild = round(activeToday * 0.3 + Math.random() * 3);
    const mentorReq = round(Math.random() * 3);
    const mentorDone = round(mentorReq * 0.6);

    await prisma.dailyMetricSnapshot.upsert({
      where: { date },
      create: {
        date,
        totalUsers,
        newUsersToday: registrations,
        activeUsersToday: activeToday,
        activeUsersWeek: activeWeek,
        activeUsersMonth: activeMonth,
        activeSeekersCount: activeSeekers,
        passiveSeekersCount: passiveSeekers,
        earlyCareerCount: earlyCareer,
        recruiterCount: recruiters,
        noPersonaCount: noPersona,
        registrationsToday: registrations,
        personaCompletedToday: personaCompleted,
        contextCompletedToday: contextCompleted,
        firstJobViewToday: firstJobView,
        firstApplicationToday: firstApplication,
        fitScoresRunToday: fitScores,
        resumeOptimisationsToday: resumeOpt,
        resumeBuildsToday: resumeBuild,
        mentorSessionsRequested: mentorReq,
        mentorSessionsCompleted: mentorDone,
        activeJobPostings: 80 + dayIndex * 2,
        applicationsToday: firstApplication,
        jobsIndexedTotal: 500 + dayIndex * 15,
      },
      update: {
        totalUsers,
        newUsersToday: registrations,
        activeUsersToday: activeToday,
        activeUsersWeek: activeWeek,
        activeUsersMonth: activeMonth,
        activeSeekersCount: activeSeekers,
        passiveSeekersCount: passiveSeekers,
        earlyCareerCount: earlyCareer,
        recruiterCount: recruiters,
        noPersonaCount: noPersona,
        registrationsToday: registrations,
        personaCompletedToday: personaCompleted,
        contextCompletedToday: contextCompleted,
        firstJobViewToday: firstJobView,
        firstApplicationToday: firstApplication,
        fitScoresRunToday: fitScores,
        resumeOptimisationsToday: resumeOpt,
        resumeBuildsToday: resumeBuild,
        mentorSessionsRequested: mentorReq,
        mentorSessionsCompleted: mentorDone,
        activeJobPostings: 80 + dayIndex * 2,
        applicationsToday: firstApplication,
        jobsIndexedTotal: 500 + dayIndex * 15,
      },
    });
  }
  console.log("Seeded 30 days of DailyMetricSnapshot.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
