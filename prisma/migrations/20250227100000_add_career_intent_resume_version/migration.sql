-- CreateEnum
CREATE TYPE "TargetLevel" AS ENUM ('IC', 'TEAM_LEAD', 'MANAGER', 'DIRECTOR', 'VP', 'C_SUITE');

-- CreateTable
CREATE TABLE "CareerIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "targetIndustry" TEXT NOT NULL,
    "targetLevel" "TargetLevel" NOT NULL,
    "careerGoal" VARCHAR(300) NOT NULL,
    "switchingIndustry" BOOLEAN NOT NULL DEFAULT false,
    "fromIndustry" TEXT,
    "toIndustry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "careerIntentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateId" TEXT,
    "contentSnapshot" JSONB,
    "atsScore" INTEGER,
    "lastUsedAt" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerIntent_userId_idx" ON "CareerIntent"("userId");

-- CreateIndex
CREATE INDEX "CareerIntent_profileId_idx" ON "CareerIntent"("profileId");

-- CreateIndex
CREATE INDEX "ResumeVersion_careerIntentId_idx" ON "ResumeVersion"("careerIntentId");

-- AddForeignKey
ALTER TABLE "CareerIntent" ADD CONSTRAINT "CareerIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerIntent" ADD CONSTRAINT "CareerIntent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_careerIntentId_fkey" FOREIGN KEY ("careerIntentId") REFERENCES "CareerIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
