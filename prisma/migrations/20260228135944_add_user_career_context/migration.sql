-- CreateEnum
CREATE TYPE "ExperienceBand" AS ENUM ('FRESHER', 'EARLY', 'MID', 'SENIOR', 'LEADERSHIP');

-- CreateEnum
CREATE TYPE "CareerEmploymentStatus" AS ENUM ('EMPLOYED_ACTIVE', 'EMPLOYED_LOOKING', 'NOTICE_PERIOD', 'UNEMPLOYED', 'FREELANCE', 'STUDENT', 'SABBATICAL');

-- CreateEnum
CREATE TYPE "CareerNoticePeriod" AS ENUM ('IMMEDIATE', 'TWO_WEEKS', 'ONE_MONTH', 'TWO_MONTHS', 'THREE_MONTHS', 'NEGOTIABLE');

-- CreateEnum
CREATE TYPE "SearchUrgency" AS ENUM ('BROWSING', 'WARMING_UP', 'ACTIVE', 'URGENT');

-- CreateEnum
CREATE TYPE "SearchReason" AS ENUM ('GROWTH', 'COMPENSATION', 'CULTURE', 'LAYOFF', 'RELOCATION', 'CAREER_SWITCH', 'FIRST_JOB', 'RETURNING', 'ENTREPRENEURSHIP', 'CURIOSITY');

-- CreateEnum
CREATE TYPE "PrimaryNeed" AS ENUM ('FIND_JOBS', 'BENCHMARK_SALARY', 'IMPROVE_RESUME', 'FIND_MENTOR', 'BUILD_NETWORK', 'UNDERSTAND_COMPANIES', 'PREPARE_INTERVIEWS');

-- CreateEnum
CREATE TYPE "TargetCompanySizeBand" AS ENUM ('STARTUP', 'SCALEUP', 'MIDSIZE', 'LARGE', 'ENTERPRISE', 'ANY');

-- CreateEnum
CREATE TYPE "TargetGeography" AS ENUM ('INDIA_ONLY', 'INDIA_TO_GLOBAL', 'GLOBAL_ONLY', 'FLEXIBLE');

-- CreateTable
CREATE TABLE "UserCareerContext" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentRole" TEXT,
    "currentCompany" TEXT,
    "currentSalary" INTEGER,
    "yearsOfExperience" INTEGER,
    "experienceBand" "ExperienceBand",
    "targetRole" TEXT,
    "targetIndustry" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetCompanySize" "TargetCompanySizeBand",
    "targetCompanyType" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetSalaryMin" INTEGER,
    "targetLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openToRelocation" BOOLEAN NOT NULL DEFAULT false,
    "openToRemote" BOOLEAN NOT NULL DEFAULT true,
    "employmentStatus" "CareerEmploymentStatus",
    "noticePeriod" "CareerNoticePeriod",
    "urgency" "SearchUrgency",
    "searchReason" "SearchReason",
    "primaryNeed" "PrimaryNeed",
    "secondaryNeeds" "PrimaryNeed"[] DEFAULT ARRAY[]::"PrimaryNeed"[],
    "isFirstJob" BOOLEAN NOT NULL DEFAULT false,
    "isSwitchingField" BOOLEAN NOT NULL DEFAULT false,
    "targetGeography" "TargetGeography",
    "completionScore" INTEGER NOT NULL DEFAULT 0,
    "contextSetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCareerContext_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCareerContext_userId_key" ON "UserCareerContext"("userId");

-- AddForeignKey
ALTER TABLE "UserCareerContext" ADD CONSTRAINT "UserCareerContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
