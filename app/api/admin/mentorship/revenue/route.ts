/**
 * GET /api/admin/mentorship/revenue
 * PLATFORM_ADMIN only. Revenue summary for date range.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getRevenueSummary } from "@/lib/escrow/revenue";
import { z } from "zod";

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );
  const fromStr = parsed.success ? parsed.data.from : undefined;
  const toStr = parsed.success ? parsed.data.to : undefined;

  const now = new Date();
  const to = toStr ? new Date(toStr + "T12:00:00Z") : now;
  const from = fromStr ? new Date(fromStr + "T12:00:00Z") : (() => {
    const d = new Date(to);
    d.setDate(d.getDate() - 30);
    return d;
  })();

  const summary = await getRevenueSummary(from, to);

  return NextResponse.json({
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    totalReleasedPaise: summary.totalReleasedPaise,
    totalReleasedRupees: (summary.totalReleasedPaise / 100).toFixed(2),
    platformFeePaise: summary.platformFeePaise,
    platformFeeRupees: (summary.platformFeePaise / 100).toFixed(2),
    mentorPayoutPaise: summary.mentorPayoutPaise,
    mentorPayoutRupees: (summary.mentorPayoutPaise / 100).toFixed(2),
    pilotWaivedPaise: summary.pilotWaivedPaise,
    tranchesReleased: summary.tranchesReleased,
    byTier: summary.byTier,
    byPaymentMode: summary.byPaymentMode,
  });
}
