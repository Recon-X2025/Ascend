-- Phase 3B: Company Admin Dashboard
-- Add REJECTED to ReviewStatus (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'ReviewStatus' AND e.enumlabel = 'REJECTED'
  ) THEN
    ALTER TYPE "ReviewStatus" ADD VALUE 'REJECTED';
  END IF;
END $$;

-- Company: add facebook, instagram
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "facebook" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "instagram" TEXT;

-- CompanyInvite
CREATE TABLE IF NOT EXISTS "CompanyInvite" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyInvite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyInvite_companyId_email_key" ON "CompanyInvite"("companyId", "email");
ALTER TABLE "CompanyInvite" ADD CONSTRAINT "CompanyInvite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CompanyBenefit: add emoji
ALTER TABLE "CompanyBenefit" ADD COLUMN IF NOT EXISTS "emoji" TEXT;

-- CompanyReview: flagReason, helpfulCount, notHelpfulCount, optional sub-ratings, index
ALTER TABLE "CompanyReview" ADD COLUMN IF NOT EXISTS "flagReason" TEXT;
ALTER TABLE "CompanyReview" ADD COLUMN IF NOT EXISTS "helpfulCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CompanyReview" ADD COLUMN IF NOT EXISTS "notHelpfulCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CompanyReview" ALTER COLUMN "workLifeRating" DROP NOT NULL;
ALTER TABLE "CompanyReview" ALTER COLUMN "salaryRating" DROP NOT NULL;
ALTER TABLE "CompanyReview" ALTER COLUMN "cultureRating" DROP NOT NULL;
ALTER TABLE "CompanyReview" ALTER COLUMN "careerRating" DROP NOT NULL;
ALTER TABLE "CompanyReview" ALTER COLUMN "managementRating" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "CompanyReview_companyId_status_idx" ON "CompanyReview"("companyId", "status");

-- InterviewReview: helpfulCount, updatedAt, unique, index
ALTER TABLE "InterviewReview" ADD COLUMN IF NOT EXISTS "helpfulCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "InterviewReview" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS "InterviewReview_userId_companyId_jobTitle_key" ON "InterviewReview"("userId", "companyId", "jobTitle");
CREATE INDEX IF NOT EXISTS "InterviewReview_companyId_status_idx" ON "InterviewReview"("companyId", "status");

-- CompanyQA: updatedAt, index
ALTER TABLE "CompanyQA" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "CompanyQA_companyId_idx" ON "CompanyQA"("companyId");

-- SalaryReport: year, stockValue; drop status, stock; unique index
ALTER TABLE "SalaryReport" ADD COLUMN IF NOT EXISTS "year" INTEGER NOT NULL DEFAULT 2024;
ALTER TABLE "SalaryReport" ADD COLUMN IF NOT EXISTS "stockValue" INTEGER;
UPDATE "SalaryReport" SET "stockValue" = "stock" WHERE "stock" IS NOT NULL;
ALTER TABLE "SalaryReport" DROP COLUMN IF EXISTS "stock";
ALTER TABLE "SalaryReport" DROP COLUMN IF EXISTS "status";
CREATE UNIQUE INDEX IF NOT EXISTS "SalaryReport_userId_companyId_jobTitle_year_key" ON "SalaryReport"("userId", "companyId", "jobTitle", "year");
CREATE INDEX IF NOT EXISTS "SalaryReport_jobTitle_location_idx" ON "SalaryReport"("jobTitle", "location");
