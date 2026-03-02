-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PUBLIC', 'PRIVATE', 'NGO', 'GOVERNMENT', 'STARTUP', 'OTHER');
CREATE TYPE "CompanySize" AS ENUM ('SIZE_1_10', 'SIZE_11_50', 'SIZE_51_200', 'SIZE_201_500', 'SIZE_501_1000', 'SIZE_1001_PLUS');
CREATE TYPE "CompanyAdminRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "CompanyMediaType" AS ENUM ('PHOTO', 'VIDEO_EMBED', 'VIRTUAL_TOUR');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED', 'REMOVED');
CREATE TYPE "EmploymentStatus" AS ENUM ('CURRENT', 'FORMER');
CREATE TYPE "InterviewExperience" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');
CREATE TYPE "InterviewDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'VERY_HARD');
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE', 'TEMPORARY');
CREATE TYPE "SalaryReportStatus" AS ENUM ('PENDING', 'APPROVED');
CREATE TYPE "CompanyQAVoteType" AS ENUM ('UP', 'DOWN');

-- AlterTable JobPost: add companyId (nullable FK to Company)
ALTER TABLE "JobPost" ADD COLUMN "companyId" TEXT;

-- CreateTable Company
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "banner" TEXT,
    "industry" TEXT,
    "type" "CompanyType",
    "size" "CompanySize",
    "founded" INTEGER,
    "hq" TEXT,
    "website" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "glassdoor" TEXT,
    "mission" TEXT,
    "about" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompanyAdmin
CREATE TABLE "CompanyAdmin" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CompanyAdminRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompanyMedia
CREATE TABLE "CompanyMedia" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "CompanyMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompanyBenefit
CREATE TABLE "CompanyBenefit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CompanyBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompanyBenefitRating
CREATE TABLE "CompanyBenefitRating" (
    "id" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "CompanyBenefitRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompanyReview
CREATE TABLE "CompanyReview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employmentStatus" "EmploymentStatus" NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "overallRating" INTEGER NOT NULL,
    "workLifeRating" INTEGER NOT NULL,
    "salaryRating" INTEGER NOT NULL,
    "cultureRating" INTEGER NOT NULL,
    "careerRating" INTEGER NOT NULL,
    "managementRating" INTEGER NOT NULL,
    "recommend" BOOLEAN NOT NULL,
    "ceoApproval" BOOLEAN,
    "pros" TEXT NOT NULL,
    "cons" TEXT NOT NULL,
    "advice" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompanyReviewVote
CREATE TABLE "CompanyReviewVote" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,

    CONSTRAINT "CompanyReviewVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable InterviewReview
CREATE TABLE "InterviewReview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "experience" "InterviewExperience" NOT NULL,
    "difficulty" "InterviewDifficulty" NOT NULL,
    "gotOffer" BOOLEAN,
    "process" TEXT NOT NULL,
    "sampleQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "durationDays" INTEGER,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable SalaryReport
CREATE TABLE "SalaryReport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "bonus" INTEGER DEFAULT 0,
    "stock" INTEGER DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "anonymous" BOOLEAN NOT NULL DEFAULT true,
    "status" "SalaryReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompanyQA
CREATE TABLE "CompanyQA" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredBy" TEXT,
    "answeredAt" TIMESTAMP(3),
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyQA_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompanyQAVote
CREATE TABLE "CompanyQAVote" (
    "id" TEXT NOT NULL,
    "qaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" "CompanyQAVoteType" NOT NULL,

    CONSTRAINT "CompanyQAVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
CREATE INDEX "Company_slug_idx" ON "Company"("slug");
CREATE INDEX "Company_industry_idx" ON "Company"("industry");
CREATE INDEX "Company_verified_idx" ON "Company"("verified");

CREATE UNIQUE INDEX "CompanyAdmin_companyId_userId_key" ON "CompanyAdmin"("companyId", "userId");

CREATE UNIQUE INDEX "CompanyBenefitRating_benefitId_userId_key" ON "CompanyBenefitRating"("benefitId", "userId");

CREATE UNIQUE INDEX "CompanyReview_companyId_userId_key" ON "CompanyReview"("companyId", "userId");
CREATE INDEX "CompanyReview_companyId_idx" ON "CompanyReview"("companyId");
CREATE INDEX "CompanyReview_userId_idx" ON "CompanyReview"("userId");

CREATE UNIQUE INDEX "CompanyReviewVote_reviewId_userId_key" ON "CompanyReviewVote"("reviewId", "userId");

CREATE INDEX "InterviewReview_companyId_idx" ON "InterviewReview"("companyId");

CREATE INDEX "SalaryReport_companyId_idx" ON "SalaryReport"("companyId");
CREATE INDEX "SalaryReport_companyId_jobTitle_idx" ON "SalaryReport"("companyId", "jobTitle");

CREATE UNIQUE INDEX "CompanyQAVote_qaId_userId_key" ON "CompanyQAVote"("qaId", "userId");

-- AddForeignKey JobPost -> Company
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey CompanyAdmin
ALTER TABLE "CompanyAdmin" ADD CONSTRAINT "CompanyAdmin_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyAdmin" ADD CONSTRAINT "CompanyAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey CompanyMedia
ALTER TABLE "CompanyMedia" ADD CONSTRAINT "CompanyMedia_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey CompanyBenefit
ALTER TABLE "CompanyBenefit" ADD CONSTRAINT "CompanyBenefit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey CompanyBenefitRating
ALTER TABLE "CompanyBenefitRating" ADD CONSTRAINT "CompanyBenefitRating_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "CompanyBenefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyBenefitRating" ADD CONSTRAINT "CompanyBenefitRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey CompanyReview
ALTER TABLE "CompanyReview" ADD CONSTRAINT "CompanyReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyReview" ADD CONSTRAINT "CompanyReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey CompanyReviewVote
ALTER TABLE "CompanyReviewVote" ADD CONSTRAINT "CompanyReviewVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "CompanyReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyReviewVote" ADD CONSTRAINT "CompanyReviewVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey InterviewReview
ALTER TABLE "InterviewReview" ADD CONSTRAINT "InterviewReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewReview" ADD CONSTRAINT "InterviewReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey SalaryReport
ALTER TABLE "SalaryReport" ADD CONSTRAINT "SalaryReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalaryReport" ADD CONSTRAINT "SalaryReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey CompanyQA
ALTER TABLE "CompanyQA" ADD CONSTRAINT "CompanyQA_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyQA" ADD CONSTRAINT "CompanyQA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey CompanyQAVote
ALTER TABLE "CompanyQAVote" ADD CONSTRAINT "CompanyQAVote_qaId_fkey" FOREIGN KEY ("qaId") REFERENCES "CompanyQA"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyQAVote" ADD CONSTRAINT "CompanyQAVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
