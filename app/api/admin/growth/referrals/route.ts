import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const [totalCodes, aggregate] = await Promise.all([
    prisma.referralCode.count(),
    prisma.referralCode.aggregate({
      _sum: { clicks: true, signups: true, conversions: true },
    }),
  ]);

  return NextResponse.json({
    totalReferralCodes: totalCodes,
    totalClicks: aggregate._sum.clicks ?? 0,
    totalSignups: aggregate._sum.signups ?? 0,
    totalConversions: aggregate._sum.conversions ?? 0,
  });
}
