-- BL-10: CareerMilestone — shareable cards for contract completed, tier achieved
CREATE TYPE "CareerMilestoneType" AS ENUM ('CONTRACT_COMPLETED', 'TIER_ACHIEVED');

CREATE TABLE "CareerMilestone" (
    "id" TEXT NOT NULL,
    "type" "CareerMilestoneType" NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "consentGivenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerMilestone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CareerMilestone_slug_key" ON "CareerMilestone"("slug");
CREATE INDEX "CareerMilestone_userId_idx" ON "CareerMilestone"("userId");
CREATE INDEX "CareerMilestone_slug_idx" ON "CareerMilestone"("slug");

ALTER TABLE "CareerMilestone" ADD CONSTRAINT "CareerMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
