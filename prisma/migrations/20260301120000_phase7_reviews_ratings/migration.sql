-- CreateEnum
CREATE TYPE "CEOApproval" AS ENUM ('APPROVE', 'DISAPPROVE', 'NO_OPINION');

CREATE TYPE "InterviewResult" AS ENUM ('OFFER', 'REJECTED', 'WITHDREW', 'PENDING');

-- AlterEnum SignalType (add REVIEW_SUBMITTED)
ALTER TYPE "SignalType" ADD VALUE 'REVIEW_SUBMITTED';

-- AlterTable CompanyReview: Phase 7 fields
ALTER TABLE "CompanyReview" ADD COLUMN "headline" TEXT,
ADD COLUMN "employmentType" "EmploymentType",
ADD COLUMN "employmentStart" TEXT,
ADD COLUMN "employmentEnd" TEXT,
ADD COLUMN "department" TEXT,
ADD COLUMN "ceoApprovalRating" "CEOApproval",
ADD COLUMN "moderatedAt" TIMESTAMP(3),
ADD COLUMN "moderatedById" TEXT,
ADD COLUMN "isVerifiedEmployee" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable InterviewReview: Phase 7 fields
ALTER TABLE "InterviewReview" ADD COLUMN "jobApplicationId" TEXT,
ADD COLUMN "interviewYear" INTEGER,
ADD COLUMN "interviewResult" "InterviewResult",
ADD COLUMN "overallRating" INTEGER,
ADD COLUMN "headline" TEXT,
ADD COLUMN "processDesc" TEXT,
ADD COLUMN "questions" TEXT,
ADD COLUMN "tips" TEXT,
ADD COLUMN "roundCount" INTEGER,
ADD COLUMN "durationWeeks" INTEGER,
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "moderatedAt" TIMESTAMP(3),
ADD COLUMN "moderatedById" TEXT,
ADD COLUMN "unhelpfulCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable InterviewVote
CREATE TABLE "InterviewVote" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewVote_pkey" PRIMARY KEY ("id")
);

-- AlterTable SalaryReport: Phase 7 fields
ALTER TABLE "SalaryReport" ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "department" TEXT,
ADD COLUMN "salaryAmount" DOUBLE PRECISION,
ADD COLUMN "baseSalaryOpt" DOUBLE PRECISION,
ADD COLUMN "bonusOpt" DOUBLE PRECISION,
ADD COLUMN "stocksOpt" DOUBLE PRECISION;

-- Drop existing SalaryReport unique if it exists (was userId, companyId, jobTitle, year)
ALTER TABLE "SalaryReport" DROP CONSTRAINT IF EXISTS "SalaryReport_userId_companyId_jobTitle_year_key";

-- CreateIndex SalaryReport: one per company per user (matches Prisma @@unique([userId, companyId]))
CREATE UNIQUE INDEX "SalaryReport_userId_companyId_key" ON "SalaryReport"("userId", "companyId");

-- CreateIndex InterviewReview
CREATE INDEX "InterviewReview_companyId_userId_interviewYear_idx" ON "InterviewReview"("companyId", "userId", "interviewYear");

-- CreateIndex InterviewVote
CREATE UNIQUE INDEX "InterviewVote_reviewId_userId_key" ON "InterviewVote"("reviewId", "userId");

-- CreateIndex SalaryReport status
CREATE INDEX "SalaryReport_companyId_status_idx" ON "SalaryReport"("companyId", "status");

-- AddForeignKey InterviewReview jobApplicationId
ALTER TABLE "InterviewReview" ADD CONSTRAINT "InterviewReview_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "JobApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey InterviewVote
ALTER TABLE "InterviewVote" ADD CONSTRAINT "InterviewVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "InterviewReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewVote" ADD CONSTRAINT "InterviewVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
