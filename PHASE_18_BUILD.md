# Phase 18: B2B / Enterprise & API Platform — Build Summary

## Overview

Phase 18 adds the full B2B/Enterprise layer: public REST API v1, ATS webhook ingestion, Enterprise plan enforcement, white-label careers pages, bulk import/export, developer portal, API usage tracking, and admin enterprise management.

## Delivered

### 1. Prisma Schema

- **CompanyApiKey:** companyId, createdById, name, keyHash, keyPrefix, environment (LIVE/TEST), scopes, lastUsedAt, expiresAt, revokedAt.
- **ApiUsageLog:** apiKeyId, endpoint, method, statusCode, latencyMs; index [apiKeyId, createdAt].
- **AtsWebhookEvent:** companyId, provider (GREENHOUSE/LEVER/WORKDAY/GENERIC), eventType, payload, processed, processedAt, error.
- **CareersPageConfig:** companyId, customDomain, logoUrl, primaryColor, accentColor, heroTitle, heroSubtitle, hideAscendBranding, isActive.
- **BulkImportJob:** companyId, userId, type (JOB_POSTS/CANDIDATES), status (PENDING/PROCESSING/COMPLETED/FAILED), totalRows, processed, failed, errorLog, s3Key.
- **CompanyWebhook:** companyId, url, secret, events, isActive.
- **AtsIntegration:** companyId, provider, webhookSecret, apiKey, isActive.
- **SsoConfig:** companyId, provider, entryPoint, certificate, issuer, isActive.
- **OutcomeEventType:** PHASE18_API_KEY_CREATED, PHASE18_API_KEY_REVOKED, PHASE18_API_REQUEST_MADE, PHASE18_ATS_EVENT_RECEIVED, PHASE18_ATS_EVENT_PROCESSED, PHASE18_CAREERS_PAGE_VIEWED, PHASE18_BULK_IMPORT_COMPLETED, PHASE18_WEBHOOK_DELIVERED.

### 2. API Key Infrastructure

- **lib/api/keys.ts:** generateApiKey (SHA-256 hash, plaintext shown once), validateApiKey, hasScope, revokeApiKey.
- **lib/api/middleware.ts:** withApiAuth — Bearer extraction, validation, Enterprise gate, scope check, Redis rate limit (1000/hr), usage logging, PHASE18_API_REQUEST_MADE (5% sample).
- **lib/api/usage.ts:** getUsageSummary(companyId, from, to).

### 3. Plan / Gate

- **lib/payments/plans.ts:** RECRUITER_ENTERPRISE limits: apiAccess, whiteLabel, ssoEnabled, bulkImport, atsWebhooks, customDomain, maxApiKeys: 10, apiRequestsPerHour: 1000.
- **lib/payments/gate.ts:** canCompanyUseFeature(companyId, feature).

### 4. REST API v1 (`/api/v1/`)

- **GET/POST /api/v1/jobs** — list (status, page, limit, search, location, department) and create; job post limit check; webhook job.created.
- **GET/PATCH/DELETE /api/v1/jobs/[id]** — get, update, soft-delete; webhook job.closed on status change or delete.
- **GET /api/v1/applications**, **GET/PATCH /api/v1/applications/[id]** — list, get, update status.
- **GET /api/v1/candidates**, **GET /api/v1/candidates/[id]** — candidates who applied.
- **GET/POST /api/v1/webhooks** — list and create outbound webhooks.
- **POST /api/v1/bulk/jobs/import**, **GET /api/v1/bulk/jobs/import/[id]** — CSV/JSON upload (max 500 rows), import status.
- **GET /api/v1/bulk/applications/export** — CSV export.

### 5. ATS Webhook Ingestion

- **POST /api/webhooks/ats/greenhouse**, **/lever**, **/workday**, **/api/webhooks/ats/generic/[companyId]** — store AtsWebhookEvent, queue ats-webhook-processor, return 200.
- **ats-webhook-processor worker:** application.created → create Application; candidate.hired → update status to HIRED; mark processed.

### 6. BullMQ Workers

- **bulk-import:** Parse CSV/JSON, create JobPost rows, update BulkImportJob; PHASE18_BULK_IMPORT_COMPLETED.
- **webhook-delivery:** POST to webhook URL with X-Ascend-Signature HMAC-SHA256; 3 retries exponential backoff; PHASE18_WEBHOOK_DELIVERED.
- **ats-webhook-processor:** Process AtsWebhookEvent; PHASE18_ATS_EVENT_PROCESSED.

### 7. Outbound Webhooks

- **lib/api/webhooks.ts:** queueWebhookDeliveries(companyId, event, payload) — queues delivery for matching CompanyWebhooks.
- **Wired:** application.created (apply route), application.status_changed (v1 PATCH), job.created (v1 POST), job.closed (v1 PATCH/DELETE).

### 8. White-Label Careers Page

- **/careers/[companySlug]:** Public page; CareersPageConfig (logo, primary color, hero title/subtitle); lists OPEN + PUBLIC jobs; hideAscendBranding for Enterprise; PHASE18_CAREERS_PAGE_VIEWED (10% sample).
- **lib/careers/domain-resolver.ts:** resolveDomainToSlug with Redis 5min TTL.
- **middleware.ts:** Custom domain → rewrite to /careers/[slug]; fetch /api/internal/domain-slug.
- **/dashboard/company/careers** — CareersConfigClient (hero title/subtitle, Enterprise only).
- **/api/companies/me/careers-config** — GET/PATCH.

### 9. Dashboard Pages

- **/dashboard/company/api** — CompanyApiClient: 4 tabs (API Keys, Usage, Webhooks, ATS Integration).
- **/dashboard/company/sso** — SsoConfigClient: SSO config form (pending activation).
- **/dashboard/admin/enterprise** — AdminEnterpriseClient: Enterprise companies list.
- **/api/admin/enterprise** — GET companies with plan RECRUITER_ENTERPRISE.

### 10. Developer Portal

- **/developers** — Overview (auth, rate limits, environments).
- **/developers/reference** — API reference.
- **/developers/webhooks** — Webhook event reference.
- **/developers/changelog** — Changelog.

### 11. Outcome Events

- PHASE18_API_KEY_CREATED — lib/api/keys.ts generateApiKey.
- PHASE18_API_KEY_REVOKED — lib/api/keys.ts revokeApiKey.
- PHASE18_API_REQUEST_MADE — lib/api/middleware.ts (5% sample).
- PHASE18_ATS_EVENT_RECEIVED — ATS webhook handlers (greenhouse, lever, workday, generic).
- PHASE18_ATS_EVENT_PROCESSED — ats-webhook-processor worker.
- PHASE18_CAREERS_PAGE_VIEWED — /careers/[companySlug] (10% sample).
- PHASE18_BULK_IMPORT_COMPLETED — bulk-import worker.
- PHASE18_WEBHOOK_DELIVERED — webhook-delivery worker.

## Key Files

| Area | Paths |
|------|------|
| Schema | `prisma/schema.prisma` |
| API keys | `lib/api/keys.ts`, `lib/api/middleware.ts`, `lib/api/usage.ts`, `lib/api/webhooks.ts` |
| v1 API | `app/api/v1/jobs/`, `app/api/v1/applications/`, `app/api/v1/candidates/`, `app/api/v1/webhooks/`, `app/api/v1/bulk/` |
| ATS | `app/api/webhooks/ats/`, `lib/queues/workers/ats-webhook-processor.worker.ts` |
| Workers | `lib/queues/workers/bulk-import.worker.ts`, `lib/queues/workers/webhook-delivery.worker.ts` |
| Careers | `app/careers/[companySlug]/page.tsx`, `lib/careers/domain-resolver.ts`, `app/api/internal/domain-slug/route.ts` |
| Company | `app/dashboard/company/careers/page.tsx`, `app/dashboard/company/api/page.tsx`, `app/dashboard/company/sso/page.tsx` |
| Admin | `app/dashboard/admin/enterprise/page.tsx`, `app/api/admin/enterprise/route.ts` |
| Developers | `app/developers/`, `app/developers/reference/`, `app/developers/webhooks/`, `app/developers/changelog/` |

## Constraints Respected

- API keys never stored plaintext; SHA-256 hash only.
- v1 API immutable; company-scoped always.
- Enterprise gate (canCompanyUseFeature) on all /api/v1/* routes.
- ATS ingestion async; webhook handlers return 200 immediately.
- Custom domain routing via Redis cache (5 min TTL).
- Bulk import max 500 rows.
- Rate limit 1000 req/hr per API key (Redis sliding window).
- SSO config-only (no live SAML handshake).

## Exit Checklist

- [x] Prisma schema: CompanyApiKey, ApiUsageLog, AtsWebhookEvent, CareersPageConfig, BulkImportJob, CompanyWebhook, AtsIntegration, SsoConfig.
- [x] lib/api/keys.ts, middleware.ts, usage.ts, webhooks.ts.
- [x] REST API v1: jobs, applications, candidates, webhooks, bulk import/export.
- [x] ATS webhook ingestion (greenhouse, lever, workday, generic) + ats-webhook-processor.
- [x] webhook-delivery worker (outbound, HMAC-SHA256, 3 retries).
- [x] bulk-import worker.
- [x] PLAN_LIMITS Enterprise; canCompanyUseFeature gate.
- [x] /careers/[companySlug]; custom domain middleware; /dashboard/company/careers.
- [x] /dashboard/company/api (4 tabs), /dashboard/company/sso.
- [x] /developers (overview, reference, webhooks, changelog).
- [x] /dashboard/admin/enterprise; /api/admin/enterprise.
- [x] 8 outcome events wired.
- [x] tsc --noEmit and npm run build pass.
