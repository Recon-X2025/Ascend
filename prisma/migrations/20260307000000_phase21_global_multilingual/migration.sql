-- Phase 21: Global Multilingual & Market Expansion
-- AlterTable: User preferences (language, currency, region)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredCurrency" TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredRegion" TEXT;

-- CreateTable: ParsedJDTranslation
CREATE TABLE IF NOT EXISTS "ParsedJDTranslation" (
    "id" TEXT NOT NULL,
    "parsedJdId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "responsibilities" TEXT[] NOT NULL,
    "skills" JSONB NOT NULL,
    "keywords" TEXT[] NOT NULL,
    "translatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promptVersion" TEXT NOT NULL,

    CONSTRAINT "ParsedJDTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ParsedJDTranslation_parsedJdId_language_key" ON "ParsedJDTranslation"("parsedJdId", "language");
CREATE INDEX IF NOT EXISTS "ParsedJDTranslation_parsedJdId_idx" ON "ParsedJDTranslation"("parsedJdId");
CREATE INDEX IF NOT EXISTS "ParsedJDTranslation_language_idx" ON "ParsedJDTranslation"("language");

ALTER TABLE "ParsedJDTranslation" DROP CONSTRAINT IF EXISTS "ParsedJDTranslation_parsedJdId_fkey";
ALTER TABLE "ParsedJDTranslation" ADD CONSTRAINT "ParsedJDTranslation_parsedJdId_fkey" FOREIGN KEY ("parsedJdId") REFERENCES "ParsedJD"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: SupportedLanguage
CREATE TABLE IF NOT EXISTS "SupportedLanguage" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'ltr',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "launchDate" TIMESTAMP(3),

    CONSTRAINT "SupportedLanguage_pkey" PRIMARY KEY ("code")
);

-- Enum: OutcomeEventType (Phase 21 events) — run once; duplicate ADD VALUE in same tx can error
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE21_LANGUAGE_CHANGED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE21_CURRENCY_CHANGED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE21_JD_TRANSLATED';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE21_RESUME_GENERATED_LANG';
ALTER TYPE "OutcomeEventType" ADD VALUE 'PHASE21_PWA_INSTALLED';
