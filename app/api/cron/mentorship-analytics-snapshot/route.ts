/**
 * GET /api/cron/mentorship-analytics-snapshot
 * Daily 01:00 IST. CRON_SECRET protected.
 * 1. computePlatformSnapshot()
 * 2. computeAllMentorSnapshots() (batched)
 * 3. Log to MentorshipAuditLog (SYSTEM, ANALYTICS_SNAPSHOT_COMPUTED)
 * 4. Emit M17_SNAPSHOT_COMPUTED
 */
import { NextResponse } from "next/server";
import {
  computePlatformSnapshot,
  computeAllMentorSnapshots,
} from "@/lib/mentorship/analytics";
import { logMentorshipAction } from "@/lib/mentorship/audit";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const systemActorId = process.env.M16_SYSTEM_ACTOR_ID;
  const snapshotDate = new Date();
  snapshotDate.setUTCHours(0, 0, 0, 0);

  await computePlatformSnapshot(snapshotDate);

  const mentorsProcessed = await computeAllMentorSnapshots(
    snapshotDate,
    (mentorId, outcomeRate, disputeRate) => {
      trackOutcome(systemActorId ?? mentorId, "M17_MENTOR_SNAPSHOT_COMPUTED", {
        entityId: mentorId,
        entityType: "MentorAnalyticsSnapshot",
        metadata: { outcomeRate, disputeRate },
      });
    }
  );

  const latest = await prisma.mentorshipAnalyticsSnapshot.findUnique({
    where: { snapshotDate },
    select: {
      activeEngagements: true,
      outcomeVerificationRate: true,
    },
  });

  if (systemActorId) {
    await logMentorshipAction({
      actorId: systemActorId,
      action: "ANALYTICS_SNAPSHOT_COMPUTED",
      category: "SYSTEM",
      entityType: "Cron",
      entityId: "mentorship-analytics-snapshot",
      newState: {
        snapshotDate: snapshotDate.toISOString(),
        mentorsProcessed,
        activeEngagements: latest?.activeEngagements,
        outcomeVerificationRate: latest?.outcomeVerificationRate,
      },
    });
  }

  if (systemActorId) {
    trackOutcome(systemActorId, "M17_SNAPSHOT_COMPUTED", {
      entityType: "MentorshipAnalyticsSnapshot",
      metadata: {
        snapshotDate: snapshotDate.toISOString(),
        activeEngagements: latest?.activeEngagements,
        outcomeVerificationRate: latest?.outcomeVerificationRate,
      },
    });
  }

  return NextResponse.json({
    mentorsProcessed,
    snapshotDate: snapshotDate.toISOString(),
  });
}
