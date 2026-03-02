-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'SEEKER_PREMIUM', 'SEEKER_ELITE', 'RECRUITER_STARTER', 'RECRUITER_PRO', 'RECRUITER_ENTERPRISE');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('RAZORPAY', 'STRIPE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'PAUSED', 'EXPIRED');

-- DropIndex
DROP INDEX "CompanyInsight_companyName_idx";

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "gateway" "PaymentGateway",
    "gatewaySubId" TEXT,
    "gatewayCustomerId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySubscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'RECRUITER_STARTER',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "gateway" "PaymentGateway",
    "gatewaySubId" TEXT,
    "gatewayCustomerId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "gateway" "PaymentGateway" NOT NULL,
    "gatewayEventId" TEXT NOT NULL,
    "gatewayOrderId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobBoost" (
    "id" TEXT NOT NULL,
    "jobPostId" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "boostType" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "gatewayPayId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobBoost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeUnlock" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "gatewayPayId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_idx" ON "UserSubscription"("userId");

-- CreateIndex
CREATE INDEX "UserSubscription_gatewaySubId_idx" ON "UserSubscription"("gatewaySubId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySubscription_companyId_key" ON "CompanySubscription"("companyId");

-- CreateIndex
CREATE INDEX "CompanySubscription_companyId_idx" ON "CompanySubscription"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_gatewayEventId_key" ON "PaymentEvent"("gatewayEventId");

-- CreateIndex
CREATE INDEX "PaymentEvent_userId_idx" ON "PaymentEvent"("userId");

-- CreateIndex
CREATE INDEX "PaymentEvent_companyId_idx" ON "PaymentEvent"("companyId");

-- CreateIndex
CREATE INDEX "PaymentEvent_gatewayEventId_idx" ON "PaymentEvent"("gatewayEventId");

-- CreateIndex
CREATE INDEX "JobBoost_jobPostId_idx" ON "JobBoost"("jobPostId");

-- CreateIndex
CREATE INDEX "JobBoost_companyId_idx" ON "JobBoost"("companyId");

-- CreateIndex
CREATE INDEX "JobBoost_endsAt_idx" ON "JobBoost"("endsAt");

-- CreateIndex
CREATE INDEX "ResumeUnlock_recruiterId_idx" ON "ResumeUnlock"("recruiterId");

-- CreateIndex
CREATE INDEX "ResumeUnlock_companyId_idx" ON "ResumeUnlock"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeUnlock_recruiterId_seekerId_key" ON "ResumeUnlock"("recruiterId", "seekerId");

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobBoost" ADD CONSTRAINT "JobBoost_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobBoost" ADD CONSTRAINT "JobBoost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeUnlock" ADD CONSTRAINT "ResumeUnlock_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeUnlock" ADD CONSTRAINT "ResumeUnlock_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeUnlock" ADD CONSTRAINT "ResumeUnlock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
