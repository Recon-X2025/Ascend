import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { createOrder } from "@/lib/payments";
import type { Currency } from "@/lib/payments/types";
import { BOOST_PRICE_PAISE, RESUME_UNLOCK_PACK_PRICE_PAISE, RESUME_OPTIMISATION_CREDIT_PRICE_PAISE } from "@/lib/payments/pricing";
import { MENTOR_MARKETPLACE_PLAN } from "@/lib/payments/plans";
import { z } from "zod";

const bodySchema = z.object({
  type: z.enum(["boost", "resume_unlock", "resume_credit", "mentor_subscription"]),
  jobPostId: z.number().int().positive().optional(),
  boostType: z.enum(["standard", "featured", "urgent"]).optional(),
  weeks: z.number().int().min(1).max(52).optional(),
  billingPeriod: z.enum(["monthly", "annual"]).optional(),
  currency: z.enum(["INR", "USD"]).optional(),
  seekerId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const { type, jobPostId, boostType, weeks = 1, billingPeriod = "monthly", currency = "INR", seekerId } = parsed.data;

  if (type === "boost") {
    if (!jobPostId || !boostType) {
      return NextResponse.json({ error: "jobPostId and boostType required for boost" }, { status: 400 });
    }
    const job = await prisma.jobPost.findUnique({
      where: { id: jobPostId },
      select: { companyId: true },
    });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const { canManageJob } = await import("@/lib/jobs/permissions");
    if (!(await canManageJob(userId, jobPostId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const companyId = job.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Job must be linked to a company to boost" }, { status: 400 });
    }

    const base = BOOST_PRICE_PAISE[boostType];
    const urgentAdd = boostType === "urgent" ? 0 : 0;
    const amount = (base + urgentAdd) * weeks;

    const result = await createOrder({
      amount,
      currency: currency as Currency,
      receipt: `boost-${jobPostId}-${boostType}-${weeks}`,
      notes: { type: "boost", jobPostId: String(jobPostId), boostType, weeks: String(weeks), companyId },
    });

    return NextResponse.json({
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      gateway: result.gateway,
      key: process.env.RAZORPAY_KEY_ID ?? undefined,
      metadata: { type: "boost", jobPostId, boostType, weeks, companyId },
    });
  }

  if (type === "resume_credit") {
    const amount = RESUME_OPTIMISATION_CREDIT_PRICE_PAISE;
    const result = await createOrder({
      amount,
      currency: currency as Currency,
      receipt: `resume-credit-${userId}-${Date.now()}`,
      notes: { type: "resume_credit", userId },
    });
    return NextResponse.json({
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      gateway: result.gateway,
      key: process.env.RAZORPAY_KEY_ID ?? undefined,
      metadata: { type: "resume_credit", userId },
    });
  }

  if (type === "mentor_subscription") {
    const amount =
      billingPeriod === "annual"
        ? MENTOR_MARKETPLACE_PLAN.annualPricePaise
        : MENTOR_MARKETPLACE_PLAN.monthlyPricePaise;
    const result = await createOrder({
      amount,
      currency: currency as Currency,
      receipt: `mentor-sub-${userId}-${billingPeriod}-${Date.now()}`,
      notes: { type: "mentor_subscription", userId, billingPeriod },
    });
    return NextResponse.json({
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      gateway: result.gateway,
      key: process.env.RAZORPAY_KEY_ID ?? undefined,
      metadata: { type: "mentor_subscription", userId, billingPeriod },
    });
  }

  if (type === "resume_unlock") {
    if (!seekerId) {
      return NextResponse.json({ error: "seekerId required for resume_unlock" }, { status: 400 });
    }
    const amount = RESUME_UNLOCK_PACK_PRICE_PAISE;
    const result = await createOrder({
      amount,
      currency: currency as Currency,
      receipt: `unlock-${userId}-${seekerId}`,
      notes: { type: "resume_unlock", recruiterId: userId, seekerId },
    });
    return NextResponse.json({
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      gateway: result.gateway,
      key: process.env.RAZORPAY_KEY_ID ?? undefined,
      metadata: { type: "resume_unlock", recruiterId: userId, seekerId },
    });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
