import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const querySchema = z.object({
  page: z.string().optional().default("0").transform((v) => Math.max(0, parseInt(v, 10))),
  limit: z.string().optional().default("20").transform((v) => Math.min(50, Math.max(1, parseInt(v, 10)))),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
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

  const { page, limit } = parsed.data;

  const mentorIdsWithEngagement = await prisma.mentorshipContract.findMany({
    select: { mentorUserId: true },
    distinct: ["mentorUserId"],
  });
  const mentorUserIds = Array.from(new Set(mentorIdsWithEngagement.map((c) => c.mentorUserId)));
  const total = mentorUserIds.length;
  const slice = mentorUserIds.slice(page * limit, page * limit + limit);

  const snapshots = await prisma.mentorAnalyticsSnapshot.findMany({
    where: { mentorId: { in: slice } },
    orderBy: { snapshotDate: "desc" },
    include: {
      mentor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  const latestByMentorId = new Map<string, (typeof snapshots)[0]>();
  for (const s of snapshots) {
    if (!latestByMentorId.has(s.mentorId)) latestByMentorId.set(s.mentorId, s);
  }

  const missingMentorIds = slice.filter((id) => !latestByMentorId.has(id));
  const users =
    missingMentorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: missingMentorIds } },
          select: { id: true, name: true, email: true, image: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const list = slice.map((mentorId) => {
    const row = latestByMentorId.get(mentorId);
    if (!row) {
      const mentor = userMap.get(mentorId) ?? { id: mentorId, name: null, email: null, image: null };
      return { mentorId, mentor, snapshot: null };
    }
    const { mentor, ...snap } = row;
    return {
      mentorId,
      mentor,
      snapshot: {
        ...snap,
        snapshotDate: snap.snapshotDate.toISOString(),
        createdAt: snap.createdAt.toISOString(),
      },
    };
  });

  return NextResponse.json({
    items: list,
    total,
    page,
    limit,
  });
}
