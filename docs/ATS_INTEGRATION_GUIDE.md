# ATS Integration Guide (BL-21)

Phase 18 built ATS integration infrastructure. This guide covers live API key setup and testing.

## Supported ATS

| Provider | Model | Status |
|----------|-------|--------|
| Greenhouse | AtsIntegration | Config collection done; live keys pending |
| Lever | AtsIntegration | Config collection done; live keys pending |
| Workday | AtsIntegration | Config collection done; live keys pending |

## Schema

- **AtsIntegration:** `companyId`, `provider`, `apiKey`, `webhookSecret`, `isActive`
- **AtsWebhookEvent:** Incoming events; idempotency via `processed`

## Setup Steps

1. Obtain sandbox API keys from each ATS provider.
2. Store in `AtsIntegration.apiKey` (encrypted at rest).
3. Configure webhook URLs in ATS admin.
4. Test: Job sync (create/update/close), application sync, candidate push/pull.
5. Process: Sandbox → production per provider docs.

## Per-Provider Notes

- **Greenhouse:** Uses API key in header; check rate limits and scopes.
- **Lever:** OAuth or API key; webhook signing via HMAC.
- **Workday:** Requires tenant-specific configuration.

## Cron: Missed Webhook Recovery

Consider a daily job to poll ATS for events not received via webhook.
