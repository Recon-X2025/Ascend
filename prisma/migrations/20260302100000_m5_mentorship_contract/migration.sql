-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING_MENTOR_SIGNATURE', 'PENDING_MENTEE_SIGNATURE', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'TERMINATED_BY_MENTOR', 'TERMINATED_BY_MENTEE', 'VOID');

-- CreateTable
CREATE TABLE "MentorshipContract" (
    "id" TEXT NOT NULL,
    "mentorApplicationId" TEXT NOT NULL,
    "mentorUserId" TEXT NOT NULL,
    "menteeUserId" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING_MENTOR_SIGNATURE',
    "contractContent" JSONB NOT NULL,
    "tcVersion" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "pdfHash" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "mentorSignDeadline" TIMESTAMP(3),
    "menteeSignDeadline" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "terminatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSignature" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "signerUserId" TEXT NOT NULL,
    "signerRole" TEXT NOT NULL,
    "otpRequestedAt" TIMESTAMP(3) NOT NULL,
    "otpVerifiedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "declaration" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorshipContract_mentorApplicationId_key" ON "MentorshipContract"("mentorApplicationId");

-- CreateIndex
CREATE INDEX "MentorshipContract_mentorUserId_idx" ON "MentorshipContract"("mentorUserId");

-- CreateIndex
CREATE INDEX "MentorshipContract_menteeUserId_idx" ON "MentorshipContract"("menteeUserId");

-- CreateIndex
CREATE INDEX "MentorshipContract_status_idx" ON "MentorshipContract"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContractSignature_contractId_signerRole_key" ON "ContractSignature"("contractId", "signerRole");

-- CreateIndex
CREATE INDEX "ContractSignature_contractId_idx" ON "ContractSignature"("contractId");

-- CreateIndex
CREATE INDEX "ContractSignature_signerUserId_idx" ON "ContractSignature"("signerUserId");

-- AddForeignKey
ALTER TABLE "MentorshipContract" ADD CONSTRAINT "MentorshipContract_mentorApplicationId_fkey" FOREIGN KEY ("mentorApplicationId") REFERENCES "MentorApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipContract" ADD CONSTRAINT "MentorshipContract_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipContract" ADD CONSTRAINT "MentorshipContract_menteeUserId_fkey" FOREIGN KEY ("menteeUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSignature" ADD CONSTRAINT "ContractSignature_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MentorshipContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSignature" ADD CONSTRAINT "ContractSignature_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
