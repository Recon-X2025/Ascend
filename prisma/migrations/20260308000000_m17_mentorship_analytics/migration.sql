-- CreateTable
CREATE TABLE "MentorshipAnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "activeEngagements" INTEGER NOT NULL,
    "newEngagementsThisWeek" INTEGER NOT NULL,
    "completedEngagementsTotal" INTEGER NOT NULL,
    "stalledEngagements" INTEGER NOT NULL,
    "averageEngagementDays" DOUBLE PRECISION NOT NULL,
    "outcomesSubmittedTotal" INTEGER NOT NULL,
    "outcomesVerifiedTotal" INTEGER NOT NULL,
    "outcomesDisputedTotal" INTEGER NOT NULL,
    "outcomeVerificationRate" DOUBLE PRECISION NOT NULL,
    "avgTimeToOutcomeDays" DOUBLE PRECISION NOT NULL,
    "sixMonthCheckinRate" DOUBLE PRECISION NOT NULL,
    "totalMentors" INTEGER NOT NULL,
    "verifiedMentors" INTEGER NOT NULL,
    "activeMentors" INTEGER NOT NULL,
    "mentorsByTier" JSONB NOT NULL,
    "avgDisputeRate" DOUBLE PRECISION NOT NULL,
    "highDisputeRateMentors" INTEGER NOT NULL,
    "sessionsCompletedTotal" INTEGER NOT NULL,
    "sessionsCompletedThisWeek" INTEGER NOT NULL,
    "avgSessionsPerEngagement" DOUBLE PRECISION NOT NULL,
    "milestonesCompletedRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorshipAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorAnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "applicationsReceived" INTEGER NOT NULL,
    "applicationsAccepted" INTEGER NOT NULL,
    "applicationsDeclined" INTEGER NOT NULL,
    "acceptanceRate" DOUBLE PRECISION NOT NULL,
    "engagementsActive" INTEGER NOT NULL,
    "engagementsCompleted" INTEGER NOT NULL,
    "engagementsTotal" INTEGER NOT NULL,
    "completionRate" DOUBLE PRECISION NOT NULL,
    "outcomesSubmitted" INTEGER NOT NULL,
    "outcomesVerified" INTEGER NOT NULL,
    "outcomesDisputed" INTEGER NOT NULL,
    "outcomeRate" DOUBLE PRECISION NOT NULL,
    "sessionsCompleted" INTEGER NOT NULL,
    "avgSessionsPerEngagement" DOUBLE PRECISION NOT NULL,
    "currentTier" TEXT NOT NULL,
    "verifiedOutcomeCount" INTEGER NOT NULL,
    "disputeRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorshipAnalyticsSnapshot_snapshotDate_key" ON "MentorshipAnalyticsSnapshot"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "MentorAnalyticsSnapshot_mentorId_snapshotDate_key" ON "MentorAnalyticsSnapshot"("mentorId", "snapshotDate");

-- CreateIndex
CREATE INDEX "MentorAnalyticsSnapshot_mentorId_idx" ON "MentorAnalyticsSnapshot"("mentorId");

-- CreateIndex
CREATE INDEX "MentorAnalyticsSnapshot_snapshotDate_idx" ON "MentorAnalyticsSnapshot"("snapshotDate");

-- AddForeignKey
ALTER TABLE "MentorAnalyticsSnapshot" ADD CONSTRAINT "MentorAnalyticsSnapshot_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
