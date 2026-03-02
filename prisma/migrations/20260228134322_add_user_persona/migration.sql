-- CreateEnum
CREATE TYPE "UserPersona" AS ENUM ('ACTIVE_SEEKER', 'PASSIVE_SEEKER', 'EARLY_CAREER', 'RECRUITER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "persona" "UserPersona",
ADD COLUMN     "personaSetAt" TIMESTAMP(3);
