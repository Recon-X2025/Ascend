-- BL-24: Multi-Board Job Syndication
CREATE TYPE "JobBoardSyndicationStatus" AS ENUM ('PENDING', 'LIVE', 'FAILED', 'EXPIRED', 'PAUSED');

CREATE TABLE "JobBoardSyndication" (
    "id" TEXT NOT NULL,
    "jobPostId" INTEGER NOT NULL,
    "board" TEXT NOT NULL,
    "status" "JobBoardSyndicationStatus" NOT NULL DEFAULT 'PENDING',
    "postedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "costPaidPaise" INTEGER,
    "trackingUrl" TEXT,
    "applicantCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobBoardSyndication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobBoardApplicantSource" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "board" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobBoardApplicantSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobBoardSyndication_jobPostId_board_key" ON "JobBoardSyndication"("jobPostId", "board");
CREATE INDEX "JobBoardSyndication_jobPostId_idx" ON "JobBoardSyndication"("jobPostId");
CREATE INDEX "JobBoardSyndication_board_idx" ON "JobBoardSyndication"("board");
CREATE INDEX "JobBoardSyndication_status_idx" ON "JobBoardSyndication"("status");

CREATE UNIQUE INDEX "JobBoardApplicantSource_applicationId_key" ON "JobBoardApplicantSource"("applicationId");
CREATE INDEX "JobBoardApplicantSource_board_idx" ON "JobBoardApplicantSource"("board");

ALTER TABLE "JobBoardSyndication" ADD CONSTRAINT "JobBoardSyndication_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobBoardApplicantSource" ADD CONSTRAINT "JobBoardApplicantSource_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
