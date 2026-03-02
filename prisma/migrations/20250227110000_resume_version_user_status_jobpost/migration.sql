-- CreateEnum
CREATE TYPE "ResumeVersionStatus" AS ENUM ('DRAFT', 'COMPLETE');

-- CreateTable
CREATE TABLE "JobPost" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "role" TEXT,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- AddColumn ResumeVersion: userId (nullable first for backfill)
ALTER TABLE "ResumeVersion" ADD COLUMN "userId" TEXT;
UPDATE "ResumeVersion" SET "userId" = "CareerIntent"."userId"
FROM "CareerIntent" WHERE "ResumeVersion"."careerIntentId" = "CareerIntent"."id";
ALTER TABLE "ResumeVersion" ALTER COLUMN "userId" SET NOT NULL;

-- AddColumn ResumeVersion: status, jobPostId, isDefault
ALTER TABLE "ResumeVersion" ADD COLUMN "status" "ResumeVersionStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "ResumeVersion" ADD COLUMN "jobPostId" INTEGER;
ALTER TABLE "ResumeVersion" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ResumeVersion_userId_idx" ON "ResumeVersion"("userId");
CREATE INDEX "ResumeVersion_jobPostId_idx" ON "ResumeVersion"("jobPostId");

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
