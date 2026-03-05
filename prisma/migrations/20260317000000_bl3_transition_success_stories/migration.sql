-- BL-3: TransitionSuccessStory — consent-gated shareable cards
CREATE TABLE "TransitionSuccessStory" (
    "id" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "includeEmployer" BOOLEAN NOT NULL DEFAULT false,
    "consentGivenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransitionSuccessStory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransitionSuccessStory_outcomeId_key" ON "TransitionSuccessStory"("outcomeId");
CREATE UNIQUE INDEX "TransitionSuccessStory_slug_key" ON "TransitionSuccessStory"("slug");
CREATE INDEX "TransitionSuccessStory_slug_idx" ON "TransitionSuccessStory"("slug");

ALTER TABLE "TransitionSuccessStory" ADD CONSTRAINT "TransitionSuccessStory_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "MentorshipOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
