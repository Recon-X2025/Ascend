-- AlterTable
ALTER TABLE "ParsedJD" ADD COLUMN     "company" TEXT,
ADD COLUMN     "functionalArea" TEXT;

-- CreateTable
CREATE TABLE "CompanyInsight" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyId" TEXT,
    "totalJDsIndexed" INTEGER NOT NULL DEFAULT 0,
    "activeRoleCount" INTEGER NOT NULL DEFAULT 0,
    "topRoles" JSONB NOT NULL DEFAULT '[]',
    "juniorPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "midPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seniorPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "managerPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remotePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hybridPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onsitePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryMedian" INTEGER,
    "salaryDisclosureRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topSkills" JSONB NOT NULL DEFAULT '[]',
    "topLocations" JSONB NOT NULL DEFAULT '[]',
    "primaryLocation" TEXT,
    "industries" JSONB NOT NULL DEFAULT '[]',
    "functionalAreas" JSONB NOT NULL DEFAULT '[]',
    "hiringVelocity" TEXT,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "corpusSize" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CompanyInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInsight_companyName_key" ON "CompanyInsight"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInsight_companyId_key" ON "CompanyInsight"("companyId");

-- CreateIndex
CREATE INDEX "CompanyInsight_companyName_idx" ON "CompanyInsight"("companyName");

-- CreateIndex
CREATE INDEX "CompanyInsight_companyId_idx" ON "CompanyInsight"("companyId");

-- AddForeignKey
ALTER TABLE "CompanyInsight" ADD CONSTRAINT "CompanyInsight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
