import { Worker } from "bullmq";
import type { SalaryAggregateJobData } from "../index";
import { getRoleSalary } from "@/lib/salary/aggregate";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

/**
 * Phase 8: Warm salary cache for heavy role aggregations.
 * Job data: { role, city?, year? }. Calls getRoleSalary which computes and writes cache.
 */
export const salaryAggregateWorker = new Worker<SalaryAggregateJobData>(
  "salary-aggregate",
  async (job) => {
    const { role, city, year } = job.data;
    await getRoleSalary(role, city ?? null, year ?? null);
    return { ok: true };
  },
  { connection }
);

salaryAggregateWorker.on("completed", (job) => {
  console.log("[SalaryAggregateWorker] Completed:", job.id);
});

salaryAggregateWorker.on("failed", (job, err) => {
  console.error("[SalaryAggregateWorker] Failed:", job?.id, err.message);
});
