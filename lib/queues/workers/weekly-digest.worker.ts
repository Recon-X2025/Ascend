import { Worker, type Job } from "bullmq";
import { prisma } from "@/lib/prisma/client";
import type { WeeklyDigestJobData } from "../index";
import { computeWeeklyDigest } from "@/lib/intelligence/candidate";
import { sendWeeklyDigestEmail } from "@/lib/email/templates/weekly-digest";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const weeklyDigestWorker = new Worker<WeeklyDigestJobData>(
  "weekly-digest",
  async (job: Job<WeeklyDigestJobData>) => {
    const { userId } = job.data;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, marketingConsent: true, role: true },
    });
    if (!user?.email || !user.marketingConsent || user.role !== "JOB_SEEKER") {
      return;
    }
    const data = await computeWeeklyDigest(userId);
    if (!data) return;
    await sendWeeklyDigestEmail(user.email, data);
  },
  { connection }
);

weeklyDigestWorker.on("completed", (job) => {
  console.log("[WeeklyDigestWorker] Job completed:", job.id);
});

weeklyDigestWorker.on("failed", (job, err) => {
  console.error("[WeeklyDigestWorker] Job failed:", job?.id, err.message);
});
