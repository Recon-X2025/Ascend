-- CreateEnum
CREATE TYPE "OptimisationStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- AlterEnum
ALTER TYPE "OutcomeEventType" ADD VALUE 'RESUME_OPTIMISED';

-- AlterTable
ALTER TABLE "ResumeVersion" ADD COLUMN     "optimisationMeta" JSONB,
ADD COLUMN     "optimisedFrom" TEXT;

-- CreateTable
CREATE TABLE "OptimisationSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobPostId" INTEGER NOT NULL,
    "baseVersionId" TEXT NOT NULL,
    "outputVersionId" TEXT,
    "status" "OptimisationStatus" NOT NULL DEFAULT 'PENDING',
    "fitScoreBefore" DOUBLE PRECISION,
    "fitScoreAfter" DOUBLE PRECISION,
    "gapAnalysis" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimisationSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptimisationSession_userId_idx" ON "OptimisationSession"("userId");

-- CreateIndex
CREATE INDEX "OptimisationSession_jobPostId_idx" ON "OptimisationSession"("jobPostId");

-- CreateIndex
CREATE INDEX "OptimisationSession_baseVersionId_idx" ON "OptimisationSession"("baseVersionId");

-- CreateIndex
CREATE INDEX "OptimisationSession_status_idx" ON "OptimisationSession"("status");

-- CreateIndex
CREATE INDEX "ResumeVersion_optimisedFrom_idx" ON "ResumeVersion"("optimisedFrom");

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_optimisedFrom_fkey" FOREIGN KEY ("optimisedFrom") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimisationSession" ADD CONSTRAINT "OptimisationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimisationSession" ADD CONSTRAINT "OptimisationSession_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimisationSession" ADD CONSTRAINT "OptimisationSession_baseVersionId_fkey" FOREIGN KEY ("baseVersionId") REFERENCES "ResumeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimisationSession" ADD CONSTRAINT "OptimisationSession_outputVersionId_fkey" FOREIGN KEY ("outputVersionId") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
