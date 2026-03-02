import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { createNotification } from "@/lib/notifications/create";
import { NotificationType } from "@prisma/client";
import { z } from "zod";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("deliver"), feedbackUrl: z.string().url() }),
  z.object({ action: z.literal("rate"), seekerRating: z.number().int().min(1).max(5), seekerReview: z.string().max(500).optional() }),
  z.object({ action: z.literal("dispute") }),
]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.resumeReviewOrder.findUnique({
    where: { id },
    include: {
      provider: { include: { user: { select: { name: true, image: true } } } },
      seeker: { select: { id: true } },
    },
  });
  if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

  const isSeeker = order.seekerId === userId;
  const isProvider = order.provider.userId === userId;
  if (!isSeeker && !isProvider) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      careerGoal: order.careerGoal,
      resumeUrl: order.resumeUrl,
      feedbackUrl: order.feedbackUrl,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      seekerRating: order.seekerRating,
      seekerReview: order.seekerReview,
      createdAt: order.createdAt.toISOString(),
      provider: order.provider ? { id: order.provider.id, user: order.provider.user } : null,
    },
    isSeeker,
    isProvider,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.resumeReviewOrder.findUnique({
    where: { id },
    include: { provider: { include: { user: { select: { id: true, email: true, name: true } } } }, seeker: { select: { id: true, email: true } } },
  });
  if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid body", issues: parsed.error.issues }, { status: 400 });

  if (parsed.data.action === "deliver") {
    if (order.provider.userId !== userId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    if (order.status !== "IN_REVIEW" && order.status !== "PAID") return NextResponse.json({ success: false, error: "Order not in deliverable state" }, { status: 400 });

    await prisma.$transaction([
      prisma.resumeReviewOrder.update({
        where: { id },
        data: { status: "DELIVERED", feedbackUrl: parsed.data.feedbackUrl, deliveredAt: new Date() },
      }),
      prisma.marketplaceProvider.update({
        where: { id: order.providerId },
        data: { totalSessions: { increment: 1 } },
      }),
    ]);

    await createNotification({
      userId: order.seekerId,
      type: NotificationType.MARKETPLACE_ORDER_DELIVERED,
      title: "Your resume review is ready",
      body: `${order.provider.user?.name ?? "Provider"} has delivered your feedback.`,
      linkUrl: `/dashboard/seeker/orders/${id}`,
    });
    try {
      const { sendOrderDeliveredEmail } = await import("@/lib/email/marketplace");
      if (order.seeker?.email) await sendOrderDeliveredEmail(order.seeker.email, "Resume review");
    } catch {
      // ignore
    }
    return NextResponse.json({ success: true, status: "DELIVERED" });
  }

  if (parsed.data.action === "rate") {
    if (order.seekerId !== userId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    if (order.status !== "DELIVERED") return NextResponse.json({ success: false, error: "Order must be delivered to rate" }, { status: 400 });

    const { seekerRating, seekerReview } = parsed.data;
    const reviews = await prisma.providerReview.count({ where: { providerId: order.providerId } });
    const existing = await prisma.providerReview.findUnique({
      where: { reviewerId_orderId: { reviewerId: userId, orderId: id } },
    });
    const newAvg = existing
      ? undefined
      : reviews === 0
      ? seekerRating
      : ((order.provider.avgRating ?? 0) * order.provider.totalReviews + seekerRating) / (order.provider.totalReviews + 1);

    await prisma.$transaction([
      prisma.resumeReviewOrder.update({
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
                serviceType: "RESUME_REVIEW",
                orderId: id,
              },
            }),
            prisma.marketplaceProvider.update({
              where: { id: order.providerId },
              data: {
                totalReviews: { increment: 1 },
                avgRating: newAvg ?? undefined,
              },
            }),
          ]),
    ]);
    return NextResponse.json({ success: true });
  }

  if (parsed.data.action === "dispute") {
    if (order.seekerId !== userId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    if (order.status !== "DELIVERED" && order.status !== "IN_REVIEW") return NextResponse.json({ success: false, error: "Order cannot be disputed" }, { status: 400 });

    await prisma.resumeReviewOrder.update({
      where: { id },
      data: { status: "DISPUTED" },
    });
    await createNotification({
      userId: order.provider.userId,
      type: NotificationType.MARKETPLACE_ORDER_DISPUTED,
      title: "Order disputed",
      body: `Resume review order ${id} has been disputed.`,
      linkUrl: "/dashboard/provider",
    });
    try {
      const { sendOrderDisputedEmail } = await import("@/lib/email/marketplace");
      if (order.provider.user?.email) await sendOrderDisputedEmail(order.provider.user.email, id, "Resume review");
    } catch {
      // ignore
    }
    return NextResponse.json({ success: true, status: "DISPUTED" });
  }

  return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
}
