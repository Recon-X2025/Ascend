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

  const referralCodes = await prisma.referralCode.findMany({
    orderBy: { conversions: "desc" },
    take: 10,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const topReferrers = referralCodes.map((rc) => ({
    userId: rc.userId,
    name: rc.user.name,
    email: rc.user.email,
    code: rc.code,
    clicks: rc.clicks,
    signups: rc.signups,
    conversions: rc.conversions,
  }));

  return NextResponse.json({ topReferrers });
}
