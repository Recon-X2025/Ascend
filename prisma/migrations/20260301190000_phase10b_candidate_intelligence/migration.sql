-- CreateTable
CREATE TABLE "CandidateInsightSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketValueMin" DOUBLE PRECISION,
    "marketValueMax" DOUBLE PRECISION,
    "marketValueMedian" DOUBLE PRECISION,
    "marketValueBasis" TEXT,
    "marketValueAt" TIMESTAMP(3),
    "visibilityScore" INTEGER,
    "visibilityFactors" JSONB,
    "skillsGapData" JSONB,
    "skillsGapAt" TIMESTAMP(3),
    "appPerformanceData" JSONB,
    "appPerformanceAt" TIMESTAMP(3),
    "heatmapData" JSONB,
    "heatmapAt" TIMESTAMP(3),
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateInsightSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateInsightSnapshot_userId_key" ON "CandidateInsightSnapshot"("userId");

-- AddForeignKey
ALTER TABLE "CandidateInsightSnapshot" ADD CONSTRAINT "CandidateInsightSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
