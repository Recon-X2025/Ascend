-- CreateTable
CREATE TABLE "FitScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobPostId" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "skillsScore" INTEGER NOT NULL,
    "experienceScore" INTEGER NOT NULL,
    "educationScore" INTEGER NOT NULL,
    "keywordsScore" INTEGER NOT NULL,
    "skillGaps" JSONB NOT NULL,
    "experienceGaps" JSONB NOT NULL,
    "keywordGaps" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "profileVersion" TEXT,
    "promptVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitScoreHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobPostId" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitScoreHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FitScore_userId_idx" ON "FitScore"("userId");

-- CreateIndex
CREATE INDEX "FitScore_jobPostId_idx" ON "FitScore"("jobPostId");

-- CreateIndex
CREATE INDEX "FitScore_expiresAt_idx" ON "FitScore"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FitScore_userId_jobPostId_key" ON "FitScore"("userId", "jobPostId");

-- CreateIndex
CREATE INDEX "FitScoreHistory_userId_recordedAt_idx" ON "FitScoreHistory"("userId", "recordedAt");

-- AddForeignKey
ALTER TABLE "FitScore" ADD CONSTRAINT "FitScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitScore" ADD CONSTRAINT "FitScore_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitScoreHistory" ADD CONSTRAINT "FitScoreHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitScoreHistory" ADD CONSTRAINT "FitScoreHistory_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
