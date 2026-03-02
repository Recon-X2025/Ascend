import { Worker, type Job } from "bullmq";
import type { ContractPdfJobData } from "../index";
import { generateContractPDF } from "@/lib/mentorship/contract";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const contractPdfWorker = new Worker<ContractPdfJobData>(
  "contract-pdf",
  async (job: Job<ContractPdfJobData>) => {
    const { contractId } = job.data;
    await generateContractPDF(contractId);
  },
  { connection }
);

contractPdfWorker.on("completed", (job) => {
  console.log("[ContractPdfWorker] Completed:", job.id, job.data.contractId);
});

contractPdfWorker.on("failed", (job, err) => {
  console.error("[ContractPdfWorker] Failed:", job?.id, err.message);
});
