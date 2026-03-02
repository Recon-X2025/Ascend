/**
 * GET /api/cron/mentorship-revenue-snapshot
 * Daily 20:30 UTC (02:00 IST). CRON_SECRET protected.
 * Computes yesterday's revenue snapshot. Emits M14_REVENUE_SNAPSHOT_COMPUTED.
 */
import { NextResponse } from "next/server";
import { subDays } from "date-fns";
import { computeDailyRevenueSnapshot } from "@/lib/escrow/revenue";
import { trackOutcome } from "@/lib/tracking/outcomes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yesterday = subDays(new Date(), 1);

  await computeDailyRevenueSnapshot(yesterday);

  const systemActorId = process.env.M16_SYSTEM_ACTOR_ID;
  if (systemActorId) {
    trackOutcome(systemActorId, "M14_REVENUE_SNAPSHOT_COMPUTED", {
      entityType: "MentorshipRevenueSnapshot",
      metadata: {
        date: yesterday.toISOString().slice(0, 10),
      },
    });
  }

  return NextResponse.json({
    success: true,
    date: yesterday.toISOString().slice(0, 10),
  });
}
