import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { subDays } from "date-fns";
import { z } from "zod";

const querySchema = z.object({
  days: z.enum(["7", "30", "90"]).transform((v) => parseInt(v, 10)),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { days } = parsed.data;
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const start = subDays(end, days);
  start.setUTCHours(0, 0, 0, 0);

  const snapshots = await prisma.mentorshipAnalyticsSnapshot.findMany({
    where: { snapshotDate: { gte: start, lte: end } },
    orderBy: { snapshotDate: "asc" },
  });

  return NextResponse.json(
    snapshots.map((s) => ({
      ...s,
      snapshotDate: s.snapshotDate.toISOString(),
      createdAt: s.createdAt.toISOString(),
      mentorsByTier: s.mentorsByTier as Record<string, number>,
    }))
  );
}
