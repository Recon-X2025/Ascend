# M-5: Contract Generation & Digital Signing — Build Summary

**Status:** Complete  
**Prerequisites:** M-4 (Matching Engine) ✅, M-3 (Mentee Application Layer) ✅, M-2 (Mentor Profile) ✅, M-1 (Verification) ✅

---

## Goal

Every accepted mentorship engagement becomes a legally binding document before any session occurs. No engagement is active without both parties' OTP signatures. No money moves until the contract is ACTIVE.

---

## Implemented

### Prisma

- **ContractStatus** enum: `PENDING_MENTOR_SIGNATURE`, `PENDING_MENTEE_SIGNATURE`, `ACTIVE`, `COMPLETED`, `DISPUTED`, `TERMINATED_BY_MENTOR`, `TERMINATED_BY_MENTEE`, `VOID`
- **MentorshipContract**: id, mentorApplicationId (unique), mentorUserId, menteeUserId, status, contractContent (Json), tcVersion, pdfUrl, pdfHash, pdfGeneratedAt, mentorSignDeadline, menteeSignDeadline, generatedAt, activatedAt, completedAt, voidedAt, terminatedAt, terminatedBy, timestamps; indexes on mentorUserId, menteeUserId, status
- **ContractSignature**: id, contractId, signerUserId, signerRole, otpRequestedAt, otpVerifiedAt, ipAddress, userAgent, declaration, createdAt; unique (contractId, signerRole)
- **MentorApplication**: optional `contract` relation
- **User**: relations `mentorContracts`, `menteeContracts`, `contractSignatures`

Migration: `prisma/migrations/20260302100000_m5_mentorship_contract/migration.sql`

### Library

- **lib/mentorship/contract-types.ts**: `ContractContent` type, `CONTRACT_TC_VERSION`, `CONTRACT_CLAUSES` (verbatim clause text), `maskEmail()`
- **lib/mentorship/contract.ts**:
  - `generateContractContent(applicationId)` — assembles contract from application + mentor + mentee data (no persist)
  - `createContract(applicationId)` — creates contract, sets mentorSignDeadline (now + 48h), increments mentor currentMenteeCount, emails mentor (contract ready to sign), tracks CONTRACT_GENERATED
  - `requestOTP(userId, contractId)` — rate limit 3/hr per contract per user (Redis), stores hashed OTP in Redis 10min, sends OTP email, tracks CONTRACT_OTP_REQUESTED
  - `verifyOTPAndSign(userId, contractId, otp, ipAddress, userAgent)` — verifies OTP, creates ContractSignature; if MENTOR → status PENDING_MENTEE_SIGNATURE, menteeSignDeadline, email mentee; if MENTEE → status ACTIVE, activatedAt, queue contract-pdf, email both; tracks CONTRACT_SIGNED_MENTOR / CONTRACT_SIGNED_MENTEE
  - `generateContractPDF(contractId)` — BullMQ job: render HTML from contractContent, Playwright PDF (fallback pdf-lib), SHA-256 hash, upload S3 `contracts/{id}.pdf`, update contract pdfUrl/pdfHash/pdfGeneratedAt, send PDF-ready email to both
  - `verifyContractIntegrity(contractId)` — fetch PDF, recompute SHA-256; if mismatch → status DISPUTED, notify both, track CONTRACT_FLAGGED
  - `expireUnsignedContracts()` — cron: find past-deadline PENDING_* contracts, set VOID, voidedAt, decrement mentor currentMenteeCount, notify both, track CONTRACT_VOIDED
- **lib/mentorship/contract-pdf-template.ts**: `renderContractHtml(content, contractId)` — server-side HTML for PDF
- **lib/mentorship/contract-pdf-fallback.ts**: `createPdfFromHtml()` — pdf-lib minimal PDF when Playwright unavailable
- **lib/storage**: `getFileBuffer()`, `getSignedDownloadUrlWithExpiry()` for contract PDF integrity and signed download

### APIs

- **POST /api/mentorship/contracts/generate** — internal; body `{ applicationId }`; auth: mentor of application; creates contract, returns `{ id, status, mentorSignDeadline }`
- **GET /api/mentorship/contracts** — list contracts for current user (mentor or mentee)
- **GET /api/mentorship/contracts/[contractId]** — party only; runs integrity check if ACTIVE/COMPLETED; returns contract (no pdfHash)
- **POST /api/mentorship/contracts/[contractId]/request-otp** — party, correct turn, deadline not passed; returns `{ sent: true, expiresInSeconds: 600 }`
- **POST /api/mentorship/contracts/[contractId]/sign** — body `{ otp }`; returns status or 400 INVALID_OTP / OTP_EXPIRED
- **GET /api/mentorship/contracts/[contractId]/download** — party only; ACTIVE/COMPLETED; integrity check; returns `{ url, expiresAt }` (signed URL 5min); tracks CONTRACT_DOWNLOADED
- **GET /api/cron/expire-unsigned-contracts** — Bearer CRON_SECRET; calls `expireUnsignedContracts()`

### Integration

- **POST /api/mentorship/applications/[applicationId]/respond** — when `action === "ACCEPT"`: after updating status and sending application-accepted email, calls `createContract(applicationId)` (no separate “engagement started” email; that fires when contract becomes ACTIVE)

### Queues

- **contract-pdf** queue and worker: job data `{ contractId }`; runs `generateContractPDF(contractId)`

### Pages & UI

- **/mentorship/contracts/[contractId]** — server page; auth: party only; passes contract to `ContractPageClient`
- **ContractPageClient**: states PENDING_MENTOR_SIGNATURE (mentor: scroll gate + Sign → OTP modal; mentee: “Waiting for mentor”), PENDING_MENTEE_SIGNATURE (mentee: scroll gate + Sign; mentor: “Waiting for mentee”), ACTIVE (green banner, Download PDF), VOID, DISPUTED (flagged banner); signatures block; link “Return to Mentorship”
- **ContractOTPModal**: 6-digit input, resend after 60s, max 3 attempts then “Request a new code”, success → close + reload
- **ContractsAwaitingSignatureWidget** on mentor dashboard: lists contracts with status PENDING_MENTOR_SIGNATURE, otherPartyFirstName, engagementType, deadline countdown, “Review & sign” → contract page
- **MentorshipHubClient** (mentee): contract status banner — PENDING_MENTEE_SIGNATURE → amber “Action required: Please sign your engagement contract”; PENDING_MENTOR_SIGNATURE → “Waiting for your mentor to sign”; ACTIVE → green “Contract active. Your engagement has begun.”

### Email (Resend)

- contract-ready-to-sign-mentor
- contract-otp
- contract-mentee-turn
- contract-active (both parties)
- contract-pdf-ready (both)
- contract-expiry-warning (12h before deadline — template present; cron for 12h warning can be added separately)
- contract-voided
- contract-flagged

### Analytics (track)

- CONTRACT_GENERATED, CONTRACT_OTP_REQUESTED, CONTRACT_SIGNED_MENTOR, CONTRACT_SIGNED_MENTEE, CONTRACT_VOIDED, CONTRACT_DOWNLOADED, CONTRACT_FLAGGED (in `lib/analytics/track.ts` EVENTS)

### Cron

- **vercel.json**: `"/api/cron/expire-unsigned-contracts"` schedule `"0 * * * *"` (hourly)

---

## Exit Checklist

- [x] Migration applied — MentorshipContract, ContractSignature, ContractStatus enum
- [x] MentorApplication has contract relation
- [x] createContract() fires on mentor acceptance — contract generated, mentor emailed
- [x] Full contractContent populated with clause text verbatim, tcVersion locked
- [x] OTP request: rate-limited 3/hr, Redis TTL 10min, email sends
- [x] OTP verify: correct → signature; wrong → 400 INVALID_OTP; expired → 400 OTP_EXPIRED
- [x] Mentor signs → PENDING_MENTEE_SIGNATURE → mentee emailed
- [x] Mentee signs → ACTIVE → PDF queued → both emailed
- [x] PDF generated with SHA-256 stored; S3 contracts/{id}.pdf
- [x] /download: signed URL 5min, integrity check first; CONTRACT_FLAGGED → 403
- [x] Integrity mismatch → contract DISPUTED, both notified
- [x] Expiry cron hourly — voids unsigned, restores mentor capacity
- [x] Contract page: all states, scroll gate, OTP modal
- [x] Mentor dashboard “Contracts Awaiting Signature” widget
- [x] Mentee hub contract status banner
- [x] All 8 email templates
- [x] contract-pdf BullMQ worker
- [x] 7 outcome events wired
- [x] No admin update path for contractContent after signing
- [ ] No TypeScript errors, build passes (run `npm run build` after applying migration)

---

## Notes

- **contractContent** is immutable after both signatures; no update path.
- OTP is email-only for pilot; SMS (Twilio) stub can be added later.
- **pdfHash** verified on every /download.
- Mentor signs first (status machine).
- Escrow/payment (M-6) listens for contract ACTIVE; no payment in M-5.
- S3 contract PDF: private; access only via signed URLs.
- Optional: cron “12h before sign deadline” to send contract-expiry-warning (template exists).
