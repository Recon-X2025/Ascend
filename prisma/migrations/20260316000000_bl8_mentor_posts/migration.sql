-- BL-8: MentorPost model — mentors publish short insights; followers see in feed
CREATE TABLE "MentorPost" (
    "id" TEXT NOT NULL,
    "mentorUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MentorPost_mentorUserId_idx" ON "MentorPost"("mentorUserId");
CREATE INDEX "MentorPost_createdAt_idx" ON "MentorPost"("createdAt");

ALTER TABLE "MentorPost" ADD CONSTRAINT "MentorPost_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
