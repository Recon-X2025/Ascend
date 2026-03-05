-- BL-14: Verified Career Certificates
CREATE TABLE "MentorCertificate" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorCertificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MentorCertificate_contractId_key" ON "MentorCertificate"("contractId");
CREATE UNIQUE INDEX "MentorCertificate_outcomeId_key" ON "MentorCertificate"("outcomeId");
CREATE UNIQUE INDEX "MentorCertificate_verificationCode_key" ON "MentorCertificate"("verificationCode");
CREATE INDEX "MentorCertificate_verificationCode_idx" ON "MentorCertificate"("verificationCode");
CREATE INDEX "MentorCertificate_menteeId_idx" ON "MentorCertificate"("menteeId");

ALTER TABLE "MentorCertificate" ADD CONSTRAINT "MentorCertificate_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MentorshipContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorCertificate" ADD CONSTRAINT "MentorCertificate_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "MentorshipOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorCertificate" ADD CONSTRAINT "MentorCertificate_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
