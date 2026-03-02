import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { createSubscription } from "@/lib/payments";
import type { Currency } from "@/lib/payments/types";
import type { PlanType } from "@prisma/client";
import { z } from "zod";

const bodySchema = z.object({
  plan: z.enum([
    "SEEKER_PREMIUM",
    "SEEKER_ELITE",
    "RECRUITER_STARTER",
    "RECRUITER_PRO",
    "RECRUITER_ENTERPRISE",
  ]),
  currency: z.enum(["INR", "USD"]),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
  companyId: z.string().optional(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { plan, currency, billingCycle = "monthly", companyId } = parsed.data;

  if (plan === "RECRUITER_ENTERPRISE") {
    return NextResponse.json(
      { error: "Enterprise plan — please contact sales", contactSales: true },
      { status: 400 }
    );
  }

  const gateway = currency === "INR" ? "razorpay" : "stripe";
  const planKey =
    currency === "INR"
      ? `RAZORPAY_PLAN_${plan}_${billingCycle.toUpperCase()}`
      : `STRIPE_PRICE_${plan}_${billingCycle.toUpperCase()}`;
  const planId = process.env[planKey];
  if (!planId) {
    return NextResponse.json({ error: "Plan not configured" }, { status: 500 });
  }

  const totalCount = billingCycle === "yearly" ? 12 : undefined;

  const result = await createSubscription({
    planId,
    totalCount: totalCount ?? (currency === "INR" ? 12 : undefined),
    currency: currency as Currency,
  });

  if (plan.startsWith("RECRUITER_") && companyId) {
    await prisma.companySubscription.upsert({
      where: { companyId },
      create: {
        companyId,
        plan: plan as PlanType,
        gateway: currency === "INR" ? "RAZORPAY" : "STRIPE",
        gatewaySubId: result.subscriptionId,
        gatewayCustomerId: result.customerId,
        status: "ACTIVE",
      },
      update: {
        gatewaySubId: result.subscriptionId,
        gatewayCustomerId: result.customerId,
        plan: plan as PlanType,
      },
    });
  } else {
    await prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: plan as PlanType,
        gateway: currency === "INR" ? "RAZORPAY" : "STRIPE",
        gatewaySubId: result.subscriptionId,
        gatewayCustomerId: result.customerId,
        status: "ACTIVE",
      },
      update: {
        gatewaySubId: result.subscriptionId,
        gatewayCustomerId: result.customerId,
        plan: plan as PlanType,
      },
    });
  }

  return NextResponse.json({
    subscriptionId: result.subscriptionId,
    customerId: result.customerId,
    gateway: result.gateway,
    key:
      gateway === "razorpay"
        ? process.env.RAZORPAY_KEY_ID
        : process.env.STRIPE_PUBLISHABLE_KEY,
  });
}
