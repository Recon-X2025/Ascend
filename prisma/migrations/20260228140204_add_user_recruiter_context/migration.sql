-- CreateEnum
CREATE TYPE "HiringVolume" AS ENUM ('OCCASIONAL', 'REGULAR', 'HIGH_VOLUME');

-- CreateEnum
CREATE TYPE "RecruiterPainPoint" AS ENUM ('CANDIDATE_QUALITY', 'TIME_TO_HIRE', 'PIPELINE_VISIBILITY', 'JD_WRITING', 'SOURCING', 'OFFER_ACCEPTANCE');

-- CreateTable
CREATE TABLE "UserRecruiterContext" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hiringFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiringVolume" "HiringVolume",
    "painPoints" "RecruiterPainPoint"[] DEFAULT ARRAY[]::"RecruiterPainPoint"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRecruiterContext_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRecruiterContext_userId_key" ON "UserRecruiterContext"("userId");

-- AddForeignKey
ALTER TABLE "UserRecruiterContext" ADD CONSTRAINT "UserRecruiterContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
