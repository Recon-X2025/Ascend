-- AlterTable: add new columns and make companyName optional
ALTER TABLE "CompanyInsight" ADD COLUMN IF NOT EXISTS "industryLocation" TEXT;
ALTER TABLE "CompanyInsight" ADD COLUMN IF NOT EXISTS "aggregationType" TEXT NOT NULL DEFAULT 'company';
ALTER TABLE "CompanyInsight" ALTER COLUMN "companyName" DROP NOT NULL;

-- Unique index on industryLocation (for industry-mode aggregations)
CREATE UNIQUE INDEX "CompanyInsight_industryLocation_key" ON "CompanyInsight"("industryLocation") WHERE "industryLocation" IS NOT NULL;

-- Index for aggregationType
CREATE INDEX "CompanyInsight_aggregationType_idx" ON "CompanyInsight"("aggregationType");
