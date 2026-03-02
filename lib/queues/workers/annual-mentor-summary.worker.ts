/**
 * M-13: Annual mentor summary worker.
 * Runs April 1. Uses getMentorPayoutSummary from M-14.
 */
import { Worker, type Job } from "bullmq";
import { prisma } from "@/lib/prisma/client";
import { getMentorPayoutSummary } from "@/lib/escrow/revenue";
import type { AnnualMentorSummaryJobData } from "../index";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const annualMentorSummaryWorker = new Worker<AnnualMentorSummaryJobData>(
  "annual-mentor-summary",
  async (job: Job<AnnualMentorSummaryJobData>) => {
    const { mentorUserId } = job.data;
    const profile = await prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!profile) return;

    const summary = await getMentorPayoutSummary(mentorUserId);
    void summary; // Used when Resend template is wired: sendAnnualMentorSummary(profile.user.email, { summary, mentorName })
  },
  { connection }
);

annualMentorSummaryWorker.on("completed", (job) => {
  console.log("[AnnualMentorSummaryWorker] Job completed:", job.id);
});

annualMentorSummaryWorker.on("failed", (job, err) => {
  console.error("[AnnualMentorSummaryWorker] Job failed:", job?.id, err.message);
});
