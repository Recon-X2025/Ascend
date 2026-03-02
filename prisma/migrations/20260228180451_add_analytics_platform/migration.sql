-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "event" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "persona" "UserPersona",
    "page" TEXT,
    "referrer" TEXT,
    "deviceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMetricSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "newUsersToday" INTEGER NOT NULL DEFAULT 0,
    "activeUsersToday" INTEGER NOT NULL DEFAULT 0,
    "activeUsersWeek" INTEGER NOT NULL DEFAULT 0,
    "activeUsersMonth" INTEGER NOT NULL DEFAULT 0,
    "activeSeekersCount" INTEGER NOT NULL DEFAULT 0,
    "passiveSeekersCount" INTEGER NOT NULL DEFAULT 0,
    "earlyCareerCount" INTEGER NOT NULL DEFAULT 0,
    "recruiterCount" INTEGER NOT NULL DEFAULT 0,
    "noPersonaCount" INTEGER NOT NULL DEFAULT 0,
    "registrationsToday" INTEGER NOT NULL DEFAULT 0,
    "personaCompletedToday" INTEGER NOT NULL DEFAULT 0,
    "contextCompletedToday" INTEGER NOT NULL DEFAULT 0,
    "firstJobViewToday" INTEGER NOT NULL DEFAULT 0,
    "firstApplicationToday" INTEGER NOT NULL DEFAULT 0,
    "fitScoresRunToday" INTEGER NOT NULL DEFAULT 0,
    "resumeOptimisationsToday" INTEGER NOT NULL DEFAULT 0,
    "resumeBuildsToday" INTEGER NOT NULL DEFAULT 0,
    "mentorSessionsRequested" INTEGER NOT NULL DEFAULT 0,
    "mentorSessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "activeJobPostings" INTEGER NOT NULL DEFAULT 0,
    "applicationsToday" INTEGER NOT NULL DEFAULT 0,
    "jobsIndexedTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_event_createdAt_idx" ON "AnalyticsEvent"("event", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_persona_createdAt_idx" ON "AnalyticsEvent"("persona", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetricSnapshot_date_key" ON "DailyMetricSnapshot"("date");
