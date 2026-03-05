/*
  Warnings:

  - You are about to drop the column `createdAt` on the `InterviewVote` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "SalaryReport_userId_companyId_jobTitle_year_key";

-- AlterTable
ALTER TABLE "InterviewVote" DROP COLUMN "createdAt";

-- CreateTable
CREATE TABLE "SalaryInsightCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "submissionCount" INTEGER NOT NULL,
    "jdSignalCount" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryInsightCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityMetric" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "rentIndex" DOUBLE PRECISION,
    "costIndex" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalaryInsightCache_cacheKey_key" ON "SalaryInsightCache"("cacheKey");

-- CreateIndex
CREATE INDEX "SalaryInsightCache_cacheKey_idx" ON "SalaryInsightCache"("cacheKey");

-- CreateIndex
CREATE UNIQUE INDEX "CityMetric_city_key" ON "CityMetric"("city");
