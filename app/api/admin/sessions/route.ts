/**
 * M-7: Admin list sessions.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { SessionStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") as SessionStatus | null;
  const contractId = searchParams.get("contractId");
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where: Record<string, unknown> = {};
  if (statusParam) where.status = statusParam;
  if (contractId) where.contractId = contractId;

  const sessions = await prisma.engagementSession.findMany({
    where,
    include: {
      contract: {
        include: {
          mentor: { select: { id: true, name: true, email: true } },
          mentee: { select: { id: true, name: true, email: true } },
        },
      },
      sessionRoom: { select: { dailyRoomName: true, dailyRoomUrl: true } },
      sessionRecord: { select: { s3Key: true, sha256Hash: true } },
    },
    orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
    skip: page * limit,
    take: limit + 1,
  });

  const hasMore = sessions.length > limit;
  const items = sessions.slice(0, limit);

  return NextResponse.json({
    data: items.map((s) => ({
      id: s.id,
      contractId: s.contractId,
      sessionNumber: s.sessionNumber,
      status: s.status,
      scheduledAt: s.scheduledAt?.toISOString(),
      completedAt: s.completedAt?.toISOString(),
      slotDurationMins: s.slotDurationMins,
      effectiveDurationMins: s.effectiveDurationMins,
      stenoStatus: s.stenoStatus,
      mentorName: s.contract.mentor.name ?? s.contract.mentor.email,
      menteeName: s.contract.mentee.name ?? s.contract.mentee.email,
      hasRoom: !!s.sessionRoom,
      hasRecord: !!s.sessionRecord,
    })),
    hasMore,
  });
}
