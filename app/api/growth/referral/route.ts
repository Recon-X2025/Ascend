import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { generateReferralCode } from "@/lib/growth/referral";
import { prisma } from "@/lib/prisma/client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://ascend.careers";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let referralCode = await prisma.referralCode.findUnique({
    where: { userId: session.user.id },
    select: { code: true, clicks: true, signups: true, conversions: true },
  });

  if (!referralCode) {
    try {
      await generateReferralCode(session.user.id);
      referralCode = await prisma.referralCode.findUnique({
        where: { userId: session.user.id },
        select: { code: true, clicks: true, signups: true, conversions: true },
      });
    } catch (e) {
      console.error("[growth/referral] generateReferralCode failed:", e);
      return NextResponse.json({ error: "Failed to generate referral code" }, { status: 500 });
    }
  }

  if (!referralCode) {
    return NextResponse.json({ error: "Failed to load referral code" }, { status: 500 });
  }

  const rewardsPending = await prisma.referral.count({
    where: {
      referrerId: session.user.id,
      status: "CONVERTED",
      rewardGranted: true,
    },
  });

  const base = BASE_URL.replace(/\/$/, "");
  const referralUrl = `${base}/join?ref=${referralCode.code}`;

  return NextResponse.json({
    code: referralCode.code,
    referralUrl,
    clicks: referralCode.clicks,
    signups: referralCode.signups,
    conversions: referralCode.conversions,
    rewardsPending,
  });
}
