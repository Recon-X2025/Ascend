import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { refund } from "@/lib/payments";
import { createNotification } from "@/lib/notifications/create";
import { NotificationType } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id: orderId } = await params;

  const [rr, mock, coaching] = await Promise.all([
    prisma.resumeReviewOrder.findUnique({ where: { id: orderId }, include: { seeker: { select: { email: true } } } }),
    prisma.mockInterviewBooking.findUnique({ where: { id: orderId }, include: { seeker: { select: { email: true } } } }),
    prisma.coachingSession.findUnique({ where: { id: orderId }, include: { seeker: { select: { email: true } } } }),
  ]);

  const order = rr ?? mock ?? coaching;
  if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

  const status = "status" in order ? order.status : null;
  if (status !== "DISPUTED" && status !== "PAID" && status !== "IN_REVIEW" && status !== "DELIVERED") {
    return NextResponse.json({ success: false, error: "Order cannot be refunded" }, { status: 400 });
  }

  const paymentEventId = "paymentEventId" in order ? order.paymentEventId : null;
  if (!paymentEventId) return NextResponse.json({ success: false, error: "No payment linked to order" }, { status: 400 });

  const paymentEvent = await prisma.paymentEvent.findFirst({
    where: { gatewayEventId: paymentEventId },
  });
  if (!paymentEvent) return NextResponse.json({ success: false, error: "Payment event not found" }, { status: 404 });

  const amount = order.platformFee + order.providerPayout;
  try {
    await refund({
      gateway: paymentEvent.gateway === "RAZORPAY" ? "razorpay" : "stripe",
      paymentId: paymentEvent.gatewayEventId,
      amount,
    });
  } catch (err) {
    console.error("[Refund]", err);
    return NextResponse.json({ success: false, error: "Refund failed" }, { status: 502 });
  }

  if (rr) {
    await prisma.resumeReviewOrder.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
  } else if (mock) {
    await prisma.mockInterviewBooking.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
  } else if (coaching) {
    await prisma.coachingSession.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
  }

  const seekerId = "seekerId" in order ? order.seekerId : null;
  if (seekerId) {
    await createNotification({
      userId: seekerId,
      type: NotificationType.MARKETPLACE_ORDER_DELIVERED,
      title: "Refund processed",
      body: "Your payment has been refunded for the disputed order.",
      linkUrl: "/dashboard/seeker",
    });
    try {
      const { sendOrderRefundedEmail } = await import("@/lib/email/marketplace");
      const seeker = rr?.seeker ?? mock?.seeker ?? coaching?.seeker;
      if (seeker?.email) await sendOrderRefundedEmail(seeker.email, "Marketplace order");
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ success: true, status: "REFUNDED" });
}
