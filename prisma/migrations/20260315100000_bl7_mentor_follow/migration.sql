-- BL-7: MentorFollow model — seekers follow mentors without starting an application
CREATE TABLE "MentorFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mentorUserId" TEXT NOT NULL,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorFollow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MentorFollow_userId_mentorUserId_key" ON "MentorFollow"("userId", "mentorUserId");

CREATE INDEX "MentorFollow_mentorUserId_idx" ON "MentorFollow"("mentorUserId");

CREATE INDEX "MentorFollow_userId_idx" ON "MentorFollow"("userId");

ALTER TABLE "MentorFollow" ADD CONSTRAINT "MentorFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorFollow" ADD CONSTRAINT "MentorFollow_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
