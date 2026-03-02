-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('CLICKED', 'SIGNED_UP', 'CONVERTED', 'REWARDED');

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "signups" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT,
    "codeId" TEXT NOT NULL,
    "referredEmail" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'CLICKED',
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedUpAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "rewardGranted" BOOLEAN NOT NULL DEFAULT false,
    "rewardGrantedAt" TIMESTAMP(3),

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileEndorsement" (
    "id" TEXT NOT NULL,
    "endorserId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileEndorsement_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "referralPremiumUntil" TIMESTAMP(3);

-- AlterTable
ALTER TYPE "NotificationType" ADD VALUE 'SKILL_ENDORSED';

-- AlterTable
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE19_REFERRAL_CLICKED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE19_REFERRAL_SIGNED_UP';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE19_REFERRAL_CONVERTED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE19_SHARE_EVENT';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE19_SKILL_ENDORSED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE19_RECRUITER_INVITE_SENT';

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_userId_key" ON "ReferralCode"("userId");
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");
CREATE INDEX "Referral_codeId_idx" ON "Referral"("codeId");
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");
CREATE INDEX "ShareEvent_userId_idx" ON "ShareEvent"("userId");
CREATE INDEX "ShareEvent_entityType_channel_idx" ON "ShareEvent"("entityType", "channel");
CREATE INDEX "ShareEvent_createdAt_idx" ON "ShareEvent"("createdAt");
CREATE UNIQUE INDEX "ProfileEndorsement_endorserId_recipientId_skill_key" ON "ProfileEndorsement"("endorserId", "recipientId", "skill");
CREATE INDEX "ProfileEndorsement_recipientId_idx" ON "ProfileEndorsement"("recipientId");
CREATE INDEX "ProfileEndorsement_endorserId_idx" ON "ProfileEndorsement"("endorserId");

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "ReferralCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShareEvent" ADD CONSTRAINT "ShareEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProfileEndorsement" ADD CONSTRAINT "ProfileEndorsement_endorserId_fkey" FOREIGN KEY ("endorserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileEndorsement" ADD CONSTRAINT "ProfileEndorsement_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
