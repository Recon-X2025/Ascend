import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma/client";
import { getFileBuffer } from "@/lib/storage";
import { jobSlug } from "@/lib/jobs/slug";
import { trackOutcome } from "@/lib/tracking/outcomes";
import type { BulkImportJobData } from "../index";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

async function processBulkImport(job: Job<BulkImportJobData>) {
  const { importJobId } = job.data;
  const importJob = await prisma.bulkImportJob.findUnique({
    where: { id: importJobId },
    include: { company: true },
  });
  if (!importJob || importJob.status !== "PENDING") return;

  await prisma.bulkImportJob.update({
    where: { id: importJobId },
    data: { status: "PROCESSING" },
  });

  const buffer = importJob.s3Key ? await getFileBuffer(importJob.s3Key) : null;
  if (!buffer) {
    await prisma.bulkImportJob.update({
      where: { id: importJobId },
      data: { status: "FAILED", errorLog: [{ row: 0, error: "File not found" }] as object },
    });
    return;
  }

  const text = buffer.toString("utf-8");
  const ext = importJob.s3Key?.toLowerCase().endsWith(".json") ? "json" : "csv";
  let rows: Array<Record<string, unknown>> = [];

  if (ext === "json") {
    try {
      const json = JSON.parse(text);
      rows = Array.isArray(json) ? json : json.jobs ?? json.data ?? [];
    } catch {
      rows = [];
    }
  } else {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const headers = lines[0]?.split(",").map((h) => h.trim().replace(/^"|"$/g, "")) ?? [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, unknown> = {};
      headers.forEach((h, j) => {
        row[h] = vals[j] ?? "";
      });
      rows.push(row);
    }
  }

  const admin = await prisma.companyAdmin.findFirst({
    where: { companyId: importJob.companyId },
    select: { userId: true },
  });
  const recruiterId = admin?.userId ?? importJob.userId;

  let processed = 0;
  let failed = 0;
  const errorLog: Array<{ row: number; error: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const title = String(row.title ?? row.job_title ?? "").trim();
    const description = String(row.description ?? row.desc ?? "").trim();
    if (!title || !description) {
      errorLog.push({ row: i + 1, error: "Missing title or description" });
      failed++;
      continue;
    }

    try {
      const tempSlug = `bulk-${Date.now()}-${i}`;
      const created = await prisma.jobPost.create({
        data: {
          slug: tempSlug,
          title,
          description,
          type: (row.type as "FULL_TIME") ?? "FULL_TIME",
          workMode: "HYBRID",
          locations: Array.isArray(row.locations) ? row.locations as string[] : row.location ? [String(row.location)] : [],
          salaryMin: typeof row.salaryMin === "number" ? row.salaryMin : typeof row.salary_min === "number" ? row.salary_min : null,
          salaryMax: typeof row.salaryMax === "number" ? row.salaryMax : typeof row.salary_max === "number" ? row.salary_max : null,
          salaryCurrency: String(row.currency ?? "INR"),
          companyId: importJob.companyId,
          companyName: importJob.company.name,
          recruiterId,
          status: "DRAFT",
          visibility: "PUBLIC",
        },
      });
      await prisma.jobPost.update({
        where: { id: created.id },
        data: { slug: jobSlug(created.title, created.id) },
      });
      processed++;
    } catch (err) {
      errorLog.push({ row: i + 1, error: err instanceof Error ? err.message : "Unknown error" });
      failed++;
    }
  }

  await prisma.bulkImportJob.update({
    where: { id: importJobId },
    data: {
      status: "COMPLETED",
      processed,
      failed,
      errorLog: errorLog.length > 0 ? (errorLog as object) : undefined,
      completedAt: new Date(),
    },
  });

  trackOutcome(importJob.userId, "PHASE18_BULK_IMPORT_COMPLETED", {
    entityId: importJobId,
    metadata: { companyId: importJob.companyId, type: importJob.type, total: rows.length, processed, failed },
  }).catch(() => {});
}

const worker = new Worker<BulkImportJobData>(
  "bulk-import",
  (job) => processBulkImport(job),
  { connection, concurrency: 1 }
);

worker.on("completed", (job) => {
  console.log(`[bulk-import] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error("[bulk-import] Job failed:", job?.id, err);
});
