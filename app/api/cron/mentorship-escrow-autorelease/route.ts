import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { releaseTranche } from "@/lib/escrow";

/**
 * GET /api/cron/mentorship-escrow-autorelease
 * CRON_SECRET. Finds PENDING_RELEASE tranches where autoReleaseAt <= now, releases each.
 * Schedule: 09:00 IST (03:30 UTC).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tranches = await prisma.escrowTranche.findMany({
    where: {
      status: "PENDING_RELEASE",
      autoReleaseAt: { lte: now },
    },
    select: { id: true },
  });

  let released = 0;
  for (const t of tranches) {
    try {
      await releaseTranche(t.id, "SYSTEM", "AUTO_RELEASE");
      released++;
    } catch (e) {
      console.error("[mentorship-escrow-autorelease] release failed:", t.id, e);
    }
  }

  return NextResponse.json({
    tranchesFound: tranches.length,
    released,
  });
}
