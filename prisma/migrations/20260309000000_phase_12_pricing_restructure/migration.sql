-- Phase 12 Pricing Restructure
-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'ANNUAL');

-- AlterTable UserSubscription: add new columns
ALTER TABLE "UserSubscription" ADD COLUMN "planKey" TEXT;
ALTER TABLE "UserSubscription" ADD COLUMN "billingPeriod" "BillingPeriod";
ALTER TABLE "UserSubscription" ADD COLUMN "pricePaidPaise" INTEGER;
ALTER TABLE "UserSubscription" ADD COLUMN "startsAt" TIMESTAMP(3);
ALTER TABLE "UserSubscription" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "UserSubscription" ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- CreateTable ResumeOptimisationCredit
CREATE TABLE "ResumeOptimisationCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeOptimisationCredit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResumeOptimisationCredit_userId_key" ON "ResumeOptimisationCredit"("userId");
CREATE INDEX "ResumeOptimisationCredit_userId_idx" ON "ResumeOptimisationCredit"("userId");

ALTER TABLE "ResumeOptimisationCredit" ADD CONSTRAINT "ResumeOptimisationCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterEnum OutcomeEventType: add PRICING_* events (run once; duplicate ADD VALUE can error)
ALTER TYPE "OutcomeEventType" ADD VALUE 'PRICING_RESUME_CREDIT_PURCHASED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PRICING_MENTOR_SUBSCRIPTION_PURCHASED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PRICING_SEEKER_UPGRADE_CLICKED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PRICING_RECRUITER_UPGRADE_CLICKED';
