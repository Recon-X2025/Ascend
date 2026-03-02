-- CreateEnum
CREATE TYPE "MentorCompanyType" AS ENUM ('STARTUP_SEED', 'STARTUP_SERIES_A_B', 'STARTUP_LATE_STAGE', 'MNC', 'INDIAN_LARGE_CORP', 'SME', 'GOVERNMENT_PSU', 'FREELANCE_CONSULTING', 'NGO_NONPROFIT', 'ACADEMIA');

-- CreateEnum
CREATE TYPE "TransitionBadge" AS ENUM ('SELF_REPORTED', 'PLATFORM_VERIFIED');

-- CreateEnum
CREATE TYPE "EngagementLength" AS ENUM ('SPRINT_30', 'STANDARD_60', 'DEEP_90');

-- CreateEnum
CREATE TYPE "SessionFrequency" AS ENUM ('WEEKLY', 'FORTNIGHTLY');

-- CreateEnum
CREATE TYPE "M2FocusArea" AS ENUM ('CAREER_PIVOT', 'FIRST_JOB', 'IC_TO_MANAGEMENT', 'MANAGEMENT_TO_IC', 'DOMAIN_SWITCH', 'GEOGRAPHY_MOVE', 'STARTUP_TO_ENTERPRISE', 'ENTERPRISE_TO_STARTUP', 'SALARY_NEGOTIATION', 'INTERVIEW_PREP', 'PORTFOLIO_BUILDING', 'GRADUATE_SCHOOL', 'ENTREPRENEURSHIP');

-- CreateEnum
CREATE TYPE "GeographyScope" AS ENUM ('INDIA_ONLY', 'INDIA_TO_GLOBAL', 'SPECIFIC_COUNTRIES');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- AlterTable
ALTER TABLE "MentorProfile" ADD COLUMN     "engagementPreference" "EngagementLength"[] DEFAULT ARRAY[]::"EngagementLength"[],
ADD COLUMN     "fromCity" TEXT,
ADD COLUMN     "fromCompanyType" "MentorCompanyType",
ADD COLUMN     "fromIndustry" TEXT,
ADD COLUMN     "fromRole" TEXT,
ADD COLUMN     "geographyCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "geographyScope" "GeographyScope",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keyFactor1" VARCHAR(200),
ADD COLUMN     "keyFactor2" VARCHAR(200),
ADD COLUMN     "keyFactor3" VARCHAR(200),
ADD COLUMN     "m2FocusAreas" "M2FocusArea"[] DEFAULT ARRAY[]::"M2FocusArea"[],
ADD COLUMN     "maxActiveMentees" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "sessionFrequency" "SessionFrequency",
ADD COLUMN     "statementCanHelpWith" VARCHAR(400),
ADD COLUMN     "statementCannotHelpWith" VARCHAR(400),
ADD COLUMN     "statementTransitionMade" VARCHAR(400),
ADD COLUMN     "statementWishIKnew" VARCHAR(400),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
ADD COLUMN     "toCity" TEXT,
ADD COLUMN     "toCompanyType" "MentorCompanyType",
ADD COLUMN     "toIndustry" TEXT,
ADD COLUMN     "toRole" TEXT,
ADD COLUMN     "transitionBadge" "TransitionBadge" NOT NULL DEFAULT 'SELF_REPORTED',
ADD COLUMN     "transitionDurationMonths" INTEGER,
ADD COLUMN     "transitionYear" INTEGER;

-- CreateTable
CREATE TABLE "AvailabilityWindow" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "AvailabilityWindow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
