/**
 * M-13: Monthly mentor report worker.
 * Runs 1st of each month at 08:00 IST. Uses getMentorPayoutSummary from M-14.
 */
import { Worker, type Job } from "bullmq";
import { prisma } from "@/lib/prisma/client";
import { getMentorPayoutSummary } from "@/lib/escrow/revenue";
import { trackOutcome } from "@/lib/tracking/outcomes";
import type { OutcomeEventType } from "@prisma/client";
import type { MonthlyMentorReportJobData } from "../index";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const monthlyMentorReportWorker = new Worker<MonthlyMentorReportJobData>(
  "monthly-mentor-report",
  async (job: Job<MonthlyMentorReportJobData>) => {
    const { mentorUserId } = job.data;
    const profile = await prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!profile) return;

    const summary = await getMentorPayoutSummary(mentorUserId);
    const now = new Date();

    await prisma.mentorProfile.update({
      where: { id: profile.id },
      data: { monthlyReportSentAt: now },
    });

    await trackOutcome(mentorUserId, "M13_MONTHLY_REPORT_SENT" as OutcomeEventType, {
      entityId: profile.id,
      entityType: "MentorProfile",
      metadata: {
        totalEarnedPaise: summary.totalEarnedPaise,
        pendingEarnedPaise: summary.pendingEarnedPaise,
        inEscrowPaise: summary.inEscrowPaise,
      },
    });

    // TODO: Resend template - sendMonthlyMentorReport(profile.user.email, { summary, mentorName: profile.user.name })
  },
  { connection }
);

monthlyMentorReportWorker.on("completed", (job) => {
  console.log("[MonthlyMentorReportWorker] Job completed:", job.id);
});

monthlyMentorReportWorker.on("failed", (job, err) => {
  console.error("[MonthlyMentorReportWorker] Job failed:", job?.id, err.message);
});
