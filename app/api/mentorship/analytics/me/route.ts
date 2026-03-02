import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays } from "date-fns";
import { trackOutcome } from "@/lib/tracking/outcomes";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Not a mentor" }, { status: 403 });
  }

  const now = new Date();
  const day30 = subDays(now, 30);

  const [latest, snapshot30d] = await Promise.all([
    prisma.mentorAnalyticsSnapshot.findFirst({
      where: { mentorId: session.user.id },
      orderBy: { snapshotDate: "desc" },
    }),
    prisma.mentorAnalyticsSnapshot.findFirst({
      where: { mentorId: session.user.id, snapshotDate: { lte: day30 } },
      orderBy: { snapshotDate: "desc" },
    }),
  ]);

  trackOutcome(session.user.id, "M17_MENTOR_ANALYTICS_VIEWED", {
    entityType: "mentor_analytics",
    metadata: { view: "me" },
  });

  const trend30d =
    latest && snapshot30d
      ? {
          acceptanceRate: latest.acceptanceRate - snapshot30d.acceptanceRate,
          completionRate: latest.completionRate - snapshot30d.completionRate,
          outcomeRate: latest.outcomeRate - snapshot30d.outcomeRate,
          disputeRate: latest.disputeRate - snapshot30d.disputeRate,
        }
      : null;

  return NextResponse.json({
    snapshot: latest
      ? {
          ...latest,
          snapshotDate: latest.snapshotDate.toISOString(),
          createdAt: latest.createdAt.toISOString(),
        }
      : null,
    trend30d,
  });
}
