# M-7: Meeting Room, Ascend Steno & Session Evidence — Build Summary

## Overview

M-7 delivers the **Meeting Room, Ascend Steno & Session Evidence** infrastructure for Ascend mentorship. If it did not happen on Ascend, it did not happen. Meeting via Daily.co embedded room. Platform generates room — neither party can substitute external links. Session join logging via Daily.co webhooks. Minimum 60% of effectiveSlotMins or INCOMPLETE_SESSION. Ascend Steno: transcript → GPT-4o Mini extraction → immutable Session Record PDF (SHA-256).

**Critical:** Audio NEVER stored. Steno runs only if BOTH acknowledge. Session Record immutable with SHA-256. 60% threshold.

---

## Deliverables Checklist

- [x] Prisma migration m7_session_steno: SessionRoom, SessionJoinLog, StenoConsentLog, SessionTranscript, StenoExtraction, SessionRecord, SessionExceptionNote, MessageFlag
- [x] Enums: ExceptionStatus, MessageFlagType, StenoStatus; SessionStatus + IN_PROGRESS, INCOMPLETE_SESSION, EXCEPTION_ACKNOWLEDGED
- [x] EngagementSession extended: slotDurationMins, effectiveDurationMins, carryOverMins, effectiveSlotMins, stenoStatus, sessionRoom
- [x] `lib/sessions/room.ts` — createSessionRoom, getOrCreateSessionRoom, generateRoomToken, expireSessionRoom (Daily.co)
- [x] `lib/sessions/join.ts` — recordJoin, recordLeave, checkNoShow, calculateEffectiveDuration, meetsMinimumDuration (60%)
- [x] `lib/sessions/steno.ts` — recordStenoConsent, stenoShouldRun, hasWaivedDisputeRights, startTranscription, stopTranscription, saveTranscript, extractFromTranscript (Deepgram stub, OpenAI GPT-4o Mini)
- [x] `lib/sessions/record.ts` — generateSessionRecord (pdf-lib), uploadSessionRecord (lib/storage), verifySessionRecordIntegrity (SHA-256)
- [x] `lib/sessions/monitor.ts` — scanMessage (regex: EXTERNAL_EMAIL, PHONE_NUMBER, EXTERNAL_VIDEO_LINK, PAYMENT_SOLICITATION), strike system
- [x] BullMQ: stenoExtractionQueue, sessionRecordQueue, sessionFinaliseQueue, dailyCoWebhookQueue
- [x] Workers: steno-extraction, session-record, session-finalise, dailyco-webhook
- [x] POST `/api/webhooks/dailyco` — verify Daily-Signature, handle meeting-started, participant-joined, participant-left, meeting-ended
- [x] POST `/api/sessions/[sessionId]/room` — create/get room + token
- [x] POST `/api/sessions/[sessionId]/consent` — { acknowledged }
- [x] GET `/api/sessions/[sessionId]/record` — signed URL, integrity verify
- [x] POST `/api/sessions/[sessionId]/exception` — file note; GET pending
- [x] POST `/api/sessions/[sessionId]/exception/acknowledge` — acknowledge/decline
- [x] GET `/api/admin/sessions`, GET `/api/admin/sessions/[sessionId]`
- [x] `/mentorship/sessions/[sessionId]/join` — consent pop-up, room embed (Daily Prebuilt iframe)
- [x] In-room Steno Active indicator
- [x] `/mentorship/sessions/[sessionId]/exception` — file + acknowledge
- [x] 10 Resend templates: session-reminder-24h, session-reminder-1h, session-record-ready, session-incomplete, session-no-show, session-exception-filed, session-exception-acknowledged, session-exception-declined, session-off-platform-warning, session-off-platform-suspended
- [x] 15 Outcome events: M7_SESSION_ROOM_CREATED, M7_SESSION_STARTED, M7_PARTICIPANT_JOINED, M7_STENO_CONSENT_RECORDED, M7_STENO_STARTED, M7_STENO_COMPLETED, M7_STENO_SKIPPED, M7_EXTRACTION_COMPLETED, M7_SESSION_RECORD_GENERATED, M7_SESSION_COMPLETED, M7_SESSION_INCOMPLETE, M7_SESSION_NO_SHOW, M7_EXCEPTION_FILED, M7_EXCEPTION_ACKNOWLEDGED, M7_OFF_PLATFORM_FLAG
- [x] scanMessage wired to platform messaging (POST messages) — fire-and-forget for active mentorship contracts

---

## Env Vars

- `DAILYCO_API_KEY`, `DAILYCO_DOMAIN`, `DAILYCO_WEBHOOK_SECRET`
- `DEEPGRAM_API_KEY` (optional; transcription stub when missing)
- `OPENAI_API_KEY` (extraction; stub when missing)
- Storage abstraction: `STORAGE_PROVIDER=local|vultr`, `LOCAL_STORAGE_PATH` (dev), `VULTR_STORAGE_*` (prod)

---

## Worker Loading

Ensure these workers are imported in your worker runner:

- `lib/queues/workers/steno-extraction.worker.ts`
- `lib/queues/workers/session-record.worker.ts`
- `lib/queues/workers/session-finalise.worker.ts`
- `lib/queues/workers/dailyco-webhook.worker.ts`

---

## Storage Abstraction (M-7 Edit)

- [x] `lib/storage/` — StorageProvider interface; local (filesystem + Redis token) and vultr (S3-compatible) providers
- [x] `GET /api/storage/local/[token]` — dev-only file serving
- [x] Session records, resumes, contracts, invoices use `lib/storage` (provider switch via `STORAGE_PROVIDER`)

## Exit Criteria

- [x] `npm run build` passes
- [x] `tsc --noEmit` passes
- [x] Zod on all API inputs
- [x] External APIs stubbed when keys missing
