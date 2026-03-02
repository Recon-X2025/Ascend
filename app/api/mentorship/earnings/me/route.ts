import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

/**
 * GET /api/mentorship/earnings/me
 * Mentor only. Returns earnings from released tranches.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const released = await prisma.escrowTranche.findMany({
    where: {
      escrow: { mentorId: session.user.id },
      status: "RELEASED",
    },
    select: { amountPaise: true, mentorNetPaise: true, releasedAt: true, trancheNumber: true },
  });

  const totalPaise = released.reduce(
    (s, t) => s + (t.mentorNetPaise > 0 ? t.mentorNetPaise : t.amountPaise),
    0
  );

  return NextResponse.json({
    totalPaise,
    totalRupees: (totalPaise / 100).toFixed(2),
    releasedCount: released.length,
    recentReleases: released
      .sort((a, b) => (b.releasedAt?.getTime() ?? 0) - (a.releasedAt?.getTime() ?? 0))
      .slice(0, 5)
      .map((t) => ({
        amountPaise: t.mentorNetPaise > 0 ? t.mentorNetPaise : t.amountPaise,
        releasedAt: t.releasedAt?.toISOString() ?? null,
        trancheNumber: t.trancheNumber,
      })),
  });
}
