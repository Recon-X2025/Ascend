/**
 * Phase 12: Idempotent migration — SEEKER_PREMIUM/SEEKER_ELITE → SEEKER_PAID in UserSubscription.
 * Maps plan to planKey for backward compat.
 * Run: npx tsx scripts/migrate-legacy-plans.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.userSubscription.updateMany({
    where: {
      plan: { in: ["SEEKER_PREMIUM", "SEEKER_ELITE"] },
      OR: [{ planKey: null }, { planKey: "" }],
    },
    data: { planKey: "SEEKER_PAID" },
  });

  const mentorUpdated = await prisma.userSubscription.updateMany({
    where: {
      plan: "MENTOR_MARKETPLACE",
      OR: [{ planKey: null }, { planKey: "" }],
    },
    data: { planKey: "MENTOR_MARKETPLACE" },
  });

  console.log(`Migrated ${updated.count} seeker plans to SEEKER_PAID`);
  console.log(`Migrated ${mentorUpdated.count} mentor plans to MENTOR_MARKETPLACE`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
