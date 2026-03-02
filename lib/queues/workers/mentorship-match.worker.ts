import { Worker, type Job } from "bullmq";
import type { MentorshipMatchJobData } from "../index";
import { invalidateDiscoverCache } from "@/lib/mentorship/refresh-matches";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const mentorshipMatchWorker = new Worker<MentorshipMatchJobData>(
  "mentorship-match",
  async (job: Job<MentorshipMatchJobData>) => {
    const { menteeUserId } = job.data;
    await invalidateDiscoverCache(menteeUserId);
  },
  { connection }
);

mentorshipMatchWorker.on("completed", (job) => {
  console.log("[MentorshipMatchWorker] Job completed:", job.id);
});

mentorshipMatchWorker.on("failed", (job, err) => {
  console.error("[MentorshipMatchWorker] Job failed:", job?.id, err.message);
});
