-- BL-1: ProfileViewEvent model for richer profile view notifications
-- CreateTable
CREATE TABLE "ProfileViewEvent" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewerCompanyId" TEXT,
    "viewerCompanyName" TEXT,
    "viewerRole" TEXT,
    "profileUserId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileViewEvent_profileUserId_viewedAt_idx" ON "ProfileViewEvent"("profileUserId", "viewedAt");

-- CreateIndex
CREATE INDEX "ProfileViewEvent_viewerId_viewedAt_idx" ON "ProfileViewEvent"("viewerId", "viewedAt");

-- AddForeignKey
ALTER TABLE "ProfileViewEvent" ADD CONSTRAINT "ProfileViewEvent_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileViewEvent" ADD CONSTRAINT "ProfileViewEvent_profileUserId_fkey" FOREIGN KEY ("profileUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
