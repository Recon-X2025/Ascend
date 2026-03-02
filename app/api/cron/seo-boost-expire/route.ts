/**
 * GET /api/cron/seo-boost-expire
 * Daily 00:00 IST = 30 18 * * * (18:30 UTC = 00:00 IST next day)
 * Expires ended SEO boosts. Sweeps expired mentor subscriptions → canChargeMentees=false, void PENDING_PAYMENT escrows.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { expireEndedBoosts } from "@/lib/mentorship/seo-boost";
import { voidEscrow } from "@/lib/escrow";
import { logAudit } from "@/lib/audit/log";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const expiredCount = await expireEndedBoosts();

  // M-13: Sweep expired mentor subscriptions → canChargeMentees=false, void PENDING_PAYMENT escrows
  const now = new Date();
  const expiredSubs = await prisma.userSubscription.findMany({
    where: {
      planKey: "MENTOR_MARKETPLACE",
      status: "ACTIVE",
      expiresAt: { lt: now },
    },
    select: { userId: true, id: true },
  });
  if (expiredSubs.length > 0) {
    await prisma.userSubscription.updateMany({
      where: { id: { in: expiredSubs.map((s) => s.id) } },
      data: { status: "EXPIRED" },
    });
  }
  let revokedCount = 0;
  for (const sub of expiredSubs) {
    const profile = await prisma.mentorProfile.findUnique({
      where: { userId: sub.userId },
      select: { id: true, canChargeMentees: true },
    });
    if (profile?.canChargeMentees) {
      await prisma.mentorProfile.update({
        where: { id: profile.id },
        data: { canChargeMentees: false },
      });
      revokedCount++;
    }
    const pendingEscrows = await prisma.mentorshipEscrow.findMany({
      where: { mentorId: sub.userId, status: "PENDING_PAYMENT" },
      select: { contractId: true },
    });
    for (const e of pendingEscrows) {
      try {
        await voidEscrow(e.contractId);
      } catch (err) {
        console.error("[cron/seo-boost-expire] voidEscrow failed:", e.contractId, err);
      }
    }
  }

  await logAudit({
    category: "SYSTEM",
    action: "CRON_SEO_BOOST_EXPIRE",
    targetType: "Cron",
    targetId: "seo-boost-expire",
    metadata: { expiredCount, revokedMentors: revokedCount },
  });

  return NextResponse.json({
    ok: true,
    expiredCount,
    revokedMentors: revokedCount,
  });
}
