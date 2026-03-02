import { webhookDeliveryQueue } from "@/lib/queues";
import { prisma } from "@/lib/prisma/client";

const EVENT_MAP: Record<string, string> = {
  "application.created": "application.created",
  "application.status_changed": "application.status_changed",
  "job.created": "job.created",
  "job.closed": "job.closed",
};

export async function queueWebhookDeliveries(
  companyId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!EVENT_MAP[event]) return;

  const webhooks = await prisma.companyWebhook.findMany({
    where: {
      companyId,
      isActive: true,
      events: { has: event },
    },
  });

  for (const wh of webhooks) {
    webhookDeliveryQueue
      .add(
        "deliver",
        {
          webhookId: wh.id,
          event,
          payload,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
        }
      )
      .catch((err) => console.error("[webhooks] Failed to queue:", err));
  }
}
