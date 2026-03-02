-- Phase 22: Marketplace & Career Services
-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "ProviderType" AS ENUM ('RESUME_REVIEWER', 'MOCK_INTERVIEWER', 'CAREER_COACH');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'IN_REVIEW', 'DELIVERED', 'DISPUTED', 'REFUNDED');
CREATE TYPE "BadgeStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'EXPIRED', 'REVOKED');

-- AlterEnum NotificationType: add marketplace types
ALTER TYPE "NotificationType" ADD VALUE 'MARKETPLACE_ORDER_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'MARKETPLACE_ORDER_DELIVERED';
ALTER TYPE "NotificationType" ADD VALUE 'MARKETPLACE_ORDER_DISPUTED';
ALTER TYPE "NotificationType" ADD VALUE 'MARKETPLACE_PROVIDER_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'MARKETPLACE_PROVIDER_REJECTED';

-- AlterEnum OutcomeEventType: add Phase 22 types
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE22_PROVIDER_APPLIED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE22_PROVIDER_APPROVED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE22_ORDER_CREATED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE22_ORDER_DELIVERED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE22_ORDER_DISPUTED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE22_COURSE_CLICKED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE22_BADGE_ADDED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE22_MARKETPLACE_REVENUE';

-- CreateTable MarketplaceProvider
CREATE TABLE "MarketplaceProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "status" "ProviderStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "bio" TEXT NOT NULL,
    "specialisations" TEXT[],
    "languages" TEXT[],
    "pricePerSession" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "avgRating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "turnaroundHours" INTEGER,
    "calendarUrl" TEXT,
    "adminNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceProvider_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketplaceProvider_userId_key" ON "MarketplaceProvider"("userId");

-- CreateTable ResumeReviewOrder
CREATE TABLE "ResumeReviewOrder" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "resumeVersionId" TEXT,
    "resumeUrl" TEXT NOT NULL,
    "careerGoal" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentEventId" TEXT,
    "platformFee" INTEGER NOT NULL,
    "providerPayout" INTEGER NOT NULL,
    "feedbackUrl" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "seekerRating" INTEGER,
    "seekerReview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeReviewOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResumeReviewOrder_seekerId_idx" ON "ResumeReviewOrder"("seekerId");
CREATE INDEX "ResumeReviewOrder_providerId_idx" ON "ResumeReviewOrder"("providerId");
CREATE INDEX "ResumeReviewOrder_status_idx" ON "ResumeReviewOrder"("status");

-- CreateTable MockInterviewBooking
CREATE TABLE "MockInterviewBooking" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "targetRole" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "scheduledAt" TIMESTAMP(3),
    "paymentEventId" TEXT,
    "platformFee" INTEGER NOT NULL,
    "providerPayout" INTEGER NOT NULL,
    "technicalScore" INTEGER,
    "communicationScore" INTEGER,
    "cultureScore" INTEGER,
    "problemSolvingScore" INTEGER,
    "scorecardNotes" TEXT,
    "recordingConsent" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "seekerRating" INTEGER,
    "seekerReview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockInterviewBooking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MockInterviewBooking_seekerId_idx" ON "MockInterviewBooking"("seekerId");
CREATE INDEX "MockInterviewBooking_providerId_idx" ON "MockInterviewBooking"("providerId");
CREATE INDEX "MockInterviewBooking_status_idx" ON "MockInterviewBooking"("status");

-- CreateTable CoachingSession
CREATE TABLE "CoachingSession" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "scheduledAt" TIMESTAMP(3),
    "paymentEventId" TEXT,
    "platformFee" INTEGER NOT NULL,
    "providerPayout" INTEGER NOT NULL,
    "sessionNotes" TEXT,
    "seekerRating" INTEGER,
    "seekerReview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoachingSession_seekerId_idx" ON "CoachingSession"("seekerId");
CREATE INDEX "CoachingSession_providerId_idx" ON "CoachingSession"("providerId");
CREATE INDEX "CoachingSession_status_idx" ON "CoachingSession"("status");

-- CreateTable ProviderReview
CREATE TABLE "ProviderReview" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "serviceType" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderReview_reviewerId_orderId_key" ON "ProviderReview"("reviewerId", "orderId");
CREATE INDEX "ProviderReview_providerId_idx" ON "ProviderReview"("providerId");

-- CreateTable CourseRecommendation
CREATE TABLE "CourseRecommendation" (
    "id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "affiliateCode" TEXT,
    "priceInr" INTEGER,
    "durationHours" INTEGER,
    "level" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseRecommendation_skill_idx" ON "CourseRecommendation"("skill");
CREATE INDEX "CourseRecommendation_isActive_idx" ON "CourseRecommendation"("isActive");

-- CreateTable CourseClick
CREATE TABLE "CourseClick" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "courseId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseClick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseClick_courseId_idx" ON "CourseClick"("courseId");
CREATE INDEX "CourseClick_userId_idx" ON "CourseClick"("userId");

-- CreateTable ProfileBadge
CREATE TABLE "ProfileBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "percentile" DOUBLE PRECISION,
    "badgeUrl" TEXT,
    "verificationUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" "BadgeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileBadge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileBadge_userId_provider_skill_key" ON "ProfileBadge"("userId", "provider", "skill");
CREATE INDEX "ProfileBadge_userId_idx" ON "ProfileBadge"("userId");
CREATE INDEX "ProfileBadge_status_idx" ON "ProfileBadge"("status");

-- AddForeignKey
ALTER TABLE "MarketplaceProvider" ADD CONSTRAINT "MarketplaceProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResumeReviewOrder" ADD CONSTRAINT "ResumeReviewOrder_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResumeReviewOrder" ADD CONSTRAINT "ResumeReviewOrder_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MarketplaceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockInterviewBooking" ADD CONSTRAINT "MockInterviewBooking_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockInterviewBooking" ADD CONSTRAINT "MockInterviewBooking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MarketplaceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachingSession" ADD CONSTRAINT "CoachingSession_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachingSession" ADD CONSTRAINT "CoachingSession_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MarketplaceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderReview" ADD CONSTRAINT "ProviderReview_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MarketplaceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderReview" ADD CONSTRAINT "ProviderReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseClick" ADD CONSTRAINT "CourseClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CourseClick" ADD CONSTRAINT "CourseClick_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CourseRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileBadge" ADD CONSTRAINT "ProfileBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
