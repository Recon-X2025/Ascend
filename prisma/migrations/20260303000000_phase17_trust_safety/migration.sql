-- Phase 17: Trust, Safety & Compliance
-- Extend AuditLog; add SecurityEvent, UserReport, DataRequest; User.deletedAt

-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('AUTH', 'DATA_ACCESS', 'DATA_MUTATION', 'ADMIN_ACTION', 'PAYMENT', 'MENTORSHIP', 'SECURITY', 'COMPLIANCE', 'SYSTEM');
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE "ReportTargetType" AS ENUM ('JOB_POST', 'COMPANY_REVIEW', 'USER_PROFILE', 'MESSAGE', 'MENTOR_PROFILE');
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'MISLEADING', 'INAPPROPRIATE', 'FAKE', 'HARASSMENT', 'OTHER');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED_ACTION_TAKEN', 'RESOLVED_NO_ACTION', 'DISMISSED');
CREATE TYPE "DataRequestType" AS ENUM ('EXPORT', 'DELETE', 'RECTIFY');
CREATE TYPE "DataRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable AuditLog: make adminId optional, add Phase 17 columns
ALTER TABLE "AuditLog" ALTER COLUMN "adminId" DROP NOT NULL;
ALTER TABLE "AuditLog" ADD COLUMN "actorId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "actorRole" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "actorIp" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "actorAgent" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "category" "AuditCategory" NOT NULL DEFAULT 'ADMIN_ACTION';
ALTER TABLE "AuditLog" ADD COLUMN "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO';
ALTER TABLE "AuditLog" ADD COLUMN "previousState" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN "newState" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN "success" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AuditLog" ADD COLUMN "errorCode" TEXT;

CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_category_idx" ON "AuditLog"("category");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable User: add deletedAt
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateTable SecurityEvent
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorIp" TEXT,
    "actorId" TEXT,
    "endpoint" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityEvent_type_idx" ON "SecurityEvent"("type");
CREATE INDEX "SecurityEvent_actorIp_idx" ON "SecurityEvent"("actorIp");
CREATE INDEX "SecurityEvent_actorId_idx" ON "SecurityEvent"("actorId");
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

-- CreateTable UserReport
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserReport_status_idx" ON "UserReport"("status");
CREATE INDEX "UserReport_targetType_targetId_idx" ON "UserReport"("targetType", "targetId");
CREATE INDEX "UserReport_reporterId_idx" ON "UserReport"("reporterId");

ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable DataRequest
CREATE TABLE "DataRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DataRequestType" NOT NULL,
    "status" "DataRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "exportUrl" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DataRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DataRequest_userId_idx" ON "DataRequest"("userId");
CREATE INDEX "DataRequest_status_idx" ON "DataRequest"("status");
CREATE INDEX "DataRequest_type_idx" ON "DataRequest"("type");

ALTER TABLE "DataRequest" ADD CONSTRAINT "DataRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Phase 17 outcome event types
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE17_REPORT_SUBMITTED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE17_DATA_EXPORT_REQUESTED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE17_ACCOUNT_DELETION_REQUESTED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE17_SECURITY_EVENT_LOGGED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE17_COMPLIANCE_ACTION_TAKEN';
