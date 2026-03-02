-- Phase 18B: Internal Job Board & Employee Mobility
-- CreateEnum
CREATE TYPE "JobVisibility" AS ENUM ('PUBLIC', 'INTERNAL', 'UNLISTED');

-- AlterTable JobPost
ALTER TABLE "JobPost" ADD COLUMN "visibility" "JobVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "internalFirstDays" INTEGER,
ADD COLUMN "allowAnonymousApply" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Company: add verifiedDomains (text array)
ALTER TABLE "Company" ADD COLUMN "verifiedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable CompanyEmployee
CREATE TABLE "CompanyEmployee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyEmployee_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompanyEmployee_userId_companyId_key" ON "CompanyEmployee"("userId", "companyId");
CREATE INDEX "CompanyEmployee_companyId_idx" ON "CompanyEmployee"("companyId");
CREATE INDEX "CompanyEmployee_userId_idx" ON "CompanyEmployee"("userId");

-- AlterTable JobApplication
ALTER TABLE "JobApplication" ADD COLUMN "isAnonymous" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum ReferralOutcome
CREATE TYPE "ReferralOutcome" AS ENUM ('PENDING', 'APPLIED', 'SHORTLISTED', 'HIRED', 'EXPIRED');

-- CreateTable JobReferral
CREATE TABLE "JobReferral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredEmail" TEXT NOT NULL,
    "jobPostId" INTEGER NOT NULL,
    "outcome" "ReferralOutcome" NOT NULL DEFAULT 'PENDING',
    "referredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobReferral_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JobReferral_jobPostId_idx" ON "JobReferral"("jobPostId");
CREATE INDEX "JobReferral_referrerId_idx" ON "JobReferral"("referrerId");

-- AddForeignKey CompanyEmployee
ALTER TABLE "CompanyEmployee" ADD CONSTRAINT "CompanyEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyEmployee" ADD CONSTRAINT "CompanyEmployee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey JobReferral
ALTER TABLE "JobReferral" ADD CONSTRAINT "JobReferral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobReferral" ADD CONSTRAINT "JobReferral_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Phase 18B outcome event types
ALTER TYPE "OutcomeEventType" ADD VALUE 'JOB_REFERRAL_SENT';
ALTER TYPE "OutcomeEventType" ADD VALUE 'INTERNAL_JOB_VIEWED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'INTERNAL_JOB_APPLIED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'EMPLOYEE_VERIFIED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'JOB_VISIBILITY_SWITCHED';
