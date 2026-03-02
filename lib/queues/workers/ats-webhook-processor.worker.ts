import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import type { AtsWebhookProcessorJobData } from "../index";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

async function processAtsEvent(job: Job<AtsWebhookProcessorJobData>) {
  const { eventId } = job.data;
  const event = await prisma.atsWebhookEvent.findUnique({
    where: { id: eventId },
  });
  if (!event || event.processed) return;

  try {
    const payload = event.payload as Record<string, unknown>;
    const eventType = String(payload?.type ?? payload?.event_type ?? event.eventType).toLowerCase();

    if (eventType.includes("application.created")) {
      const email = payload?.email ?? (payload?.candidate as Record<string, unknown>)?.email;
      if (typeof email === "string") {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (user) {
          const jobPostId = Number(payload?.job_id ?? payload?.jobPostId);
          if (jobPostId && !Number.isNaN(jobPostId)) {
            const jobPost = await prisma.jobPost.findFirst({
              where: { id: jobPostId, companyId: event.companyId },
            });
            if (jobPost) {
              await prisma.jobApplication.upsert({
                where: {
                  jobPostId_applicantId: { jobPostId, applicantId: user.id },
                },
                create: {
                  jobPostId,
                  applicantId: user.id,
                  status: "SUBMITTED",
                },
                update: {},
              });
            }
          }
        }
      }
    } else if (eventType.includes("candidate.hired") || eventType.includes("application.hired")) {
      const email = payload?.email ?? (payload?.candidate as Record<string, unknown>)?.email;
      if (typeof email === "string") {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (user) {
          await prisma.jobApplication.updateMany({
            where: {
              applicantId: user.id,
              jobPost: { companyId: event.companyId },
            },
            data: { status: "HIRED" },
          });
        }
      }
    }
  } catch (err) {
    await prisma.atsWebhookEvent.update({
      where: { id: eventId },
      data: {
        processed: true,
        processedAt: new Date(),
        error: err instanceof Error ? err.message : "Unknown error",
      },
    });
    return;
  }

  await prisma.atsWebhookEvent.update({
    where: { id: eventId },
    data: { processed: true, processedAt: new Date() },
  });

  const admin = await prisma.companyAdmin.findFirst({
    where: { companyId: event.companyId },
    select: { userId: true },
  });
  if (admin) {
    trackOutcome(admin.userId, "PHASE18_ATS_EVENT_PROCESSED", {
      entityId: eventId,
      metadata: { companyId: event.companyId, provider: event.provider, eventType: event.eventType, success: true },
    }).catch(() => {});
  }
}

const worker = new Worker<AtsWebhookProcessorJobData>(
  "ats-webhook-processor",
  (job) => processAtsEvent(job),
  { connection, concurrency: 2 }
);

worker.on("completed", (job) => {
  console.log(`[ats-webhook-processor] Event ${job.data.eventId} processed`);
});

worker.on("failed", (job, err) => {
  console.error("[ats-webhook-processor] Job failed:", job?.id, err);
});
