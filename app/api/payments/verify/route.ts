import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { razorpayAdapter } from "@/lib/payments";
import { PaymentGateway } from "@prisma/client";
import { BOOST_PRICE_PAISE, RESUME_UNLOCK_PACK_SIZE, RESUME_OPTIMISATION_CREDIT_PRICE_PAISE } from "@/lib/payments/pricing";
import { MENTOR_MARKETPLACE_PLAN } from "@/lib/payments/plans";
import { addResumeOptimisationCredits } from "@/lib/payments/credits";
import { z } from "zod";

const bodySchema = z.object({
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string().optional(),
  type: z.enum(["boost", "resume_unlock", "resume_credit", "mentor_subscription", "marketplace_resume_review", "marketplace_mock_interview", "marketplace_coaching"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, type, metadata } = parsed.data;

  if (!razorpayAdapter.verifyPayment({
    gateway: "razorpay",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const existing = await prisma.paymentEvent.findUnique({ where: { gatewayEventId: razorpay_payment_id } });
  if (existing) return NextResponse.json({ success: true, alreadyProcessed: true });

  const meta = (metadata ?? {}) as Record<string, string>;

  if (type === "boost") {
    const jobPostId = meta.jobPostId ? parseInt(meta.jobPostId, 10) : undefined;
    const companyId = meta.companyId;
    const boostType = meta.boostType ?? "standard";
    const weeks = meta.weeks ? parseInt(meta.weeks, 10) : 1;
    if (!jobPostId || !companyId) return NextResponse.json({ error: "Missing boost metadata" }, { status: 400 });

    const base = BOOST_PRICE_PAISE[boostType as keyof typeof BOOST_PRICE_PAISE] ?? BOOST_PRICE_PAISE.standard;
    const amountPaid = base * weeks;

    await prisma.$transaction([
      prisma.paymentEvent.create({
        data: {
          userId,
          companyId,
          gateway: PaymentGateway.RAZORPAY,
          gatewayEventId: razorpay_payment_id,
          gatewayOrderId: razorpay_order_id ?? null,
          amount: amountPaid,
          currency: "INR",
          status: "COMPLETED",
          description: `Job boost: ${boostType} × ${weeks} week(s)`,
          metadata: { type: "boost", jobPostId, boostType, weeks },
        },
      }),
      prisma.jobBoost.create({
        data: {
          jobPostId,
          companyId,
          boostType,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000),
          amountPaid,
          gateway: PaymentGateway.RAZORPAY,
          gatewayPayId: razorpay_payment_id,
          active: true,
        },
      }),
    ]);

    try {
      const { createInvoice } = await import("@/lib/invoice/generate");
      const boostLabel =
        boostType === "featured" ? "Featured" : boostType === "urgent" ? "Urgent" : "Standard";
      await createInvoice({
        userId,
        paymentType: "SUBSCRIPTION",
        lineItems: [
          { description: `Job Boost — ${boostLabel} (${weeks} week${weeks > 1 ? "s" : ""})`, unitPricePaise: amountPaid },
        ],
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id ?? undefined,
      });
    } catch (e) {
      console.error("[payments/verify] Invoice creation failed:", e);
    }
    return NextResponse.json({ success: true, type: "boost", jobPostId });
  }

  if (type === "resume_credit") {
    await prisma.paymentEvent.create({
      data: {
        userId,
        gateway: PaymentGateway.RAZORPAY,
        gatewayEventId: razorpay_payment_id,
        gatewayOrderId: razorpay_order_id ?? null,
        amount: RESUME_OPTIMISATION_CREDIT_PRICE_PAISE,
        currency: "INR",
        status: "COMPLETED",
        description: "Resume optimisation — 1 credit",
        metadata: { type: "resume_credit" },
      },
    });
    await addResumeOptimisationCredits(userId, 1, razorpay_payment_id);
    const { trackOutcome } = await import("@/lib/tracking/outcomes");
    await trackOutcome(userId, "PRICING_RESUME_CREDIT_PURCHASED", { entityId: razorpay_payment_id });
    return NextResponse.json({ success: true, type: "resume_credit", redirectTo: "/resume" });
  }

  if (type === "mentor_subscription") {
    const billingPeriod = meta.billingPeriod ?? "monthly";
    const amountPaid =
      billingPeriod === "annual"
        ? MENTOR_MARKETPLACE_PLAN.annualPricePaise
        : MENTOR_MARKETPLACE_PLAN.monthlyPricePaise;
    const now = new Date();
    const expiresAt = new Date(now);
    if (billingPeriod === "annual") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }
    await prisma.paymentEvent.create({
      data: {
        userId,
        gateway: PaymentGateway.RAZORPAY,
        gatewayEventId: razorpay_payment_id,
        gatewayOrderId: razorpay_order_id ?? null,
        amount: amountPaid,
        currency: "INR",
        status: "COMPLETED",
        description: `Mentor marketplace — ${billingPeriod}`,
        metadata: { type: "mentor_subscription", billingPeriod },
      },
    });
    await prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: "MENTOR_MARKETPLACE",
        planKey: "MENTOR_MARKETPLACE",
        status: "ACTIVE",
        gateway: PaymentGateway.RAZORPAY,
        billingPeriod: billingPeriod === "annual" ? "ANNUAL" : "MONTHLY",
        pricePaidPaise: amountPaid,
        startsAt: now,
        expiresAt,
        currentPeriodStart: now,
        currentPeriodEnd: expiresAt,
      },
      update: {
        plan: "MENTOR_MARKETPLACE",
        planKey: "MENTOR_MARKETPLACE",
        status: "ACTIVE",
        gateway: PaymentGateway.RAZORPAY,
        billingPeriod: billingPeriod === "annual" ? "ANNUAL" : "MONTHLY",
        pricePaidPaise: amountPaid,
        startsAt: now,
        expiresAt,
        currentPeriodStart: now,
        currentPeriodEnd: expiresAt,
      },
    });
    // TODO: createInvoice for mentor subscription
    const { trackOutcome } = await import("@/lib/tracking/outcomes");
    await trackOutcome(userId, "PRICING_MENTOR_SUBSCRIPTION_PURCHASED", {
      entityId: razorpay_payment_id,
      metadata: { billingPeriod },
    });
    return NextResponse.json({ success: true, type: "mentor_subscription", redirectTo: "/dashboard/mentor" });
  }

  if (type === "resume_unlock") {
    const seekerId = meta.seekerId;
    const recruiterId = userId;
    const companyId = meta.companyId;
    if (!seekerId || !companyId) return NextResponse.json({ error: "Missing unlock metadata" }, { status: 400 });

    const amountPaid = 99900;

    await prisma.$transaction([
      prisma.paymentEvent.create({
        data: {
          userId: recruiterId,
          companyId,
          gateway: PaymentGateway.RAZORPAY,
          gatewayEventId: razorpay_payment_id,
          gatewayOrderId: razorpay_order_id ?? null,
          amount: amountPaid,
          currency: "INR",
          status: "COMPLETED",
          description: `Resume DB unlock × ${RESUME_UNLOCK_PACK_SIZE}`,
          metadata: { type: "resume_unlock", seekerId },
        },
      }),
      prisma.resumeUnlock.create({
        data: {
          recruiterId,
          seekerId,
          companyId,
          amountPaid,
          gateway: PaymentGateway.RAZORPAY,
          gatewayPayId: razorpay_payment_id,
        },
      }),
    ]);

    try {
      const { createInvoice } = await import("@/lib/invoice/generate");
      await createInvoice({
        userId,
        paymentType: "SUBSCRIPTION",
        lineItems: [
          {
            description: `Resume Database Unlock — ${RESUME_UNLOCK_PACK_SIZE} Credits`,
            unitPricePaise: amountPaid,
          },
        ],
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id ?? undefined,
      });
    } catch (e) {
      console.error("[payments/verify] Invoice creation failed:", e);
    }
    return NextResponse.json({ success: true, type: "resume_unlock" });
  }

  if (type === "marketplace_resume_review" || type === "marketplace_mock_interview" || type === "marketplace_coaching") {
    const orderId = meta.orderId as string | undefined;
    if (!orderId) return NextResponse.json({ error: "Missing orderId in metadata" }, { status: 400 });

    const { completeMarketplacePayment } = await import("@/lib/marketplace/payment-complete");
    const result = await completeMarketplacePayment({
      type,
      orderId,
      userId,
      gatewayEventId: razorpay_payment_id,
      gatewayOrderId: razorpay_order_id ?? undefined,
    });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

    if (result.invoicePayload) {
      try {
        const { createInvoice } = await import("@/lib/invoice/generate");
        await createInvoice(result.invoicePayload);
      } catch (e) {
        console.error("[payments/verify] Invoice creation failed:", e);
      }
    }
    return NextResponse.json({ success: true, type, orderId });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
