import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logAudit } from "@/lib/audit/log";
import { recalculateDisputeRate, recalculateMentorTier } from "@/lib/mentorship/tiers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 50;
const DELAY_MS = 100;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * GET /api/cron/recalculate-mentor-tiers
 * Run weekly (Sunday 02:00 IST). CRON_SECRET. Recalculates dispute rate and tier for all discoverable mentors.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mentors = await prisma.mentorProfile.findMany({
    where: { isDiscoverable: true },
    select: { userId: true, tier: true },
  });

  let tiersChanged = 0;
  let demotions = 0;
  let promotions = 0;

  for (let i = 0; i < mentors.length; i += BATCH_SIZE) {
    const batch = mentors.slice(i, i + BATCH_SIZE);
    for (const m of batch) {
      const beforeTier = m.tier;
      await recalculateDisputeRate(m.userId);
      await recalculateMentorTier(m.userId, "WEEKLY_CALC");
      const after = await prisma.mentorProfile.findUnique({
        where: { userId: m.userId },
        select: { tier: true },
      });
      if (after && after.tier !== beforeTier) {
        tiersChanged += 1;
        const order = { RISING: 0, ESTABLISHED: 1, ELITE: 2 };
        if (order[after.tier] > order[beforeTier]) promotions += 1;
        else demotions += 1;
      }
    }
    if (i + BATCH_SIZE < mentors.length) {
      await delay(DELAY_MS);
    }
  }

  await logAudit({
    category: "SYSTEM",
    action: "CRON_RECALCULATE_MENTOR_TIERS",
    targetType: "Cron",
    targetId: "recalculate-mentor-tiers",
    metadata: {
      mentorsProcessed: mentors.length,
      tiersChanged,
      promotions,
      demotions,
    },
  });

  return NextResponse.json({
    ok: true,
    mentorsProcessed: mentors.length,
    tiersChanged,
    promotions,
    demotions,
  });
}
