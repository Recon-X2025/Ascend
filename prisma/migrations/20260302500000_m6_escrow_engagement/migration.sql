-- M-6: Escrow & Engagement infrastructure (missing migration)
-- Creates MentorshipEscrow, EscrowTranche, EngagementSession, EngagementMilestone
-- required by m14 (platform fee) and m7 (session steno)

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('ESCROW', 'FULL_UPFRONT');
CREATE TYPE "EscrowStatus" AS ENUM ('PENDING_PAYMENT', 'FUNDED', 'COMPLETED', 'TERMINATED', 'VOIDED');
CREATE TYPE "TrancheStatus" AS ENUM ('HELD', 'PENDING_RELEASE', 'FROZEN', 'RELEASED', 'REFUNDED');
CREATE TYPE "EngagementType" AS ENUM ('SPRINT', 'STANDARD', 'DEEP');
CREATE TYPE "MilestoneType" AS ENUM ('GOAL_SETTING', 'MID', 'FINAL');
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'MENTOR_FILED', 'MENTEE_FILED', 'COMPLETE');

-- Alter MentorshipContract: engagement rhythm + agreed fee
ALTER TABLE "MentorshipContract" ADD COLUMN "engagementType" "EngagementType" NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "MentorshipContract" ADD COLUMN "engagementStart" TIMESTAMP(3);
ALTER TABLE "MentorshipContract" ADD COLUMN "engagementEnd" TIMESTAMP(3);
ALTER TABLE "MentorshipContract" ADD COLUMN "agreedFeePaise" INTEGER;

-- CreateTable EngagementSession (m7 alters this)
CREATE TABLE "EngagementSession" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "mentorNotes" TEXT,
    "sharedNotes" TEXT,
    "durationMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngagementSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EngagementSession_contractId_idx" ON "EngagementSession"("contractId");
ALTER TABLE "EngagementSession" ADD CONSTRAINT "EngagementSession_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MentorshipContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable EngagementMilestone (EscrowTranche references this)
CREATE TABLE "EngagementMilestone" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "milestoneNumber" INTEGER NOT NULL,
    "type" "MilestoneType" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "mentorAssessment" TEXT,
    "menteeAssessment" TEXT,
    "mentorFiledAt" TIMESTAMP(3),
    "menteeFiledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngagementMilestone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EngagementMilestone_contractId_idx" ON "EngagementMilestone"("contractId");
ALTER TABLE "EngagementMilestone" ADD CONSTRAINT "EngagementMilestone_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MentorshipContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable MentorshipEscrow (m14 adds pilotFeeWaived, mentorTierAtSigning, feeRate)
CREATE TABLE "MentorshipEscrow" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'ESCROW',
    "status" "EscrowStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "totalAmountPaise" INTEGER NOT NULL,
    "platformFeePaise" INTEGER NOT NULL DEFAULT 0,
    "mentorPayoutPaise" INTEGER NOT NULL DEFAULT 0,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "fundedAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipEscrow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MentorshipEscrow_contractId_key" ON "MentorshipEscrow"("contractId");
CREATE INDEX "MentorshipEscrow_contractId_idx" ON "MentorshipEscrow"("contractId");
CREATE INDEX "MentorshipEscrow_mentorId_idx" ON "MentorshipEscrow"("mentorId");
CREATE INDEX "MentorshipEscrow_menteeId_idx" ON "MentorshipEscrow"("menteeId");
CREATE INDEX "MentorshipEscrow_status_idx" ON "MentorshipEscrow"("status");

ALTER TABLE "MentorshipEscrow" ADD CONSTRAINT "MentorshipEscrow_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MentorshipContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorshipEscrow" ADD CONSTRAINT "MentorshipEscrow_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MentorshipEscrow" ADD CONSTRAINT "MentorshipEscrow_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable EscrowTranche (m14 adds platformFeePaise, mentorNetPaise)
CREATE TABLE "EscrowTranche" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "trancheNumber" INTEGER NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "percentPct" INTEGER NOT NULL,
    "status" "TrancheStatus" NOT NULL DEFAULT 'HELD',
    "milestoneId" TEXT,
    "autoReleaseAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowTranche_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EscrowTranche_escrowId_trancheNumber_key" ON "EscrowTranche"("escrowId", "trancheNumber");
CREATE UNIQUE INDEX "EscrowTranche_milestoneId_key" ON "EscrowTranche"("milestoneId");
CREATE INDEX "EscrowTranche_escrowId_idx" ON "EscrowTranche"("escrowId");
CREATE INDEX "EscrowTranche_status_idx" ON "EscrowTranche"("status");
CREATE INDEX "EscrowTranche_autoReleaseAt_idx" ON "EscrowTranche"("autoReleaseAt");

ALTER TABLE "EscrowTranche" ADD CONSTRAINT "EscrowTranche_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "MentorshipEscrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EscrowTranche" ADD CONSTRAINT "EscrowTranche_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "EngagementMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
