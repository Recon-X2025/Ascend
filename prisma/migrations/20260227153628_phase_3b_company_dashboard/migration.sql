/*
  Warnings:

  - You are about to drop the column `company` on the `JobPost` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `JobPost` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `JobSeekerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `yearsOfExperience` on the `JobSeekerProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `JobPost` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `JobSeekerProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `JobPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recruiterId` to the `JobPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `JobPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `JobPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `JobPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `JobPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workMode` to the `JobPost` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NoticePeriod" AS ENUM ('IMMEDIATE', 'FIFTEEN_DAYS', 'THIRTY_DAYS', 'SIXTY_DAYS', 'NINETY_DAYS', 'MORE_THAN_NINETY');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'CONNECTIONS_ONLY', 'RECRUITERS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "OpenToWorkVisibility" AS ENUM ('ALL', 'RECRUITERS_ONLY');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('ANY', 'HIGH_SCHOOL', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'PHD');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ScreeningQuestionType" AS ENUM ('TEXT', 'YES_NO', 'MULTIPLE_CHOICE');

-- CreateEnum
CREATE TYPE "LanguageProficiency" AS ENUM ('ELEMENTARY', 'CONVERSATIONAL', 'PROFESSIONAL', 'NATIVE');

-- CreateEnum
CREATE TYPE "SkillProficiency" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'EXPERT');

-- CreateEnum
CREATE TYPE "ResumeVisibility" AS ENUM ('PUBLIC', 'RECRUITERS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "OutcomeEventType" AS ENUM ('RESUME_CREATED', 'RESUME_DOWNLOADED', 'RESUME_USED_IN_APPLICATION', 'FIT_SCORE_CALCULATED', 'FIT_SCORE_IMPROVED', 'JOB_SAVED_AFTER_SCORING', 'APPLIED_AFTER_SCORING', 'OPTIMISER_OPENED', 'OPTIMISER_DIFF_ACCEPTED', 'OPTIMISER_DIFF_REJECTED', 'OPTIMISER_RESUME_CREATED', 'APPLIED_WITH_OPTIMISED_RESUME', 'INTERVIEW_PREP_USED', 'INTERVIEW_PREP_RATED', 'CAREER_INSIGHT_VIEWED', 'SKILL_ADDED_AFTER_GAP_ANALYSIS', 'APPLICATION_SUBMITTED', 'APPLICATION_VIEWED_BY_RECRUITER', 'APPLICATION_SHORTLISTED', 'APPLICATION_REJECTED', 'APPLICATION_OFFERED', 'PROFILE_SCORE_IMPROVED');

-- CreateEnum
CREATE TYPE "AIFeature" AS ENUM ('RESUME_BUILDER', 'FIT_SCORER', 'JD_OPTIMISER', 'INTERVIEW_PREP', 'CAREER_INTELLIGENCE', 'SKILL_GAP_ANALYSER', 'SALARY_PREDICTOR', 'COVER_LETTER', 'PROFILE_OPTIMISER');

-- DropIndex
DROP INDEX "SalaryReport_companyId_idx";

-- AlterTable
ALTER TABLE "CompanyQA" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "InterviewReview" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "JobPost" DROP COLUMN "company",
DROP COLUMN "role",
ADD COLUMN     "applicationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "applicationUrl" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "easyApply" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "educationLevel" "EducationLevel" NOT NULL DEFAULT 'ANY',
ADD COLUMN     "experienceMax" INTEGER,
ADD COLUMN     "experienceMin" INTEGER,
ADD COLUMN     "locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "openings" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "recruiterId" TEXT NOT NULL,
ADD COLUMN     "salaryCurrency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "salaryMax" INTEGER,
ADD COLUMN     "salaryMin" INTEGER,
ADD COLUMN     "salaryVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" "JobType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workMode" "WorkMode" NOT NULL;

-- AlterTable
ALTER TABLE "JobSeekerProfile" DROP COLUMN "location",
DROP COLUMN "yearsOfExperience",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "ctcCurrency" TEXT DEFAULT 'INR',
ADD COLUMN     "currentCTC" DOUBLE PRECISION,
ADD COLUMN     "currentCompany" TEXT,
ADD COLUMN     "currentRole" TEXT,
ADD COLUMN     "defaultResumeVisibility" "ResumeVisibility" NOT NULL DEFAULT 'RECRUITERS_ONLY',
ADD COLUMN     "expectedCTC" DOUBLE PRECISION,
ADD COLUMN     "hideFromCompanies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "noticePeriod" "NoticePeriod",
ADD COLUMN     "openToWork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openToWorkVisibility" "OpenToWorkVisibility" NOT NULL DEFAULT 'RECRUITERS_ONLY',
ADD COLUMN     "pinCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "totalExpYears" DOUBLE PRECISION,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "workMode" "WorkMode";

-- AlterTable
ALTER TABLE "SalaryReport" ALTER COLUMN "bonus" DROP DEFAULT;

-- CreateTable
CREATE TABLE "JobPostSkill" (
    "id" TEXT NOT NULL,
    "jobPostId" INTEGER NOT NULL,
    "skillId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,

    CONSTRAINT "JobPostSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobScreeningQuestion" (
    "id" TEXT NOT NULL,
    "jobPostId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "type" "ScreeningQuestionType" NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobScreeningQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobPostId" INTEGER NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "location" TEXT,
    "workMode" "WorkMode",
    "startMonth" INTEGER NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endMonth" INTEGER,
    "endYear" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT,
    "fieldOfStudy" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "grade" TEXT,
    "activities" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuingOrg" TEXT NOT NULL,
    "issueMonth" INTEGER,
    "issueYear" INTEGER,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "doesNotExpire" BOOLEAN NOT NULL DEFAULT false,
    "credentialId" TEXT,
    "credentialUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "role" TEXT,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "projectUrl" TEXT,
    "repoUrl" TEXT,
    "startMonth" INTEGER,
    "startYear" INTEGER,
    "endMonth" INTEGER,
    "endYear" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "associatedWith" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT,
    "month" INTEGER,
    "year" INTEGER,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileLanguage" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "proficiency" "LanguageProficiency" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerWork" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "cause" TEXT,
    "startMonth" INTEGER,
    "startYear" INTEGER,
    "endMonth" INTEGER,
    "endYear" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT,
    "month" INTEGER,
    "year" INTEGER,
    "url" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkill" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiency" "SkillProficiency" NOT NULL DEFAULT 'INTERMEDIATE',
    "endorsedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "endorseCount" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "visibility" "ResumeVisibility" NOT NULL DEFAULT 'RECRUITERS_ONLY',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutcomeEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "OutcomeEventType" NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutcomeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" "AIFeature" NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "latencyMs" INTEGER,
    "rating" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserJourney" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumesBuilt" INTEGER NOT NULL DEFAULT 0,
    "fitScoresRun" INTEGER NOT NULL DEFAULT 0,
    "optimiserSessions" INTEGER NOT NULL DEFAULT 0,
    "applicationsSubmitted" INTEGER NOT NULL DEFAULT 0,
    "interviewsScheduled" INTEGER NOT NULL DEFAULT 0,
    "offersReceived" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APIKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawJD" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parsedAt" TIMESTAMP(3),
    "parseError" TEXT,

    CONSTRAINT "RawJD_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParsedJD" (
    "id" TEXT NOT NULL,
    "rawJdId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seniority" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "workMode" TEXT,
    "skills" JSONB NOT NULL,
    "keywords" TEXT[],
    "responsibilities" TEXT[],
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT DEFAULT 'INR',
    "tone" TEXT,
    "companySize" TEXT,
    "promptVersion" TEXT NOT NULL,
    "parsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParsedJD_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JDEmbedding" (
    "id" TEXT NOT NULL,
    "parsedJdId" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JDEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JDSalarySignal" (
    "id" TEXT NOT NULL,
    "parsedJdId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "seniority" TEXT,
    "location" TEXT,
    "salaryMin" INTEGER NOT NULL,
    "salaryMax" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JDSalarySignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobPostSkill_jobPostId_idx" ON "JobPostSkill"("jobPostId");

-- CreateIndex
CREATE UNIQUE INDEX "JobPostSkill_jobPostId_skillId_key" ON "JobPostSkill"("jobPostId", "skillId");

-- CreateIndex
CREATE INDEX "JobScreeningQuestion_jobPostId_idx" ON "JobScreeningQuestion"("jobPostId");

-- CreateIndex
CREATE INDEX "SavedJob_userId_idx" ON "SavedJob"("userId");

-- CreateIndex
CREATE INDEX "SavedJob_jobPostId_idx" ON "SavedJob"("jobPostId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedJob_userId_jobPostId_key" ON "SavedJob"("userId", "jobPostId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_normalizedName_key" ON "Skill"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkill_profileId_skillId_key" ON "UserSkill"("profileId", "skillId");

-- CreateIndex
CREATE INDEX "OutcomeEvent_userId_idx" ON "OutcomeEvent"("userId");

-- CreateIndex
CREATE INDEX "OutcomeEvent_eventType_idx" ON "OutcomeEvent"("eventType");

-- CreateIndex
CREATE INDEX "OutcomeEvent_createdAt_idx" ON "OutcomeEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AIInteraction_userId_idx" ON "AIInteraction"("userId");

-- CreateIndex
CREATE INDEX "AIInteraction_feature_idx" ON "AIInteraction"("feature");

-- CreateIndex
CREATE INDEX "AIInteraction_promptVersion_idx" ON "AIInteraction"("promptVersion");

-- CreateIndex
CREATE INDEX "AIInteraction_createdAt_idx" ON "AIInteraction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserJourney_userId_key" ON "UserJourney"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "APIKey_keyHash_key" ON "APIKey"("keyHash");

-- CreateIndex
CREATE INDEX "APIKey_keyHash_idx" ON "APIKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "RawJD_sourceUrl_key" ON "RawJD"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "RawJD_hash_key" ON "RawJD"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "ParsedJD_rawJdId_key" ON "ParsedJD"("rawJdId");

-- CreateIndex
CREATE UNIQUE INDEX "JDEmbedding_parsedJdId_key" ON "JDEmbedding"("parsedJdId");

-- CreateIndex
CREATE UNIQUE INDEX "JDSalarySignal_parsedJdId_key" ON "JDSalarySignal"("parsedJdId");

-- CreateIndex
CREATE INDEX "JDSalarySignal_role_location_idx" ON "JDSalarySignal"("role", "location");

-- CreateIndex
CREATE UNIQUE INDEX "JobPost_slug_key" ON "JobPost"("slug");

-- CreateIndex
CREATE INDEX "JobPost_slug_idx" ON "JobPost"("slug");

-- CreateIndex
CREATE INDEX "JobPost_recruiterId_idx" ON "JobPost"("recruiterId");

-- CreateIndex
CREATE INDEX "JobPost_companyId_idx" ON "JobPost"("companyId");

-- CreateIndex
CREATE INDEX "JobPost_status_idx" ON "JobPost"("status");

-- CreateIndex
CREATE INDEX "JobPost_createdAt_idx" ON "JobPost"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "JobSeekerProfile_username_key" ON "JobSeekerProfile"("username");

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostSkill" ADD CONSTRAINT "JobPostSkill_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostSkill" ADD CONSTRAINT "JobPostSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobScreeningQuestion" ADD CONSTRAINT "JobScreeningQuestion_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLanguage" ADD CONSTRAINT "ProfileLanguage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerWork" ADD CONSTRAINT "VolunteerWork_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutcomeEvent" ADD CONSTRAINT "OutcomeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInteraction" ADD CONSTRAINT "AIInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJourney" ADD CONSTRAINT "UserJourney_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APIKey" ADD CONSTRAINT "APIKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsedJD" ADD CONSTRAINT "ParsedJD_rawJdId_fkey" FOREIGN KEY ("rawJdId") REFERENCES "RawJD"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JDEmbedding" ADD CONSTRAINT "JDEmbedding_parsedJdId_fkey" FOREIGN KEY ("parsedJdId") REFERENCES "ParsedJD"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JDSalarySignal" ADD CONSTRAINT "JDSalarySignal_parsedJdId_fkey" FOREIGN KEY ("parsedJdId") REFERENCES "ParsedJD"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
