import { Worker, type Job } from "bullmq";
import type { InvoicePdfJobData } from "../index";
import { prisma } from "@/lib/prisma/client";
import { generateInvoicePdf, uploadInvoicePdf } from "@/lib/invoice/pdf";
import { finaliseInvoice } from "@/lib/invoice/generate";
import { logAudit } from "@/lib/audit/log";
import { getSignedDownloadUrlWithExpiry } from "@/lib/storage";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { sendInvoiceReady } from "@/lib/email/templates/invoice/invoice-ready";
import { createOpsAlert } from "@/lib/mentorship/ops-alerts";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export const invoicePdfWorker = new Worker<InvoicePdfJobData>(
  "invoice-pdf",
  async (job: Job<InvoicePdfJobData>) => {
    const { invoiceId } = job.data;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: { select: { email: true } } },
    });
    if (!invoice || invoice.status === "VOID") {
      throw new Error("Invoice not found or voided");
    }
    if (invoice.status === "FINALISED") {
      return; // Already done
    }

    const buffer = await generateInvoicePdf(invoiceId);
    const pdfS3Key = await uploadInvoicePdf(invoiceId, buffer);
    await finaliseInvoice(invoiceId, pdfS3Key);

    const signedUrl = await getSignedDownloadUrlWithExpiry(pdfS3Key, SEVEN_DAYS_SECONDS);
    const totalRupees = `₹${(invoice.totalPaise / 100).toFixed(2)}`;
    if (invoice.user?.email) {
      await sendInvoiceReady({
        to: invoice.user.email,
        invoiceNumber: invoice.invoiceNumber,
        downloadUrl: signedUrl,
        totalInRupees: totalRupees,
      });
    }

    await logAudit({
      category: "PAYMENT",
      action: "INVOICE_PDF_GENERATED",
      targetType: "Invoice",
      targetId: invoiceId,
      metadata: { invoiceNumber: invoice.invoiceNumber, financialYear: invoice.financialYear },
    });

    const systemUserId = process.env.M16_SYSTEM_ACTOR_ID;
    if (systemUserId) {
      await trackOutcome(systemUserId, "INVOICE_PDF_GENERATED", {
        entityId: invoiceId,
        entityType: "Invoice",
        metadata: { financialYear: invoice.financialYear },
      }).catch(() => {});
    }
  },
  { connection, concurrency: 2 }
);

invoicePdfWorker.on("completed", (job) => {
  console.log("[InvoicePdfWorker] Completed:", job.id, job.data.invoiceId);
});

invoicePdfWorker.on("failed", async (job, err) => {
  console.error("[InvoicePdfWorker] Failed:", job?.id, err.message);
  if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
    const { invoiceId } = job.data;
    await createOpsAlert(
      "INVOICE_PDF_FAILED",
      "Invoice",
      invoiceId,
      `Invoice PDF generation failed after ${job.attemptsMade} attempts: ${err.message}`,
      "HIGH"
    ).catch(() => {});
  }
});
