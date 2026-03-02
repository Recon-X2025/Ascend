-- Replace partial unique index with full unique constraint so upsert ON CONFLICT works.
-- PostgreSQL UNIQUE allows multiple NULLs, so company-type rows (industryLocation = null) remain valid.
DROP INDEX IF EXISTS "CompanyInsight_industryLocation_key";
ALTER TABLE "CompanyInsight" ADD CONSTRAINT "CompanyInsight_industryLocation_key" UNIQUE ("industryLocation");
