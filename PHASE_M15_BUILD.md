# M-15: Legal Framework & Compliance — Build Summary

## Overview

M-15 adds two platform-level legal documents that gate marketplace access:

1. **Mentorship Marketplace Addendum** — signed once by any user (mentor or mentee) before accessing the mentorship marketplace. Covers Zero Trust, off-platform prohibition, transcription consent, auto-release terms, strike consequences.
2. **Mentor Conduct Agreement** — signed once at mentor onboarding (Step 0 of become-a-mentor). Covers capacity limits, fee structure, verification requirements, strike consequences.

M-15 does **not** rebuild the Engagement Contract (M-5). Signing is OTP-by-email only (no Aadhaar eSign in M-15).

---

## Deliverables Checklist

- [x] Prisma migration: `m15_legal_framework` — LegalDocument, LegalDocumentSignature, LegalDocumentType enum
- [x] `lib/mentorship/legal/documents.ts` — full text for both documents; formatContentWithEffectiveDate
- [x] `lib/mentorship/legal/signatures.ts` — hasSignedDocument, getActiveDocument, recordSignature, checkMarketplaceAccess
- [x] `lib/mentorship/legal/otp.ts` — requestLegalOTP, verifyLegalOTP (3/hr, 10min TTL)
- [x] `scripts/seed-legal-documents.ts` — idempotent seed for both active documents
- [x] GET `/api/mentorship/legal/[type]` — returns active doc + signed + maskedEmail
- [x] POST `/api/mentorship/legal/[type]/request-otp` — rate-limited OTP; MentorshipAuditLog LEGAL_OTP_REQUESTED; M15_LEGAL_OTP_REQUESTED
- [x] POST `/api/mentorship/legal/[type]/sign` — OTP verify, recordSignature, LEGAL_DOCUMENT_SIGNED audit, M15_DOCUMENT_SIGNED, confirmation email
- [x] GET `/api/mentorship/legal/signatures` — user's own signatures
- [x] GET `/api/admin/mentorship/legal/signatures` — admin read-only audit (userId, type, from, to)
- [x] GET `/api/admin/mentorship/legal/documents` — active docs + total signatures + signed last 7 days
- [x] `/mentorship/legal/sign/[type]` — signing page (scroll-to-bottom gate, checkbox, OTP via ContractOTPModal + onSuccess redirect)
- [x] Mentorship Hub banner for unsigned Addendum; "Review & Sign" → sign page
- [x] Gate in POST `/api/mentorship/applications` — Addendum required; 403 LEGAL_SIGNATURE_REQUIRED + redirectTo; M15_LEGAL_GATE_BLOCKED
- [x] Gate in POST `/api/mentorship/become-mentor` — both documents required; 403 + redirectTo; M15_LEGAL_GATE_BLOCKED
- [x] Step 0 in `/mentorship/become-a-mentor` — redirect to sign MENTOR_CONDUCT_AGREEMENT if not signed
- [x] LegalDocumentSignature exempt from account deletion (comment in account-deletion worker)
- [x] Admin: Legal tab in Mentorship Ops (6th tab) — active documents table, signature stats, audit note
- [x] 3 Resend templates: legal-sign-otp, legal-document-signed, legal-update-required
- [x] Outcome events: M15_DOCUMENT_SIGNED, M15_LEGAL_OTP_REQUESTED, M15_LEGAL_GATE_BLOCKED (M15_NEW_VERSION_PUBLISHED for future publish flow)
- [x] ContractOTPModal extended with optional onSuccess for redirect
- [x] `tsc --noEmit` passes
- [ ] Run migration: `npx prisma migrate dev --name m15_legal_framework`
- [ ] Run seed once: `npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-legal-documents.ts`
- [ ] `npm run build` — may fail on pre-existing Resend dependency

---

## File List

### Prisma
- `prisma/schema.prisma` — LegalDocumentType enum, LegalDocument, LegalDocumentSignature; User.legalDocumentSignatures; OutcomeEventType M15_*

### Lib
- `lib/mentorship/legal/documents.ts` — document content constants, formatContentWithEffectiveDate
- `lib/mentorship/legal/signatures.ts` — hasSignedDocument, getActiveDocument, recordSignature, checkMarketplaceAccess
- `lib/mentorship/legal/otp.ts` — requestLegalOTP, verifyLegalOTP

### API routes
- `app/api/mentorship/legal/[type]/route.ts` — GET doc + signed + maskedEmail
- `app/api/mentorship/legal/[type]/request-otp/route.ts` — POST OTP
- `app/api/mentorship/legal/[type]/sign/route.ts` — POST sign with OTP
- `app/api/mentorship/legal/signatures/route.ts` — GET user's signatures
- `app/api/admin/mentorship/legal/signatures/route.ts` — GET admin audit
- `app/api/admin/mentorship/legal/documents/route.ts` — GET active docs + stats

### UI
- `app/mentorship/legal/sign/[type]/page.tsx` — signing page (scroll gate, checkbox, OTP modal)
- `components/mentorship/MentorshipHubClient.tsx` — addendum banner + addendumSigned check
- `components/mentorship/become-a-mentor/BecomeAMentorFlowClient.tsx` — Step 0 conduct agreement gate (redirect)
- `components/mentorship/ContractOTPModal.tsx` — optional onSuccess for redirect

### Gates
- `app/api/mentorship/applications/route.ts` — hasSignedDocument addendum before apply
- `app/api/mentorship/become-mentor/route.ts` — checkMarketplaceAccess(MENTOR) before create

### Email templates
- `lib/email/templates/mentorship/legal-sign-otp.ts`
- `lib/email/templates/mentorship/legal-document-signed.ts`
- `lib/email/templates/mentorship/legal-update-required.ts`

### Admin
- `components/dashboard/admin/MentorshipOpsClient.tsx` — Legal tab (active docs table, audit note)

### Workers / retention
- `lib/queues/workers/account-deletion.worker.ts` — comment: LegalDocumentSignature retained

### Scripts
- `scripts/seed-legal-documents.ts` — idempotent seed

---

## Constraints

1. **Signatures are immutable** — no UPDATE or DELETE on LegalDocumentSignature; no admin endpoint modifies them.
2. **One active version per type** — when publishing a new version, set old isActive to false in same transaction (publish flow can be added later).
3. **Scroll-to-bottom is UX only** — not enforced server-side.
4. **OTP** — same pattern as M-5: 3/hr, 10min TTL, 6-digit, ContractOTPModal.
5. **LegalDocumentSignature** — retained 7 years; exempt from account-deletion anonymisation.

---

## Re-signing on version update

When a new LegalDocument version is published (new record, isActive true; old isActive false), hasSignedDocument checks the active document id. Users who signed only the old version are treated as unsigned. Template `legal-update-required` can notify affected users (queue in a future "publish new version" admin action).

---

## Exit criteria

- Both documents seedable and signable via /mentorship/legal/sign/[type].
- Addendum required for applications; both required for become-mentor; Conduct Agreement required at Step 0 of become-a-mentor.
- API gates return 403 with code LEGAL_SIGNATURE_REQUIRED and redirectTo.
- Admin Legal tab shows active documents and signature counts.
- `tsc --noEmit` passes.
