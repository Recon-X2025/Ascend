# Phase GST Invoicing — Exit Checklist

GST-compliant invoicing layer for Ascend (Coheron Tech Private Limited). Covers subscriptions (Phase 12), marketplace (Phase 22), and mentorship (M-6).

## Exit Checklist

- [x] Prisma: `Invoice`, `InvoiceLineItem`, `InvoiceSequence`, `BillingProfile`, enums `GstType`, `InvoiceStatus`, `InvoicePaymentType`, `OpsAlertType.INVOICE_PDF_FAILED`
- [x] `lib/invoice/config.ts` — PLATFORM_ENTITY, getFinancialYear()
- [x] `lib/invoice/generate.ts` — generateInvoiceNumber, determineGstType, calculateGst, createInvoice, finaliseInvoice, voidInvoice
- [x] `lib/invoice/pdf.ts` — generateInvoicePdf, uploadInvoicePdf
- [x] `lib/invoice/words.ts` — amountInWords for PDF
- [x] BullMQ: invoice-pdf queue + worker (generate → upload → finalise → email → audit)
- [x] createInvoice wired: payments/verify (boost, resume_unlock, marketplace), marketplace payment-complete
- [x] M-6 escrow tranche: deferred (models not yet in schema)
- [x] GET/PUT `/api/billing/profile`
- [x] GET `/api/invoices` (paginated, financialYear, type)
- [x] GET `/api/invoices/[id]`
- [x] GET `/api/invoices/[id]/download` (signed S3 URL, 5-min TTL)
- [x] POST `/api/invoices/[id]/regenerate` (PLATFORM_ADMIN)
- [x] GET `/api/admin/invoices` (filters, GST totals, CSV export)
- [x] POST `/api/admin/invoices/[id]/void`
- [x] `/dashboard/billing` — Invoices tab (list + download), Billing Details tab (BillingProfile form + GSTIN validation)
- [x] `/dashboard/admin/invoices` — summary cards, invoice table, filters, void, regenerate, CSV export
- [x] Resend: invoice-ready, invoice-void
- [x] Outcome events: INVOICE_CREATED, INVOICE_PDF_GENERATED, INVOICE_DOWNLOADED, INVOICE_VOIDED, BILLING_PROFILE_UPDATED
- [x] Void invoices exempt from account deletion PII sweep (comment in account-deletion worker)
- [x] Legal pages: ToS, Privacy, Cookies already use Coheron Tech details (per conversation summary)
- [x] M-15 documents: Governing law already references Bengaluru courts
- [x] `tsc --noEmit` passes
- [x] `npm run build` passes

## File List

| Area | Path |
|------|------|
| Config | `lib/invoice/config.ts` |
| Generate | `lib/invoice/generate.ts` |
| PDF | `lib/invoice/pdf.ts` |
| Words | `lib/invoice/words.ts` |
| Queue | `lib/queues/index.ts` (invoicePdfQueue, InvoicePdfJobData) |
| Worker | `lib/queues/workers/invoice-pdf.worker.ts` |
| Email | `lib/email/templates/invoice/invoice-ready.ts`, `invoice-void.ts` |
| API | `app/api/billing/profile/route.ts` |
| API | `app/api/invoices/route.ts` |
| API | `app/api/invoices/[id]/route.ts` |
| API | `app/api/invoices/[id]/download/route.ts` |
| API | `app/api/invoices/[id]/regenerate/route.ts` |
| API | `app/api/admin/invoices/route.ts` |
| API | `app/api/admin/invoices/[id]/void/route.ts` |
| UI | `components/dashboard/billing/BillingInvoicesTab.tsx` |
| UI | `components/dashboard/billing/BillingDetailsTab.tsx` |
| UI | `app/dashboard/billing/page.tsx` |
| Admin | `app/dashboard/admin/invoices/page.tsx` |
| Admin | `components/dashboard/admin/AdminInvoicesClient.tsx` |
| Nav | `components/dashboard/admin/AdminNav.tsx` (Invoices link) |

## Payment Integration Points

- `app/api/payments/verify/route.ts` — boost, resume_unlock, marketplace
- `lib/marketplace/payment-complete.ts` — returns invoicePayload for all marketplace types

## Subscription Invoicing (Deferred)

Razorpay/Stripe subscription webhooks do not reliably include userId. Wire createInvoice when subscription payment confirmation can derive userId (e.g. subscription.charged + UserSubscription lookup).
