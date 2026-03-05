-- M-9: User.canFileDisputes (false after 2 rejected disputes)
ALTER TABLE "User" ADD COLUMN "canFileDisputes" BOOLEAN NOT NULL DEFAULT true;
