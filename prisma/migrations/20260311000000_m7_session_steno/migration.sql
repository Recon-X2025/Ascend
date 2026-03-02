-- M-7: Session Room, Ascend Steno & Session Evidence
-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('PENDING_ACKNOWLEDGEMENT', 'ACKNOWLEDGED', 'DECLINED', 'EXPIRED');
CREATE TYPE "MessageFlagType" AS ENUM ('EXTERNAL_EMAIL', 'PHONE_NUMBER', 'EXTERNAL_VIDEO_LINK', 'PAYMENT_SOLICITATION');
CREATE TYPE "StenoStatus" AS ENUM ('NOT_STARTED', 'ACTIVE', 'PARTIAL', 'COMPLETED', 'SKIPPED');

-- AlterEnum OutcomeEventType (M-7 events)
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_SESSION_ROOM_CREATED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_SESSION_STARTED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_PARTICIPANT_JOINED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_STENO_CONSENT_RECORDED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_STENO_STARTED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_STENO_COMPLETED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_STENO_SKIPPED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_EXTRACTION_COMPLETED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_SESSION_RECORD_GENERATED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_SESSION_COMPLETED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_SESSION_INCOMPLETE';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_SESSION_NO_SHOW';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_EXCEPTION_FILED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_EXCEPTION_ACKNOWLEDGED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'M7_OFF_PLATFORM_FLAG';

-- AlterEnum SessionStatus
ALTER TYPE "SessionStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "SessionStatus" ADD VALUE 'INCOMPLETE_SESSION';
ALTER TYPE "SessionStatus" ADD VALUE 'EXCEPTION_ACKNOWLEDGED';

-- AlterTable EngagementSession
ALTER TABLE "EngagementSession" ADD COLUMN "slotDurationMins" INTEGER;
ALTER TABLE "EngagementSession" ADD COLUMN "effectiveDurationMins" INTEGER;
ALTER TABLE "EngagementSession" ADD COLUMN "carryOverMins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EngagementSession" ADD COLUMN "effectiveSlotMins" INTEGER;
ALTER TABLE "EngagementSession" ADD COLUMN "stenoStatus" "StenoStatus" NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "EngagementSession" ADD COLUMN "sessionRoomId" TEXT;

-- CreateTable SessionRoom
CREATE TABLE "SessionRoom" (
    "id" TEXT NOT NULL,
    "dailyRoomName" TEXT NOT NULL,
    "dailyRoomUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionRoom_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SessionRoom_dailyRoomName_key" ON "SessionRoom"("dailyRoomName");

-- CreateTable SessionJoinLog
CREATE TABLE "SessionJoinLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyParticipantId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionJoinLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SessionJoinLog_sessionId_idx" ON "SessionJoinLog"("sessionId");
CREATE INDEX "SessionJoinLog_userId_idx" ON "SessionJoinLog"("userId");

-- CreateTable StenoConsentLog
CREATE TABLE "StenoConsentLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participantType" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StenoConsentLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StenoConsentLog_sessionId_userId_key" ON "StenoConsentLog"("sessionId", "userId");
CREATE INDEX "StenoConsentLog_sessionId_idx" ON "StenoConsentLog"("sessionId");

-- CreateTable SessionTranscript
CREATE TABLE "SessionTranscript" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionTranscript_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SessionTranscript_sessionId_idx" ON "SessionTranscript"("sessionId");

-- CreateTable StenoExtraction
CREATE TABLE "StenoExtraction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "summary" TEXT,
    "mentorCommitments" JSONB,
    "menteeCommitments" JSONB,
    "actionItems" JSONB,
    "nextSessionFocus" TEXT,
    "goalProgressSignal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StenoExtraction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StenoExtraction_sessionId_idx" ON "StenoExtraction"("sessionId");

-- CreateTable SessionRecord
CREATE TABLE "SessionRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SessionRecord_sessionId_key" ON "SessionRecord"("sessionId");
CREATE INDEX "SessionRecord_sessionId_idx" ON "SessionRecord"("sessionId");

-- CreateTable SessionExceptionNote
CREATE TABLE "SessionExceptionNote" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "filedBy" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "status" "ExceptionStatus" NOT NULL DEFAULT 'PENDING_ACKNOWLEDGEMENT',
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "declinedAt" TIMESTAMP(3),
    "declinedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionExceptionNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SessionExceptionNote_sessionId_idx" ON "SessionExceptionNote"("sessionId");
CREATE INDEX "SessionExceptionNote_status_idx" ON "SessionExceptionNote"("status");

-- CreateTable MessageFlag
CREATE TABLE "MessageFlag" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "flagType" "MessageFlagType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageFlag_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MessageFlag_contractId_idx" ON "MessageFlag"("contractId");
CREATE INDEX "MessageFlag_messageId_idx" ON "MessageFlag"("messageId");

-- CreateIndex EngagementSession sessionRoomId unique
CREATE UNIQUE INDEX "EngagementSession_sessionRoomId_key" ON "EngagementSession"("sessionRoomId");

-- AddForeignKey
ALTER TABLE "EngagementSession" ADD CONSTRAINT "EngagementSession_sessionRoomId_fkey" FOREIGN KEY ("sessionRoomId") REFERENCES "SessionRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SessionJoinLog" ADD CONSTRAINT "SessionJoinLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EngagementSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StenoConsentLog" ADD CONSTRAINT "StenoConsentLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EngagementSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionTranscript" ADD CONSTRAINT "SessionTranscript_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EngagementSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StenoExtraction" ADD CONSTRAINT "StenoExtraction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EngagementSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionRecord" ADD CONSTRAINT "SessionRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EngagementSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionExceptionNote" ADD CONSTRAINT "SessionExceptionNote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EngagementSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
