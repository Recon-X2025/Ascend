import { Worker, type Job } from "bullmq";
import type { OutcomeCheckinJobData } from "../index";
import { prisma } from "@/lib/prisma/client";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const outcomeCheckinWorker = new Worker<OutcomeCheckinJobData>(
  "outcome-checkin",
  async (job: Job<OutcomeCheckinJobData>) => {
    const { outcomeId } = job.data;
    const outcome = await prisma.mentorshipOutcome.findUnique({
      where: { id: outcomeId },
      include: { mentee: { select: { email: true, name: true } } },
    });
    if (!outcome || outcome.status !== "VERIFIED" || outcome.checkInStatus !== "PENDING") return;

    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    const { sendCheckinReminder } = await import("@/lib/email/templates/mentorship/checkin-reminder");
    await sendCheckinReminder({
      to: outcome.mentee.email,
      menteeName: outcome.mentee.name ?? "Mentee",
      transitionType: outcome.transitionType,
      outcomeUrl: `${baseUrl}/mentorship/engagements/${outcome.contractId}`,
    });
  },
  { connection }
);

outcomeCheckinWorker.on("completed", (job) => {
  console.log("[OutcomeCheckinWorker] Completed:", job.id, job.data.outcomeId);
});

outcomeCheckinWorker.on("failed", (job, err) => {
  console.error("[OutcomeCheckinWorker] Failed:", job?.id, err.message);
});
