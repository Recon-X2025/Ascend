import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { createOrder } from "@/lib/payments";
import type { Currency } from "@/lib/payments/types";
import { computeFees } from "@/lib/marketplace/fees";
import { z } from "zod";

const bodySchema = z.object({
  providerId: z.string().cuid(),
  topic: z.string().min(1).max(100),
  durationMinutes: z.number().int().refine((n) => [30, 45, 60].includes(n)),
  currency: z.enum(["INR", "USD"]).default("INR"),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });

  const { providerId, topic, durationMinutes, currency } = parsed.data;

  const provider = await prisma.marketplaceProvider.findUnique({
    where: { id: providerId },
  });
  if (!provider || provider.status !== "ACTIVE" || provider.type !== "CAREER_COACH") {
    return NextResponse.json({ error: "Provider not found or not available" }, { status: 404 });
  }
  if (!provider.isAvailable) return NextResponse.json({ error: "Provider is not available" }, { status: 400 });

  const amount = provider.pricePerSession;
  const { platformFee, providerPayout } = computeFees(amount);

  const order = await prisma.coachingSession.create({
    data: {
      seekerId: userId,
      providerId,
      topic,
      durationMinutes,
      status: "PENDING_PAYMENT",
      platformFee,
      providerPayout,
    },
  });

  const result = await createOrder({
    amount,
    currency: currency as Currency,
    receipt: `coaching-${order.id}`,
    notes: { type: "marketplace_coaching", orderId: order.id, seekerId: userId, providerId },
  });

  return NextResponse.json({
    orderId: order.id,
    orderIdGateway: result.orderId,
    amount: result.amount,
    currency: result.currency,
    gateway: result.gateway,
    key: process.env.RAZORPAY_KEY_ID ?? undefined,
    metadata: { type: "marketplace_coaching", orderId: order.id },
  });
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.coachingSession.findMany({
    where: { seekerId: userId },
    include: { provider: { include: { user: { select: { name: true, image: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      topic: o.topic,
      durationMinutes: o.durationMinutes,
      scheduledAt: o.scheduledAt?.toISOString() ?? null,
      sessionNotes: o.sessionNotes,
      seekerRating: o.seekerRating,
      createdAt: o.createdAt.toISOString(),
      provider: o.provider ? { id: o.provider.id, user: o.provider.user } : null,
    })),
  });
}
