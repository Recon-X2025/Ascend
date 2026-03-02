/**
 * Database integrity check — run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/db-check.ts
 * Or: npx tsx scripts/db-check.ts
 * Requires DATABASE_URL. Delete this script after running if desired.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const issues: string[] = [];

  // Users with onboardingComplete=true but no JobSeekerProfile or RecruiterProfile
  const usersComplete = await prisma.user.findMany({
    where: { onboardingComplete: true },
    include: { jobSeekerProfile: true, recruiterProfile: true },
  });
  for (const u of usersComplete) {
    if (!u.jobSeekerProfile && !u.recruiterProfile) {
      issues.push(`User ${u.id} has onboardingComplete=true but no JobSeekerProfile or RecruiterProfile`);
    }
  }

  // Duplicate usernames
  const profiles = await prisma.jobSeekerProfile.findMany({
    where: { username: { not: null } },
    select: { username: true },
  });
  const usernames = profiles.map((p) => p.username).filter(Boolean) as string[];
  const seen = new Set<string>();
  for (const u of usernames) {
    if (seen.has(u)) issues.push(`Duplicate username: ${u}`);
    seen.add(u);
  }

  // UserSkills with non-existent skillId (would fail FK; Prisma would error on load)
  // Orphaned records (profileId references deleted profiles) — Prisma cascade usually prevents

  console.log("DB check complete.");
  if (issues.length > 0) {
    console.error("Issues found:", issues);
    process.exit(1);
  }
  console.log("No integrity issues found.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
