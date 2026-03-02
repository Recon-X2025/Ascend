import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const JD_OPTIMISER_QUEUE = "jd-optimiser";

export interface JdOptimiserJobData {
  sessionId: string;
  userId: string;
  jobPostId: number;
  baseVersionId: string;
}

export const jdOptimiserQueue = new Queue<JdOptimiserJobData>(JD_OPTIMISER_QUEUE, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export async function enqueueOptimisation(data: JdOptimiserJobData) {
  return jdOptimiserQueue.add("optimise", data, {
    jobId: `optimise-${data.sessionId}`,
  });
}
