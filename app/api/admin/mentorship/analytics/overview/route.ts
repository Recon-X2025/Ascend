import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays } from "date-fns";
import { trackOutcome } from "@/lib/tracking/outcomes";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const day7 = subDays(today, 7);
  const day30 = subDays(today, 30);

  const [latest, snapshot7d, snapshot30d] = await Promise.all([
    prisma.mentorshipAnalyticsSnapshot.findFirst({
      where: { snapshotDate: { lte: now } },
      orderBy: { snapshotDate: "desc" },
    }),
    prisma.mentorshipAnalyticsSnapshot.findFirst({
      where: { snapshotDate: { lte: day7 } },
      orderBy: { snapshotDate: "desc" },
    }),
    prisma.mentorshipAnalyticsSnapshot.findFirst({
      where: { snapshotDate: { lte: day30 } },
      orderBy: { snapshotDate: "desc" },
    }),
  ]);

  if (!latest) {
    return NextResponse.json({
      snapshot: null,
      delta7d: null,
      delta30d: null,
    });
  }

  const delta = (curr: number, prev: number | undefined) =>
    prev !== undefined ? curr - prev : null;

  const delta7d = snapshot7d
    ? {
        activeEngagements: delta(latest.activeEngagements, snapshot7d.activeEngagements),
        outcomeVerificationRate:
          snapshot7d.outcomeVerificationRate != null
            ? (latest.outcomeVerificationRate - snapshot7d.outcomeVerificationRate)
            : null,
        avgTimeToOutcomeDays:
          snapshot7d.avgTimeToOutcomeDays != null
            ? latest.avgTimeToOutcomeDays - snapshot7d.avgTimeToOutcomeDays
            : null,
        avgDisputeRate:
          snapshot7d.avgDisputeRate != null
            ? latest.avgDisputeRate - snapshot7d.avgDisputeRate
            : null,
        sessionsCompletedThisWeek: delta(
          latest.sessionsCompletedThisWeek,
          snapshot7d.sessionsCompletedThisWeek
        ),
        milestonesCompletedRate:
          snapshot7d.milestonesCompletedRate != null
            ? latest.milestonesCompletedRate - snapshot7d.milestonesCompletedRate
            : null,
      }
    : null;

  const delta30d = snapshot30d
    ? {
        activeEngagements: delta(latest.activeEngagements, snapshot30d.activeEngagements),
        outcomeVerificationRate:
          snapshot30d.outcomeVerificationRate != null
            ? latest.outcomeVerificationRate - snapshot30d.outcomeVerificationRate
            : null,
        avgTimeToOutcomeDays:
          snapshot30d.avgTimeToOutcomeDays != null
            ? latest.avgTimeToOutcomeDays - snapshot30d.avgTimeToOutcomeDays
            : null,
        avgDisputeRate:
          snapshot30d.avgDisputeRate != null
            ? latest.avgDisputeRate - snapshot30d.avgDisputeRate
            : null,
        sessionsCompletedThisWeek: delta(
          latest.sessionsCompletedThisWeek,
          snapshot30d.sessionsCompletedThisWeek
        ),
        milestonesCompletedRate:
          snapshot30d.milestonesCompletedRate != null
            ? latest.milestonesCompletedRate - snapshot30d.milestonesCompletedRate
            : null,
      }
    : null;

  if (session.user.id && Math.random() < 0.1) {
    trackOutcome(session.user.id, "M17_PLATFORM_ANALYTICS_VIEWED", {
      entityType: "admin_analytics",
      metadata: { view: "overview" },
    });
  }

  return NextResponse.json({
    snapshot: {
      ...latest,
      snapshotDate: latest.snapshotDate.toISOString(),
      createdAt: latest.createdAt.toISOString(),
    },
    delta7d,
    delta30d,
  });
}
