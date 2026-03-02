-- CreateEnum
CREATE TYPE "MentorApplicationStatus" AS ENUM ('PENDING', 'QUESTION_ASKED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "MentorApplication" (
    "id" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "whyThisMentor" TEXT NOT NULL,
    "goalStatement" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "whatAlreadyTried" TEXT NOT NULL,
    "mentorQuestion" TEXT,
    "menteeAnswer" TEXT,
    "declineReason" TEXT,
    "matchReason" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "status" "MentorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mentorRespondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "questionAskedAt" TIMESTAMP(3),
    "answerSubmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenteeReadinessCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "careerContextComplete" BOOLEAN NOT NULL DEFAULT false,
    "transitionDeclared" BOOLEAN NOT NULL DEFAULT false,
    "allGatesPassed" BOOLEAN NOT NULL DEFAULT false,
    "targetFromRole" TEXT,
    "targetFromIndustry" TEXT,
    "targetToRole" TEXT,
    "targetToIndustry" TEXT,
    "targetCity" TEXT,
    "targetTimelineMonths" INTEGER,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenteeReadinessCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorApplication_menteeId_mentorProfileId_key" ON "MentorApplication"("menteeId", "mentorProfileId");

-- CreateIndex
CREATE INDEX "MentorApplication_mentorProfileId_status_idx" ON "MentorApplication"("mentorProfileId", "status");

-- CreateIndex
CREATE INDEX "MentorApplication_status_expiresAt_idx" ON "MentorApplication"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenteeReadinessCheck_userId_key" ON "MenteeReadinessCheck"("userId");

-- AddForeignKey
ALTER TABLE "MentorApplication" ADD CONSTRAINT "MentorApplication_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorApplication" ADD CONSTRAINT "MentorApplication_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenteeReadinessCheck" ADD CONSTRAINT "MenteeReadinessCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
