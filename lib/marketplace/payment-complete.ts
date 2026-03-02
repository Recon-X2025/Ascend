import { prisma } from "@/lib/prisma/client";
import { PaymentGateway } from "@prisma/client";
import { createNotification } from "@/lib/notifications/create";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { NotificationType } from "@prisma/client";
import type { InvoicePaymentType } from "@prisma/client";

type MarketplacePaymentType = "marketplace_resume_review" | "marketplace_mock_interview" | "marketplace_coaching";

export type MarketplacePaymentResult =
  | { success: true; invoicePayload?: Parameters<typeof import("@/lib/invoice/generate").createInvoice>[0] }
  | { success: false; error: string };

export async function completeMarketplacePayment(params: {
  type: MarketplacePaymentType;
  orderId: string;
  userId: string;
  gatewayEventId: string;
  gatewayOrderId?: string;
}): Promise<MarketplacePaymentResult> {
  const { type, orderId, userId, gatewayEventId, gatewayOrderId } = params;

  const existing = await prisma.paymentEvent.findUnique({ where: { gatewayEventId } });
  if (existing) return { success: true };

  if (type === "marketplace_resume_review") {
    const order = await prisma.resumeReviewOrder.findUnique({
      where: { id: orderId },
      include: { provider: { include: { user: { select: { id: true, email: true, name: true } } } } },
    });
    if (!order || order.seekerId !== userId) return { success: false, error: "Order not found" };
    if (order.status !== "PENDING_PAYMENT") return { success: false, error: "Order already processed" };

    await prisma.$transaction([
      prisma.paymentEvent.create({
        data: {
          userId,
          gateway: PaymentGateway.RAZORPAY,
          gatewayEventId,
          gatewayOrderId: gatewayOrderId ?? null,
          amount: order.platformFee + order.providerPayout,
          currency: "INR",
          status: "COMPLETED",
          description: "Resume review (marketplace)",
          metadata: { type: "marketplace_commission", orderId, platformFee: order.platformFee, providerPayout: order.providerPayout },
        },
      }),
      prisma.resumeReviewOrder.update({
        where: { id: orderId },
        data: { status: "IN_REVIEW", paymentEventId: gatewayEventId },
      }),
    ]);

    await createNotification({
      userId: order.provider.userId,
      type: NotificationType.MARKETPLACE_ORDER_RECEIVED,
      title: "New resume review order",
      body: "A seeker has placed an order. Deliver feedback from your provider dashboard.",
      linkUrl: "/dashboard/provider",
    });
    try {
      const { sendOrderReceivedEmail } = await import("@/lib/email/marketplace");
      if (order.provider.user?.email) await sendOrderReceivedEmail(order.provider.user.email, "Resume review");
    } catch {
      // ignore
    }
    await trackOutcome(userId, "PHASE22_ORDER_CREATED", {
      entityId: orderId,
      entityType: "ResumeReviewOrder",
      metadata: { serviceType: "RESUME_REVIEW", providerId: order.providerId, value: order.platformFee + order.providerPayout },
    });
    await trackOutcome(userId, "PHASE22_MARKETPLACE_REVENUE", {
      entityId: orderId,
      entityType: "ResumeReviewOrder",
      metadata: { platformFee: order.platformFee, providerPayout: order.providerPayout },
    });
    return {
      success: true,
      invoicePayload: {
        userId,
        paymentType: "MARKETPLACE_ORDER" as InvoicePaymentType,
        lineItems: [
          {
            description: `Resume Review — ${order.provider.user?.name ?? "Provider"}`,
            unitPricePaise: order.platformFee + order.providerPayout,
          },
        ],
        paymentId: gatewayEventId,
        orderId: gatewayOrderId,
        marketplaceOrderId: orderId,
      },
    };
  }

  if (type === "marketplace_mock_interview") {
    const order = await prisma.mockInterviewBooking.findUnique({
      where: { id: orderId },
      include: { provider: { include: { user: { select: { id: true, email: true, name: true } } } } },
    });
    if (!order || order.seekerId !== userId) return { success: false, error: "Order not found" };
    if (order.status !== "PENDING_PAYMENT") return { success: false, error: "Order already processed" };

    await prisma.$transaction([
      prisma.paymentEvent.create({
        data: {
          userId,
          gateway: PaymentGateway.RAZORPAY,
          gatewayEventId,
          gatewayOrderId: gatewayOrderId ?? null,
          amount: order.platformFee + order.providerPayout,
          currency: "INR",
          status: "COMPLETED",
          description: "Mock interview (marketplace)",
          metadata: { type: "marketplace_commission", orderId, platformFee: order.platformFee, providerPayout: order.providerPayout },
        },
      }),
      prisma.mockInterviewBooking.update({
        where: { id: orderId },
        data: { status: "PAID", paymentEventId: gatewayEventId },
      }),
    ]);

    await createNotification({
      userId: order.provider.userId,
      type: NotificationType.MARKETPLACE_ORDER_RECEIVED,
      title: "New mock interview booking",
      body: "A seeker has booked a session. Schedule via your calendar link.",
      linkUrl: "/dashboard/provider",
    });
    try {
      const { sendOrderReceivedEmail } = await import("@/lib/email/marketplace");
      if (order.provider.user?.email) await sendOrderReceivedEmail(order.provider.user.email, "Mock interview");
    } catch {
      // ignore
    }
    await trackOutcome(userId, "PHASE22_ORDER_CREATED", {
      entityId: orderId,
      entityType: "MockInterviewBooking",
      metadata: { serviceType: "MOCK_INTERVIEW", providerId: order.providerId, value: order.platformFee + order.providerPayout },
    });
    await trackOutcome(userId, "PHASE22_MARKETPLACE_REVENUE", {
      entityId: orderId,
      entityType: "MockInterviewBooking",
      metadata: { platformFee: order.platformFee, providerPayout: order.providerPayout },
    });
    return {
      success: true,
      invoicePayload: {
        userId,
        paymentType: "MARKETPLACE_ORDER" as InvoicePaymentType,
        lineItems: [
          {
            description: `Mock Interview — ${order.provider.user?.name ?? "Provider"}`,
            unitPricePaise: order.platformFee + order.providerPayout,
          },
        ],
        paymentId: gatewayEventId,
        orderId: gatewayOrderId,
        marketplaceOrderId: orderId,
      },
    };
  }

  if (type === "marketplace_coaching") {
    const order = await prisma.coachingSession.findUnique({
      where: { id: orderId },
      include: { provider: { include: { user: { select: { id: true, email: true, name: true } } } } },
    });
    if (!order || order.seekerId !== userId) return { success: false, error: "Order not found" };
    if (order.status !== "PENDING_PAYMENT") return { success: false, error: "Order already processed" };

    await prisma.$transaction([
      prisma.paymentEvent.create({
        data: {
          userId,
          gateway: PaymentGateway.RAZORPAY,
          gatewayEventId,
          gatewayOrderId: gatewayOrderId ?? null,
          amount: order.platformFee + order.providerPayout,
          currency: "INR",
          status: "COMPLETED",
          description: "Career coaching (marketplace)",
          metadata: { type: "marketplace_commission", orderId, platformFee: order.platformFee, providerPayout: order.providerPayout },
        },
      }),
      prisma.coachingSession.update({
        where: { id: orderId },
        data: { status: "PAID", paymentEventId: gatewayEventId },
      }),
    ]);

    await createNotification({
      userId: order.provider.userId,
      type: NotificationType.MARKETPLACE_ORDER_RECEIVED,
      title: "New coaching session booking",
      body: "A seeker has booked a session. Schedule via your calendar link.",
      linkUrl: "/dashboard/provider",
    });
    try {
      const { sendOrderReceivedEmail } = await import("@/lib/email/marketplace");
      if (order.provider.user?.email) await sendOrderReceivedEmail(order.provider.user.email, "Coaching");
    } catch {
      // ignore
    }
    await trackOutcome(userId, "PHASE22_ORDER_CREATED", {
      entityId: orderId,
      entityType: "CoachingSession",
      metadata: { serviceType: "COACHING", providerId: order.providerId, value: order.platformFee + order.providerPayout },
    });
    await trackOutcome(userId, "PHASE22_MARKETPLACE_REVENUE", {
      entityId: orderId,
      entityType: "CoachingSession",
      metadata: { platformFee: order.platformFee, providerPayout: order.providerPayout },
    });
    return {
      success: true,
      invoicePayload: {
        userId,
        paymentType: "MARKETPLACE_ORDER" as InvoicePaymentType,
        lineItems: [
          {
            description: `Career Coaching — ${order.provider.user?.name ?? "Provider"}`,
            unitPricePaise: order.platformFee + order.providerPayout,
          },
        ],
        paymentId: gatewayEventId,
        orderId: gatewayOrderId,
        marketplaceOrderId: orderId,
      },
    };
  }

  return { success: false, error: "Unknown type" };
}
