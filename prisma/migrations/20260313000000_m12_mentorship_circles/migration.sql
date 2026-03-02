-- M-12: Mentorship Circles (Group Cohorts)
-- One circle = one mentor capacity slot. Individual contracts + escrow per member.

-- Ensure SessionRoom exists (M-7 dependency — create if dev DB out of sync)
CREATE TABLE IF NOT EXISTS "SessionRoom" (
    "id" TEXT NOT NULL,
    "dailyRoomName" TEXT NOT NULL,
    "dailyRoomUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SessionRoom_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SessionRoom_dailyRoomName_key" ON "SessionRoom"("dailyRoomName");

-- AlterEnum OutcomeEventType (M-12 events)
ALTER TYPE "OutcomeEventType" ADD VALUE 'M12_PEER_CHECK_IN';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M12_CIRCLE_CREATED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M12_CIRCLE_APPLICATION_SUBMITTED';

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('STANDARD', 'CIRCLE');

CREATE TYPE "CircleStatus" AS ENUM ('DRAFT', 'OPEN', 'LOCKED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TYPE "CircleMemberStatus" AS ENUM ('APPLIED', 'ACCEPTED', 'CONFIRMED', 'DECLINED', 'WITHDRAWN');

-- Alter MentorshipContract: support circle contracts (no MentorApplication)
ALTER TABLE "MentorshipContract" ADD COLUMN "contractType" "ContractType" NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "MentorshipContract" ADD COLUMN "circleMemberId" TEXT;
ALTER TABLE "MentorshipContract" ALTER COLUMN "mentorApplicationId" DROP NOT NULL;

CREATE UNIQUE INDEX "MentorshipContract_circleMemberId_key" ON "MentorshipContract"("circleMemberId");

-- CreateTable MentorshipCircle
CREATE TABLE "MentorshipCircle" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxMembers" INTEGER NOT NULL DEFAULT 6,
    "feePaise" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "status" "CircleStatus" NOT NULL DEFAULT 'DRAFT',
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipCircle_pkey" PRIMARY KEY ("id")
);

-- CreateTable CircleMember
CREATE TABLE "CircleMember" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "status" "CircleMemberStatus" NOT NULL DEFAULT 'APPLIED',
    "applicationNote" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable CircleSession
CREATE TABLE "CircleSession" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "sessionRoomId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircleSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable CircleOneOnOneSlot
CREATE TABLE "CircleOneOnOneSlot" (
    "id" TEXT NOT NULL,
    "circleMemberId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircleOneOnOneSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable CirclePeerCheckIn
CREATE TABLE "CirclePeerCheckIn" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CirclePeerCheckIn_pkey" PRIMARY KEY ("id")
);

-- Alter EngagementSession: link to CircleSession for group sessions
ALTER TABLE "EngagementSession" ADD COLUMN "circleSessionId" TEXT;

-- Alter SessionRoom: add optional circleSession back-relation (CircleSession references it)
-- SessionRoom stays as-is; CircleSession has sessionRoomId

-- CreateIndex
CREATE UNIQUE INDEX "CircleMember_circleId_menteeId_key" ON "CircleMember"("circleId", "menteeId");
CREATE INDEX "CircleMember_circleId_idx" ON "CircleMember"("circleId");
CREATE INDEX "CircleMember_menteeId_idx" ON "CircleMember"("menteeId");
CREATE INDEX "CircleMember_status_idx" ON "CircleMember"("status");

CREATE INDEX "MentorshipCircle_mentorId_idx" ON "MentorshipCircle"("mentorId");
CREATE INDEX "MentorshipCircle_mentorProfileId_idx" ON "MentorshipCircle"("mentorProfileId");
CREATE INDEX "MentorshipCircle_status_idx" ON "MentorshipCircle"("status");
CREATE INDEX "MentorshipCircle_startDate_idx" ON "MentorshipCircle"("startDate");

CREATE INDEX "CircleSession_circleId_idx" ON "CircleSession"("circleId");
CREATE UNIQUE INDEX "CircleSession_circleId_sessionNumber_key" ON "CircleSession"("circleId", "sessionNumber");
CREATE INDEX "CircleSession_sessionRoomId_idx" ON "CircleSession"("sessionRoomId");

CREATE INDEX "CircleOneOnOneSlot_circleMemberId_idx" ON "CircleOneOnOneSlot"("circleMemberId");

CREATE INDEX "CirclePeerCheckIn_circleId_idx" ON "CirclePeerCheckIn"("circleId");
CREATE INDEX "CirclePeerCheckIn_fromMemberId_idx" ON "CirclePeerCheckIn"("fromMemberId");
CREATE INDEX "CirclePeerCheckIn_toMemberId_idx" ON "CirclePeerCheckIn"("toMemberId");

CREATE INDEX "EngagementSession_circleSessionId_idx" ON "EngagementSession"("circleSessionId");

-- AddForeignKey
ALTER TABLE "MentorshipCircle" ADD CONSTRAINT "MentorshipCircle_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorshipCircle" ADD CONSTRAINT "MentorshipCircle_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "MentorshipCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleSession" ADD CONSTRAINT "CircleSession_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "MentorshipCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleSession" ADD CONSTRAINT "CircleSession_sessionRoomId_fkey" FOREIGN KEY ("sessionRoomId") REFERENCES "SessionRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CircleOneOnOneSlot" ADD CONSTRAINT "CircleOneOnOneSlot_circleMemberId_fkey" FOREIGN KEY ("circleMemberId") REFERENCES "CircleMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CirclePeerCheckIn" ADD CONSTRAINT "CirclePeerCheckIn_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "MentorshipCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CirclePeerCheckIn" ADD CONSTRAINT "CirclePeerCheckIn_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "CircleMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CirclePeerCheckIn" ADD CONSTRAINT "CirclePeerCheckIn_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "CircleMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EngagementSession" ADD CONSTRAINT "EngagementSession_circleSessionId_fkey" FOREIGN KEY ("circleSessionId") REFERENCES "CircleSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
