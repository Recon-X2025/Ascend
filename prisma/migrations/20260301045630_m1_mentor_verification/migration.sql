-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REVERIFICATION_REQUIRED');

-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('GOVERNMENT_ID', 'EMPLOYMENT_PROOF', 'LINKEDIN_PROFILE');

-- CreateEnum
CREATE TYPE "VerificationDecision" AS ENUM ('APPROVED', 'REJECTED', 'MORE_INFO_REQUESTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_VERIFICATION_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_VERIFICATION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_VERIFICATION_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_VERIFICATION_MORE_INFO';
ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_REVERIFICATION_REQUIRED';

-- AlterTable
ALTER TABLE "MentorProfile" ADD COLUMN     "isDiscoverable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';

-- CreateTable
CREATE TABLE "MentorVerification" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "linkedInUrl" TEXT,
    "linkedInChecked" BOOLEAN NOT NULL DEFAULT false,
    "employmentVerified" BOOLEAN NOT NULL DEFAULT false,
    "idVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "nextReviewDue" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "mentorVerificationId" TEXT NOT NULL,
    "type" "VerificationDocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "accepted" BOOLEAN,
    "rejectionReason" TEXT,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationAuditLog" (
    "id" TEXT NOT NULL,
    "mentorVerificationId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "decision" "VerificationDecision" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorVerification_mentorProfileId_key" ON "MentorVerification"("mentorProfileId");

-- AddForeignKey
ALTER TABLE "MentorVerification" ADD CONSTRAINT "MentorVerification_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_mentorVerificationId_fkey" FOREIGN KEY ("mentorVerificationId") REFERENCES "MentorVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationAuditLog" ADD CONSTRAINT "VerificationAuditLog_mentorVerificationId_fkey" FOREIGN KEY ("mentorVerificationId") REFERENCES "MentorVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationAuditLog" ADD CONSTRAINT "VerificationAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
