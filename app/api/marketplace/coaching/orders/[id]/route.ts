import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { createNotification } from "@/lib/notifications/create";
import { NotificationType } from "@prisma/client";
import { z } from "zod";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("deliver"), sessionNotes: z.string().max(2000) }),
  z.object({ action: z.literal("rate"), seekerRating: z.number().int().min(1).max(5), seekerReview: z.string().max(500).optional() }),
  z.object({ action: z.literal("dispute") }),
]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.coachingSession.findUnique({
    where: { id },
    include: { provider: { include: { user: { select: { name: true, image: true } } } } },
  });
  if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  if (order.seekerId !== userId && order.provider.userId !== userId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      topic: order.topic,
      durationMinutes: order.durationMinutes,
      scheduledAt: order.scheduledAt?.toISOString() ?? null,
      sessionNotes: order.sessionNotes,
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
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.coachingSession.findUnique({
    where: { id },
    include: { provider: { include: { user: { select: { email: true } } } }, seeker: { select: { email: true } } },
  });
  if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid body", issues: parsed.error.issues }, { status: 400 });

  if (parsed.data.action === "deliver") {
    if (order.provider.userId !== userId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    if (order.status !== "PAID") return NextResponse.json({ success: false, error: "Order not in deliverable state" }, { status: 400 });

    await prisma.$transaction([
      prisma.coachingSession.update({
        where: { id },
        data: { status: "DELIVERED", sessionNotes: parsed.data.sessionNotes },
      }),
      prisma.marketplaceProvider.update({
        where: { id: order.providerId },
        data: { totalSessions: { increment: 1 } },
      }),
    ]);

    await createNotification({
      userId: order.seekerId,
      type: NotificationType.MARKETPLACE_ORDER_DELIVERED,
      title: "Your coaching session notes are ready",
      body: "View your session summary in the dashboard.",
      linkUrl: `/dashboard/seeker/coaching/${id}`,
    });
    try {
      const { sendOrderDeliveredEmail } = await import("@/lib/email/marketplace");
      if (order.seeker?.email) await sendOrderDeliveredEmail(order.seeker.email, "Coaching");
    } catch {
      // ignore
    }
    return NextResponse.json({ success: true, status: "DELIVERED" });
  }

  if (parsed.data.action === "rate") {
    if (order.seekerId !== userId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    if (order.status !== "DELIVERED") return NextResponse.json({ success: false, error: "Order must be delivered to rate" }, { status: 400 });

    const { seekerRating, seekerReview } = parsed.data;
    const reviews = order.provider.totalReviews;
    const newAvg = reviews === 0 ? seekerRating : ((order.provider.avgRating ?? 0) * reviews + seekerRating) / (reviews + 1);
    const existing = await prisma.providerReview.findUnique({
      where: { reviewerId_orderId: { reviewerId: userId, orderId: id } },
    });

    await prisma.$transaction([
      prisma.coachingSession.update({
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
                serviceType: "COACHING",
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
    if (order.seekerId !== userId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    await prisma.coachingSession.update({ where: { id }, data: { status: "DISPUTED" } });
    await createNotification({
      userId: order.provider.userId,
      type: NotificationType.MARKETPLACE_ORDER_DISPUTED,
      title: "Order disputed",
      body: `Coaching order ${id} has been disputed.`,
      linkUrl: "/dashboard/provider",
    });
    try {
      const { sendOrderDisputedEmail } = await import("@/lib/email/marketplace");
      if (order.provider?.user?.email) await sendOrderDisputedEmail(order.provider.user.email, id, "Coaching");
    } catch {
      // ignore
    }
    return NextResponse.json({ success: true, status: "DISPUTED" });
  }

  return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
}
