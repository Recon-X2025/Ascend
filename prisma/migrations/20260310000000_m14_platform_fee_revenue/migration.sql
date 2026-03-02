-- M-14: Platform Fee & Revenue Layer
-- MentorshipEscrow: pilotFeeWaived, mentorTierAtSigning, feeRate
-- EscrowTranche: platformFeePaise, mentorNetPaise
-- TrancheFeeRecord, MentorshipRevenueSnapshot
-- MentorshipAnalyticsSnapshot: platformRevenuePaise, mentorPayoutsPaise, pilotWaivedRevenuePaise
-- MentorAnalyticsSnapshot: totalEarnedPaise, pendingEarnedPaise, inEscrowPaise
-- OutcomeEventType: M14_*

ALTER TABLE "MentorshipEscrow" ADD COLUMN "pilotFeeWaived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MentorshipEscrow" ADD COLUMN "mentorTierAtSigning" TEXT;
ALTER TABLE "MentorshipEscrow" ADD COLUMN "feeRate" DOUBLE PRECISION;

ALTER TABLE "EscrowTranche" ADD COLUMN "platformFeePaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EscrowTranche" ADD COLUMN "mentorNetPaise" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "TrancheFeeRecord" (
    "id" TEXT NOT NULL,
    "trancheId" TEXT NOT NULL,
    "mentorTierAtRelease" TEXT NOT NULL,
    "feeRateApplied" DOUBLE PRECISION NOT NULL,
    "platformFeePaise" INTEGER NOT NULL,
    "mentorNetPaise" INTEGER NOT NULL,
    "pilotFeeWaived" BOOLEAN NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrancheFeeRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrancheFeeRecord_trancheId_key" ON "TrancheFeeRecord"("trancheId");
CREATE INDEX "TrancheFeeRecord_releasedAt_idx" ON "TrancheFeeRecord"("releasedAt");
CREATE INDEX "TrancheFeeRecord_paymentMode_idx" ON "TrancheFeeRecord"("paymentMode");

ALTER TABLE "TrancheFeeRecord" ADD CONSTRAINT "TrancheFeeRecord_trancheId_fkey" FOREIGN KEY ("trancheId") REFERENCES "EscrowTranche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MentorshipRevenueSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalReleasedPaise" INTEGER NOT NULL,
    "platformFeePaise" INTEGER NOT NULL,
    "mentorPayoutPaise" INTEGER NOT NULL,
    "pilotWaivedPaise" INTEGER NOT NULL,
    "tranchesReleased" INTEGER NOT NULL,
    "byTier" JSONB NOT NULL,
    "byPaymentMode" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorshipRevenueSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MentorshipRevenueSnapshot_date_key" ON "MentorshipRevenueSnapshot"("date");
CREATE INDEX "MentorshipRevenueSnapshot_date_idx" ON "MentorshipRevenueSnapshot"("date");

ALTER TABLE "MentorshipAnalyticsSnapshot" ADD COLUMN "platformRevenuePaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MentorshipAnalyticsSnapshot" ADD COLUMN "mentorPayoutsPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MentorshipAnalyticsSnapshot" ADD COLUMN "pilotWaivedRevenuePaise" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "MentorAnalyticsSnapshot" ADD COLUMN "totalEarnedPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MentorAnalyticsSnapshot" ADD COLUMN "pendingEarnedPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MentorAnalyticsSnapshot" ADD COLUMN "inEscrowPaise" INTEGER NOT NULL DEFAULT 0;

ALTER TYPE "OutcomeEventType" ADD VALUE 'M14_TRANCHE_FEE_APPLIED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M14_TRANCHE_FEE_RECALCULATED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M14_REVENUE_SNAPSHOT_COMPUTED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M14_PILOT_FEE_WAIVED';
