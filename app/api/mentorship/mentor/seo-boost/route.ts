/**
 * POST /api/mentorship/mentor/seo-boost
 * Mentor only. Initiates SEO boost purchase — returns Razorpay order for client checkout.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { createOrder } from "@/lib/payments";
import { MENTOR_MARKETPLACE_PLAN } from "@/lib/payments/plans";
import { z } from "zod";

const bodySchema = z.object({
  boostType: z.enum(["MONTHLY_RECURRING", "ONE_TIME_30_DAYS", "ONE_TIME_14_DAYS"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Mentor profile required" }, { status: 403 });
  }

  const plan = await prisma.userSubscription.findUnique({
    where: { userId: session.user.id },
  });
  const isMarketplace =
    plan?.planKey === "MENTOR_MARKETPLACE" ||
    String(plan?.plan) === "MENTOR_MARKETPLACE";
  if (!isMarketplace || !MENTOR_MARKETPLACE_PLAN.seoBoostEligible) {
    return NextResponse.json(
      { error: "Mentor Marketplace plan required for SEO boost" },
      { status: 403 }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: e }, { status: 400 });
  }

  const pricing = MENTOR_MARKETPLACE_PLAN.seoBoostPricing;
  const pricePaise = pricing[body.boostType as keyof typeof pricing];
  if (pricePaise == null) {
    return NextResponse.json({ error: "Invalid boost type" }, { status: 400 });
  }

  const orderResult = await createOrder({
    amount: pricePaise,
    currency: "INR",
    receipt: `seo_boost_${profile.id}_${Date.now()}`,
    notes: {
      type: "seo_boost",
      userId: session.user.id,
      mentorProfileId: profile.id,
      boostType: body.boostType,
      pricePaise: String(pricePaise),
    },
  });

  return NextResponse.json({
    orderId: orderResult.orderId,
    amount: orderResult.amount,
    currency: orderResult.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
