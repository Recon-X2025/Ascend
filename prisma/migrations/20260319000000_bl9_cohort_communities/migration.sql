-- BL-9: Cohort Communities — open groups by transition path
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "transitionPath" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Cohort_slug_key" ON "Cohort"("slug");
CREATE INDEX "Cohort_transitionPath_idx" ON "Cohort"("transitionPath");
CREATE INDEX "Cohort_slug_idx" ON "Cohort"("slug");

CREATE TABLE "CohortMember" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CohortMember_cohortId_userId_key" ON "CohortMember"("cohortId", "userId");
CREATE INDEX "CohortMember_cohortId_idx" ON "CohortMember"("cohortId");
CREATE INDEX "CohortMember_userId_idx" ON "CohortMember"("userId");

ALTER TABLE "CohortMember" ADD CONSTRAINT "CohortMember_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortMember" ADD CONSTRAINT "CohortMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CohortThread" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortThread_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CohortThread_cohortId_idx" ON "CohortThread"("cohortId");
CREATE INDEX "CohortThread_authorId_idx" ON "CohortThread"("authorId");

ALTER TABLE "CohortThread" ADD CONSTRAINT "CohortThread_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortThread" ADD CONSTRAINT "CohortThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
