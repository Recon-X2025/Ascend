import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { atsWebhookProcessorQueue } from "@/lib/queues";
import { trackOutcome } from "@/lib/tracking/outcomes";
import type { AtsProvider } from "@prisma/client";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = typeof payload === "object" && payload && "type" in payload
    ? String((payload as { type: unknown }).type)
    : "unknown";

  const integration = await prisma.atsIntegration.findFirst({
    where: { provider: "WORKDAY", isActive: true },
    select: { companyId: true },
  });
  const companyId = integration?.companyId ?? (await prisma.company.findFirst({ select: { id: true } }))?.id;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company configured for webhook" }, { status: 503 });
  }

  const event = await prisma.atsWebhookEvent.create({
    data: {
      companyId,
      provider: "WORKDAY" as AtsProvider,
      eventType,
      payload: payload as object,
    },
  });

  atsWebhookProcessorQueue.add("process", { eventId: event.id }).catch(() => {});

  const admin = await prisma.companyAdmin.findFirst({
    where: { companyId },
    select: { userId: true },
  });
  if (admin) {
    trackOutcome(admin.userId, "PHASE18_ATS_EVENT_RECEIVED", {
      entityId: event.id,
      metadata: { companyId, provider: "WORKDAY", eventType },
    }).catch(() => {});
  }

  return NextResponse.json({ received: true });
}
