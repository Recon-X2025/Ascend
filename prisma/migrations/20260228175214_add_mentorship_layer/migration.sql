-- CreateEnum
CREATE TYPE "MentorTransition" AS ENUM ('IC_TO_MANAGER', 'MANAGER_TO_IC', 'STARTUP_TO_LARGE', 'LARGE_TO_STARTUP', 'INDIA_TO_GLOBAL', 'DOMAIN_SWITCH', 'INDUSTRY_SWITCH', 'FIRST_JOB', 'LEVEL_UP', 'RETURN_TO_WORK');

-- CreateEnum
CREATE TYPE "MentorStyle" AS ENUM ('STRUCTURED', 'ASYNC', 'AD_HOC');

-- CreateEnum
CREATE TYPE "SessionFormat" AS ENUM ('VIDEO_CALL', 'VOICE_CALL', 'ASYNC_CHAT', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'DECLINED');

-- CreateEnum
CREATE TYPE "MentorFocusArea" AS ENUM ('RESUME_REVIEW', 'INTERVIEW_PREP', 'CAREER_PLANNING', 'SALARY_NEGOTIATION', 'LEADERSHIP', 'TECHNICAL_GROWTH', 'WORK_LIFE_BALANCE', 'NETWORKING', 'ENTREPRENEURSHIP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_SESSION_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_SESSION_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_SESSION_DECLINED';
ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_SESSION_COMPLETED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SignalType" ADD VALUE 'MENTOR_PROFILE_CREATED';
ALTER TYPE "SignalType" ADD VALUE 'MENTOR_SESSION_COMPLETED';

-- CreateTable
CREATE TABLE "MentorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxMenteesPerMonth" INTEGER NOT NULL DEFAULT 3,
    "currentMenteeCount" INTEGER NOT NULL DEFAULT 0,
    "currentRole" TEXT NOT NULL,
    "currentCompany" TEXT,
    "previousRole" TEXT,
    "transitionType" "MentorTransition",
    "yearsOfExperience" INTEGER NOT NULL,
    "currentCity" TEXT,
    "previousCity" TEXT,
    "crossBorderExperience" BOOLEAN NOT NULL DEFAULT false,
    "countriesWorkedIn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mentoringStyles" "MentorStyle"[] DEFAULT ARRAY[]::"MentorStyle"[],
    "sessionFormats" "SessionFormat"[] DEFAULT ARRAY[]::"SessionFormat"[],
    "languages" TEXT[] DEFAULT ARRAY['English']::TEXT[],
    "focusAreas" "MentorFocusArea"[] DEFAULT ARRAY[]::"MentorFocusArea"[],
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalMentees" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "featuredTestimonial" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorAvailability" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',

    CONSTRAINT "MentorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorSession" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'REQUESTED',
    "sessionGoal" TEXT NOT NULL,
    "sessionFormat" "SessionFormat" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "meetingLink" TEXT,
    "menteeRating" INTEGER,
    "menteeFeedback" TEXT,
    "mentorNotes" TEXT,
    "outcomeAchieved" BOOLEAN,
    "careerSignalFired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_userId_key" ON "MentorProfile"("userId");

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAvailability" ADD CONSTRAINT "MentorAvailability_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSession" ADD CONSTRAINT "MentorSession_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSession" ADD CONSTRAINT "MentorSession_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
