-- M-13: Mentor Monetisation Unlock
-- MentorMonetisationStatus, MentorSeoBoost, MentorProfile extensions, OutcomeEventType additions

-- CreateEnum SeoBoostType
CREATE TYPE "SeoBoostType" AS ENUM ('MONTHLY_RECURRING', 'ONE_TIME_30_DAYS', 'ONE_TIME_14_DAYS');

-- AlterEnum OutcomeEventType (M-13 events)
ALTER TYPE "OutcomeEventType" ADD VALUE 'M13_MONETISATION_UNLOCKED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M13_MONETISATION_ELIGIBLE';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M13_MONETISATION_RELOCKED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M13_SESSION_FEE_SET';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M13_SESSION_FEE_UPDATED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M13_SEO_BOOST_PURCHASED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M13_SEO_BOOST_EXPIRED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M13_MONTHLY_REPORT_SENT';

-- CreateTable MentorMonetisationStatus
CREATE TABLE "MentorMonetisationStatus" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "lockedReason" TEXT,
    "reLockedAt" TIMESTAMP(3),
    "verifiedOutcomeCount" INTEGER NOT NULL DEFAULT 0,
    "stenoRate" DOUBLE PRECISION,
    "upheldDisputeCount" INTEGER NOT NULL DEFAULT 0,
    "monthsOnPlatform" INTEGER NOT NULL DEFAULT 0,
    "reVerificationCurrent" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorMonetisationStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable MentorSeoBoost
CREATE TABLE "MentorSeoBoost" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "boostType" "SeoBoostType" NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "razorpayPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorSeoBoost_pkey" PRIMARY KEY ("id")
);

-- AlterTable MentorProfile: M-13 fields
ALTER TABLE "MentorProfile" ADD COLUMN "sessionFeePaise" INTEGER;
ALTER TABLE "MentorProfile" ADD COLUMN "canChargeMentees" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MentorProfile" ADD COLUMN "monthlyReportSentAt" TIMESTAMP(3);
ALTER TABLE "MentorProfile" ADD COLUMN "upheldDisputeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "MentorMonetisationStatus_mentorId_key" ON "MentorMonetisationStatus"("mentorId");
CREATE INDEX "MentorMonetisationStatus_mentorId_idx" ON "MentorMonetisationStatus"("mentorId");
CREATE INDEX "MentorSeoBoost_mentorId_idx" ON "MentorSeoBoost"("mentorId");
CREATE INDEX "MentorSeoBoost_endDate_active_idx" ON "MentorSeoBoost"("endDate", "active");

-- AddForeignKey MentorMonetisationStatus.mentorId -> MentorProfile.id
ALTER TABLE "MentorMonetisationStatus" ADD CONSTRAINT "MentorMonetisationStatus_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey MentorSeoBoost.mentorId -> MentorProfile.id
ALTER TABLE "MentorSeoBoost" ADD CONSTRAINT "MentorSeoBoost_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
