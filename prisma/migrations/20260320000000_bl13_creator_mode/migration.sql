-- BL-13: Creator Mode — MentorArticle, MentorNewsletter, MentorNewsletterSubscriber
CREATE TABLE "MentorArticle" (
    "id" TEXT NOT NULL,
    "mentorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorArticle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MentorNewsletter" (
    "id" TEXT NOT NULL,
    "mentorUserId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorNewsletter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MentorNewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "mentorUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorNewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MentorArticle_mentorUserId_slug_key" ON "MentorArticle"("mentorUserId", "slug");
CREATE INDEX "MentorArticle_mentorUserId_idx" ON "MentorArticle"("mentorUserId");
CREATE INDEX "MentorArticle_publishedAt_idx" ON "MentorArticle"("publishedAt");

CREATE INDEX "MentorNewsletter_mentorUserId_idx" ON "MentorNewsletter"("mentorUserId");
CREATE INDEX "MentorNewsletter_sentAt_idx" ON "MentorNewsletter"("sentAt");

CREATE UNIQUE INDEX "MentorNewsletterSubscriber_mentorUserId_email_key" ON "MentorNewsletterSubscriber"("mentorUserId", "email");
CREATE INDEX "MentorNewsletterSubscriber_mentorUserId_idx" ON "MentorNewsletterSubscriber"("mentorUserId");

ALTER TABLE "MentorArticle" ADD CONSTRAINT "MentorArticle_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorNewsletter" ADD CONSTRAINT "MentorNewsletter_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorNewsletterSubscriber" ADD CONSTRAINT "MentorNewsletterSubscriber_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorNewsletterSubscriber" ADD CONSTRAINT "MentorNewsletterSubscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
