import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { createNotification } from "@/lib/notifications/create";
import { NotificationType } from "@prisma/client";
import { z } from "zod";

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("deliver"),
    technicalScore: z.number().int().min(1).max(5),
    communicationScore: z.number().int().min(1).max(5),
    cultureScore: z.number().int().min(1).max(5),
    problemSolvingScore: z.number().int().min(1).max(5),
    scorecardNotes: z.string().max(1000).optional(),
  }),
  z.object({ action: z.literal("rate"), seekerRating: z.number().int().min(1).max(5), seekerReview: z.string().max(500).optional() }),
  z.object({ action: z.literal("dispute") }),
]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.mockInterviewBooking.findUnique({
    where: { id },
    include: { provider: { include: { user: { select: { name: true, image: true } } } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.seekerId !== userId && order.provider.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      durationMinutes: order.durationMinutes,
      targetRole: order.targetRole,
      scheduledAt: order.scheduledAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      technicalScore: order.technicalScore,
      communicationScore: order.communicationScore,
      cultureScore: order.cultureScore,
      problemSolvingScore: order.problemSolvingScore,
      scorecardNotes: order.scorecardNotes,
      seekerRating: order.seekerRating,
      seekerReview: order.seekerReview,
      createdAt: order.createdAt.toISOString(),
      provider: order.provider ? { id: order.provider.id, user: order.provider.user } : null,
    },
    isSeeker: order.seekerId === userId,
    isProvider: order.provider.userId === userId,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.mockInterviewBooking.findUnique({
    where: { id },
    include: { provider: { include: { user: { select: { email: true } } } }, seeker: { select: { email: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });

  if (parsed.data.action === "deliver") {
    if (order.provider.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (order.status !== "PAID") return NextResponse.json({ error: "Order not in deliverable state" }, { status: 400 });

    const { technicalScore, communicationScore, cultureScore, problemSolvingScore, scorecardNotes } = parsed.data;
    await prisma.$transaction([
      prisma.mockInterviewBooking.update({
        where: { id },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
          technicalScore,
          communicationScore,
          cultureScore,
          problemSolvingScore,
          scorecardNotes: scorecardNotes ?? null,
        },
      }),
      prisma.marketplaceProvider.update({
        where: { id: order.providerId },
        data: { totalSessions: { increment: 1 } },
      }),
    ]);

    await createNotification({
      userId: order.seekerId,
      type: NotificationType.MARKETPLACE_ORDER_DELIVERED,
      title: "Your mock interview scorecard is ready",
      body: "View your scores and feedback in the dashboard.",
      linkUrl: `/dashboard/seeker/mock-interviews/${id}`,
    });
    try {
      const { sendOrderDeliveredEmail } = await import("@/lib/email/marketplace");
      if (order.seeker?.email) await sendOrderDeliveredEmail(order.seeker.email, "Mock interview");
    } catch {
      // ignore
    }
    return NextResponse.json({ success: true, status: "DELIVERED" });
  }

  if (parsed.data.action === "rate") {
    if (order.seekerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (order.status !== "DELIVERED") return NextResponse.json({ error: "Order must be delivered to rate" }, { status: 400 });

    const { seekerRating, seekerReview } = parsed.data;
    const reviews = order.provider.totalReviews;
    const newAvg = reviews === 0 ? seekerRating : ((order.provider.avgRating ?? 0) * reviews + seekerRating) / (reviews + 1);

    const existing = await prisma.providerReview.findUnique({
      where: { reviewerId_orderId: { reviewerId: userId, orderId: id } },
    });

    await prisma.$transaction([
      prisma.mockInterviewBooking.update({
        where: { id },
        data: { seekerRating, seekerReview: seekerReview ?? null },
      }),
      ...(existing
        ? []
        : [
            prisma.providerReview.create({
              data: {
                providerId: order.providerId,
                reviewerId: userId,
                rating: seekerRating,
                review: seekerReview ?? null,
                serviceType: "MOCK_INTERVIEW",
                orderId: id,
              },
            }),
            prisma.marketplaceProvider.update({
              where: { id: order.providerId },
              data: { totalReviews: { increment: 1 }, avgRating: newAvg },
            }),
          ]),
    ]);
    return NextResponse.json({ success: true });
  }

  if (parsed.data.action === "dispute") {
    if (order.seekerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.mockInterviewBooking.update({ where: { id }, data: { status: "DISPUTED" } });
    await createNotification({
      userId: order.provider.userId,
      type: NotificationType.MARKETPLACE_ORDER_DISPUTED,
      title: "Order disputed",
      body: `Mock interview order ${id} has been disputed.`,
      linkUrl: "/dashboard/provider",
    });
    try {
      const { sendOrderDisputedEmail } = await import("@/lib/email/marketplace");
      if (order.provider?.user?.email) await sendOrderDisputedEmail(order.provider.user.email, id, "Mock interview");
    } catch {
      // ignore
    }
    return NextResponse.json({ success: true, status: "DISPUTED" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
