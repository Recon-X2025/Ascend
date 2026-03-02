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
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ success: false, error: "Not a mentor" }, { status: 403 });
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
  const start = subDays(end, days);

  const snapshots = await prisma.mentorAnalyticsSnapshot.findMany({
    where: {
      mentorId: session.user.id,
      snapshotDate: { gte: start, lte: end },
    },
    orderBy: { snapshotDate: "asc" },
  });

  return NextResponse.json(
    snapshots.map((s) => ({
      ...s,
      snapshotDate: s.snapshotDate.toISOString(),
      createdAt: s.createdAt.toISOString(),
    }))
  );
}
