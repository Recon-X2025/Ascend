/**
 * GET /api/admin/mentorship/revenue/snapshots
 * PLATFORM_ADMIN only. Daily revenue snapshots for charts.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const querySchema = z.object({
  days: z.enum(["7", "30", "90"]).optional().default("30"),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );
  const days = parsed.success ? parseInt(parsed.data.days, 10) : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const snapshots = await prisma.mentorshipRevenueSnapshot.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "asc" },
    select: {
      date: true,
      totalReleasedPaise: true,
      platformFeePaise: true,
      mentorPayoutPaise: true,
      pilotWaivedPaise: true,
      tranchesReleased: true,
    },
  });

  return NextResponse.json(
    snapshots.map((s) => ({
      date: s.date.toISOString().slice(0, 10),
      totalReleasedPaise: s.totalReleasedPaise,
      platformFeePaise: s.platformFeePaise,
      mentorPayoutPaise: s.mentorPayoutPaise,
      pilotWaivedPaise: s.pilotWaivedPaise,
      tranchesReleased: s.tranchesReleased,
    }))
  );
}
