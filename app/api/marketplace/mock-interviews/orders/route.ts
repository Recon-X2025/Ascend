import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { createOrder } from "@/lib/payments";
import type { Currency } from "@/lib/payments/types";
import { computeFees } from "@/lib/marketplace/fees";
import { z } from "zod";

const bodySchema = z.object({
  providerId: z.string().cuid(),
  durationMinutes: z.number().int().refine((n) => n === 30 || n === 60),
  targetRole: z.string().min(1).max(200),
  recordingConsent: z.boolean().default(false),
  currency: z.enum(["INR", "USD"]).default("INR"),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });

  const { providerId, durationMinutes, targetRole, recordingConsent, currency } = parsed.data;

  const provider = await prisma.marketplaceProvider.findUnique({
    where: { id: providerId },
  });
  if (!provider || provider.status !== "ACTIVE" || provider.type !== "MOCK_INTERVIEWER") {
    return NextResponse.json({ error: "Provider not found or not available" }, { status: 404 });
  }
  if (!provider.isAvailable) return NextResponse.json({ error: "Provider is not available" }, { status: 400 });

  const amount = provider.pricePerSession;
  const { platformFee, providerPayout } = computeFees(amount);

  const order = await prisma.mockInterviewBooking.create({
    data: {
      seekerId: userId,
      providerId,
      durationMinutes,
      targetRole,
      recordingConsent,
      status: "PENDING_PAYMENT",
      platformFee,
      providerPayout,
    },
  });

  const result = await createOrder({
    amount,
    currency: currency as Currency,
    receipt: `mock-interview-${order.id}`,
    notes: { type: "marketplace_mock_interview", orderId: order.id, seekerId: userId, providerId },
  });

  return NextResponse.json({
    orderId: order.id,
    orderIdGateway: result.orderId,
    amount: result.amount,
    currency: result.currency,
    gateway: result.gateway,
    key: process.env.RAZORPAY_KEY_ID ?? undefined,
    metadata: { type: "marketplace_mock_interview", orderId: order.id },
  });
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.mockInterviewBooking.findMany({
    where: { seekerId: userId },
    include: { provider: { include: { user: { select: { name: true, image: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      durationMinutes: o.durationMinutes,
      targetRole: o.targetRole,
      scheduledAt: o.scheduledAt?.toISOString() ?? null,
      deliveredAt: o.deliveredAt?.toISOString() ?? null,
      technicalScore: o.technicalScore,
      communicationScore: o.communicationScore,
      cultureScore: o.cultureScore,
      problemSolvingScore: o.problemSolvingScore,
      scorecardNotes: o.scorecardNotes,
      seekerRating: o.seekerRating,
      createdAt: o.createdAt.toISOString(),
      provider: o.provider ? { id: o.provider.id, user: o.provider.user } : null,
    })),
  });
}
