import { Worker, Job } from "bullmq";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import type { WebhookDeliveryJobData } from "../index";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

async function deliverWebhook(job: Job<WebhookDeliveryJobData>) {
  const { webhookId, event, payload } = job.data;
  const webhook = await prisma.companyWebhook.findUnique({
    where: { id: webhookId },
    include: { company: true },
  });

  if (!webhook || !webhook.isActive) return;

  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  const signature = signPayload(body, webhook.secret);

  const response = await fetch(webhook.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Ascend-Signature": signature,
    },
    body,
  });

  const success = response.ok;
  const admin = await prisma.companyAdmin.findFirst({
    where: { companyId: webhook.companyId },
    select: { userId: true },
  });
  if (admin) {
    trackOutcome(admin.userId, "PHASE18_WEBHOOK_DELIVERED", {
      entityId: webhookId,
      entityType: "CompanyWebhook",
      metadata: { companyId: webhook.companyId, eventType: event, success },
    }).catch(() => {});
  }

  if (!success) {
    throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
  }
}

const worker = new Worker<WebhookDeliveryJobData>(
  "webhook-delivery",
  async (job) => {
    await deliverWebhook(job);
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`[webhook-delivery] Delivered to webhook ${job.data.webhookId}`);
});

worker.on("failed", (job, err) => {
  console.error("[webhook-delivery] Job failed:", job?.id, err);
});
