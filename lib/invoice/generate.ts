/**
 * GST Invoicing — invoice generation, numbering, GST calculation
 */

import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { getFinancialYear, PLATFORM_ENTITY } from "./config";
import type { GstType, InvoicePaymentType } from "@prisma/client";

/** Atomically increment sequence for financial year. Returns e.g. ASC/2025-26/0001 */
export async function generateInvoiceNumber(financialYear: string): Promise<string> {
  const seq = await prisma.$transaction(async (tx) => {
    const existing = await tx.invoiceSequence.findUnique({
      where: { financialYear },
    });
    const next = (existing?.lastSequence ?? 0) + 1;
    await tx.invoiceSequence.upsert({
      where: { financialYear },
      create: { financialYear, lastSequence: next },
      update: { lastSequence: next },
    });
    return next;
  });
  const padded = String(seq).padStart(4, "0");
  return `ASC/${financialYear}/${padded}`;
}

/** Karnataka = 29. Intra-state → CGST+SGST; inter-state / no GSTIN → IGST */
export function determineGstType(buyerStateCode?: string): GstType {
  if (buyerStateCode === PLATFORM_ENTITY.stateCode) return "CGST_SGST";
  return "IGST";
}

const CGST_RATE = 0.09;
const SGST_RATE = 0.09;
const IGST_RATE = 0.18;

export function calculateGst(
  subtotalPaise: number,
  gstType: GstType
): { cgstPaise: number; sgstPaise: number; igstPaise: number; totalPaise: number } {
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;
  if (gstType === "CGST_SGST") {
    cgstPaise = Math.round(subtotalPaise * CGST_RATE);
    sgstPaise = Math.round(subtotalPaise * SGST_RATE);
  } else {
    igstPaise = Math.round(subtotalPaise * IGST_RATE);
  }
  const totalPaise = subtotalPaise + cgstPaise + sgstPaise + igstPaise;
  return { cgstPaise, sgstPaise, igstPaise, totalPaise };
}

/** Extract state code (first 2 digits) from GSTIN */
export function getStateCodeFromGstin(gstin: string): string {
  return gstin.slice(0, 2);
}

export async function createInvoice(params: {
  userId: string;
  paymentType: InvoicePaymentType;
  lineItems: { description: string; unitPricePaise: number; quantity?: number }[];
  paymentId?: string;
  orderId?: string;
  subscriptionId?: string;
  marketplaceOrderId?: string;
  escrowTrancheId?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true, email: true },
  });
  if (!user) throw new Error("User not found");

  const profile = await prisma.billingProfile.findUnique({
    where: { userId: params.userId },
  });

  const payerStateCode = profile?.stateCode ?? (profile?.gstin ? getStateCodeFromGstin(profile.gstin) : undefined);
  const gstType = determineGstType(payerStateCode);

  let subtotalPaise = 0;
  const lineItemsData = params.lineItems.map((item) => {
    const qty = item.quantity ?? 1;
    const total = item.unitPricePaise * qty;
    subtotalPaise += total;
    return {
      description: item.description,
      sacCode: PLATFORM_ENTITY.sacCode,
      quantity: qty,
      unitPricePaise: item.unitPricePaise,
      totalPaise: total,
    };
  });

  const { cgstPaise, sgstPaise, igstPaise, totalPaise } = calculateGst(subtotalPaise, gstType);

  const now = new Date();
  const financialYear = getFinancialYear(now);
  const invoiceNumber = await generateInvoiceNumber(financialYear);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      invoiceDate: now,
      financialYear,
      userId: params.userId,
      payerName: profile?.legalName ?? user.name ?? user.email,
      payerEmail: user.email,
      payerAddress: profile?.billingAddress ?? null,
      payerGstin: profile?.gstin ?? null,
      payerStateCode: payerStateCode ?? null,
      subtotalPaise,
      cgstPaise,
      sgstPaise,
      igstPaise,
      totalPaise,
      gstType,
      paymentType: params.paymentType,
      paymentId: params.paymentId ?? null,
      orderId: params.orderId ?? null,
      subscriptionId: params.subscriptionId ?? null,
      marketplaceOrderId: params.marketplaceOrderId ?? null,
      escrowTrancheId: params.escrowTrancheId ?? null,
      status: "DRAFT",
      lineItems: {
        create: lineItemsData,
      },
    },
    include: { lineItems: true },
  });

  const { invoicePdfQueue } = await import("@/lib/queues");
  invoicePdfQueue.add("generate", { invoiceId: invoice.id }, { attempts: 3, backoff: { type: "exponential", delay: 2000 } }).catch((err) => {
    console.error("[invoice] Failed to queue PDF job:", err);
  });

  trackOutcome(params.userId, "INVOICE_CREATED", {
    entityId: invoice.id,
    entityType: "Invoice",
    metadata: { paymentType: params.paymentType, totalPaise, invoiceNumber },
  }).catch(() => {});

  return invoice;
}

export async function finaliseInvoice(invoiceId: string, pdfS3Key: string): Promise<void> {
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "FINALISED",
      pdfS3Key,
      pdfGeneratedAt: new Date(),
    },
  });
}

export async function voidInvoice(invoiceId: string, reason: string): Promise<void> {
  void reason; // logged by caller (API route)
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "VOID" },
  });
}
