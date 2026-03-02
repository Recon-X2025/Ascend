import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { createOrder } from "@/lib/payments";
import type { Currency } from "@/lib/payments/types";
import { computeFees } from "@/lib/marketplace/fees";
import { z } from "zod";

const bodySchema = z.object({
  providerId: z.string().cuid(),
  resumeUrl: z.string().min(1),
  resumeVersionId: z.string().cuid().optional(),
  careerGoal: z.string().min(1).max(300),
  currency: z.enum(["INR", "USD"]).default("INR"),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });

  const { providerId, resumeUrl, resumeVersionId, careerGoal, currency } = parsed.data;

  const provider = await prisma.marketplaceProvider.findUnique({
    where: { id: providerId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!provider || provider.status !== "ACTIVE" || provider.type !== "RESUME_REVIEWER") {
    return NextResponse.json({ error: "Provider not found or not available" }, { status: 404 });
  }
  if (!provider.isAvailable) return NextResponse.json({ error: "Provider is not available" }, { status: 400 });

  const amount = provider.pricePerSession;
  const { platformFee, providerPayout } = computeFees(amount);

  const order = await prisma.resumeReviewOrder.create({
    data: {
      seekerId: userId,
      providerId,
      resumeUrl,
      resumeVersionId: resumeVersionId ?? null,
      careerGoal,
      status: "PENDING_PAYMENT",
      platformFee,
      providerPayout,
    },
  });

  const result = await createOrder({
    amount,
    currency: currency as Currency,
    receipt: `resume-review-${order.id}`,
    notes: { type: "marketplace_resume_review", orderId: order.id, seekerId: userId, providerId },
  });

  return NextResponse.json({
    orderId: order.id,
    orderIdGateway: result.orderId,
    amount: result.amount,
    currency: result.currency,
    gateway: result.gateway,
    key: process.env.RAZORPAY_KEY_ID ?? undefined,
    metadata: { type: "marketplace_resume_review", orderId: order.id },
  });
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.resumeReviewOrder.findMany({
    where: { seekerId: userId },
    include: {
      provider: { include: { user: { select: { name: true, image: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      careerGoal: o.careerGoal,
      resumeUrl: o.resumeUrl,
      feedbackUrl: o.feedbackUrl,
      deliveredAt: o.deliveredAt?.toISOString() ?? null,
      seekerRating: o.seekerRating,
      seekerReview: o.seekerReview,
      createdAt: o.createdAt.toISOString(),
      provider: o.provider ? { id: o.provider.id, user: o.provider.user, pricePerSession: o.provider.pricePerSession, currency: o.provider.currency } : null,
    })),
  });
}
