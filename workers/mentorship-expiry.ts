import { Worker } from "bullmq";
import { mentorshipExpiryQueue } from "@/lib/queues";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const JOB_NAME = "expire-stale-applications";
const EVERY_MS = 6 * 60 * 60 * 1000; // 6 hours

async function runExpire() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const secret = process.env.CRON_SECRET;
  const res = await fetch(`${baseUrl}/api/mentorship/applications/expire`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Expire API failed: ${res.status} ${text}`);
  }
  return res.json();
}

export const mentorshipExpiryWorker = new Worker(
  "mentorship-expiry",
  async () => {
    return runExpire();
  },
  { connection }
);

mentorshipExpiryWorker.on("completed", (job) => {
  console.log("[MentorshipExpiryWorker] Completed:", job.id, job.returnvalue);
});

mentorshipExpiryWorker.on("failed", (job, err) => {
  console.error("[MentorshipExpiryWorker] Failed:", job?.id, err.message);
});

/**
 * Register repeatable job. Call once on startup (e.g. from script that runs this worker).
 */
export async function registerMentorshipExpiryRepeatable() {
  const repeatable = await mentorshipExpiryQueue.getRepeatableJobs();
  const exists = repeatable.some((j) => j.name === JOB_NAME);
  if (!exists) {
    await mentorshipExpiryQueue.add(
      JOB_NAME,
      {},
      { repeat: { every: EVERY_MS } }
    );
    console.log("[MentorshipExpiry] Repeatable job registered (every 6 hours)");
  }
}

// Call registerMentorshipExpiryRepeatable() once on app/deploy startup to schedule the job.
