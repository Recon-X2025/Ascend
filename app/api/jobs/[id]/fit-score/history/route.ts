import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ history: [] });
    }
    const jobId = parseId((await params).id);
    if (jobId == null) {
      return NextResponse.json({ history: [] });
    }

    const history = await prisma.fitScoreHistory.findMany({
      where: { userId: session.user.id, jobPostId: jobId },
      orderBy: { recordedAt: "desc" },
      take: 5,
      select: { overallScore: true, recordedAt: true },
    });

    return NextResponse.json({
      history: history.map((h) => ({
        overallScore: h.overallScore,
        recordedAt: h.recordedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ history: [] });
  }
}
