# M-16: Admin & Ops Layer — Build Summary

## Overview

M-16 is the **unified mentorship operations centre** for PLATFORM_ADMIN. It consolidates mentorship admin surfaces, adds mentor monitoring, wires an immutable audit trail across the full mentorship lifecycle, and enforces Zero Trust constraints on ops actions. It does **not** build M-9 (Dispute Resolution); it provides the ops infrastructure (dispute queue shell, SLA tracking, admin constraint layer) that will support it.

---

## Deliverables Checklist

- [x] Prisma migration: `m16_admin_ops_layer` — MentorshipAuditLog, OpsAlert; MentorshipAuditCategory, OpsAlertType enums; ContractStatus extended with PAUSED
- [x] `lib/mentorship/audit.ts` — logMentorshipAction (wraps MentorshipAuditLog + AuditLog); never throws; 10% sampled M16_AUDIT_LOG_WRITTEN
- [x] Audit wired into: verifyOTPAndSign (CONTRACT_SIGNED), createContract (CONTRACT_CREATED), expireUnsignedContracts (CONTRACT_EXPIRED), submitOutcomeClaim, verifyOutcome, disputeOutcome, opsReviewOutcome, recalculateMentorTier (TIER_RECALCULATED), admin tier override (TIER_OVERRIDDEN)
- [x] `lib/mentorship/ops-alerts.ts` — createOpsAlert (idempotent on type+entityId), resolveOpsAlert, checkAndCreateAlerts (7 checks; STENO_FAILURE stub)
- [x] GET `/api/admin/mentorship/overview` — dashboard stats (verification, engagements, outcomes, mentors, alerts)
- [x] GET `/api/admin/mentorship/audit-log` — paginated, filterable (category, actorId, entityType, entityId, from, to)
- [x] GET `/api/admin/mentorship/alerts` — list with filters; PATCH `/api/admin/mentorship/alerts/[id]` — mark read / resolve
- [x] GET `/api/admin/mentorship/engagements` — list with stalled/overdue flags; GET `/api/admin/mentorship/engagements/[contractId]` — full detail
- [x] POST `/api/admin/mentorship/engagements/[contractId]/intervene` — WARN_MENTOR, WARN_MENTEE, PAUSE_ENGAGEMENT (reason min 20 chars; Zero Trust: warn/pause only)
- [x] GET `/api/admin/mentorship/mentors` — monitoring list; GET `/api/admin/mentorship/mentors/[mentorId]` — full ops view
- [x] GET `/api/cron/mentorship-ops-check` — daily 08:00 IST (02:30 UTC); CRON_SECRET; checkAndCreateAlerts, ops digest email if critical/high in 24h, OPS_CHECK_COMPLETE audit
- [x] `/dashboard/admin/mentorship` — unified ops hub (5 tabs: Overview, Engagements, Mentor Monitoring, Audit Log, Alerts)
- [x] Overview: alerts panel, 6 metric cards, SLA strip
- [x] Engagements tab: table with flags, colour coding, link to detail; detail page with intervene form
- [x] Mentor Monitoring tab: dispute rate colour coding, link to mentor detail
- [x] Audit Log tab: table with filters; export note (API + client CSV)
- [x] Alerts tab: list, resolve button
- [x] "Mentorship Ops" in admin nav with unread alert count badge; links to verification, outcomes, tiers
- [x] PAUSED contract: engagement dashboard "Paused by Ops" banner; capacity (ACTIVE+PAUSED count); tier GET/PATCH and enforceCapacity use ACTIVE+PAUSED
- [x] Resend templates: ops-daily-digest, mentor-warning, mentee-warning, engagement-paused
- [x] Outcome events: M16_OPS_ALERT_CREATED, M16_OPS_ALERT_RESOLVED, M16_ENGAGEMENT_INTERVENED, M16_AUDIT_LOG_WRITTEN (10% sample), M16_OPS_CHECK_COMPLETE
- [x] `tsc --noEmit` passes
- [ ] `npm run build` — may fail on pre-existing Resend/@react-email dependency; M-16 code is type-correct
- [ ] Run migration when DB available: `npx prisma migrate dev --name m16_admin_ops_layer`

---

## File List

### Prisma
- `prisma/schema.prisma` — MentorshipAuditLog, OpsAlert; MentorshipAuditCategory, OpsAlertType; ContractStatus PAUSED; OutcomeEventType M16_*

### Lib
- `lib/mentorship/audit.ts` — logMentorshipAction
- `lib/mentorship/ops-alerts.ts` — createOpsAlert, resolveOpsAlert, checkAndCreateAlerts

### Wired audit
- `lib/mentorship/contract.ts` — CONTRACT_CREATED, CONTRACT_SIGNED, CONTRACT_EXPIRED
- `lib/mentorship/outcomes.ts` — OUTCOME_SUBMITTED, OUTCOME_VERIFIED, OUTCOME_DISPUTED, OUTCOME_OPS_REVIEWED
- `lib/mentorship/tiers.ts` — TIER_RECALCULATED
- `app/api/mentorship/mentors/[mentorId]/tier/route.ts` — TIER_OVERRIDDEN

### API routes
- `app/api/admin/mentorship/overview/route.ts`
- `app/api/admin/mentorship/audit-log/route.ts`
- `app/api/admin/mentorship/alerts/route.ts`
- `app/api/admin/mentorship/alerts/[id]/route.ts`
- `app/api/admin/mentorship/engagements/route.ts`
- `app/api/admin/mentorship/engagements/[contractId]/route.ts`
- `app/api/admin/mentorship/engagements/[contractId]/intervene/route.ts`
- `app/api/admin/mentorship/mentors/route.ts`
- `app/api/admin/mentorship/mentors/[mentorId]/route.ts`
- `app/api/cron/mentorship-ops-check/route.ts`

### Email templates
- `lib/email/templates/mentorship/ops-daily-digest.ts`
- `lib/email/templates/mentorship/mentor-warning.ts`
- `lib/email/templates/mentorship/mentee-warning.ts`
- `lib/email/templates/mentorship/engagement-paused.ts`

### UI
- `components/dashboard/admin/MentorshipOpsClient.tsx` — 5-tab hub
- `components/dashboard/admin/AdminNav.tsx` — Mentorship Ops link + unread badge
- `app/dashboard/admin/mentorship/page.tsx` — hub page
- `app/dashboard/admin/mentorship/engagements/[contractId]/page.tsx` — engagement detail + intervene
- `app/dashboard/admin/mentorship/mentors/[mentorId]/page.tsx` — mentor ops detail
- `components/mentorship/EngagementDashboardClient.tsx` — PAUSED banner

### Config
- `vercel.json` — cron mentorship-ops-check at 30 2 * * *

### Capacity / PAUSED
- `lib/mentorship/tiers.ts` — enforceCapacity counts ACTIVE+PAUSED
- `app/api/mentorship/mentors/[mentorId]/tier/route.ts` — GET activeMenteeCount ACTIVE+PAUSED

---

## Constraints (Enforced)

1. **MentorshipAuditLog** — append-only; no UPDATE/DELETE or PATCH API for audit records.
2. **Intervene API** — WARN_MENTOR, WARN_MENTEE, PAUSE_ENGAGEMENT only; no escrow, outcome verification, tier override, or record deletion.
3. **Audit failures** — do not break primary actions; logMentorshipAction is try/catch.
4. **Alert deduplication** — createOpsAlert skips if unresolved alert exists for same (type, entityId).
5. **Ops digest email** — only when new critical/high alerts in last 24h (OPS_EMAIL env).
6. **PAUSED** — counts against mentor capacity; not freed until contract leaves ACTIVE/PAUSED.

---

## Env / Config

- `M16_SYSTEM_ACTOR_ID` — optional; used for cron/system audit entries (e.g. CONTRACT_EXPIRED, OPS_CHECK_COMPLETE, TIER_RECALCULATED when no admin).
- `OPS_EMAIL` — optional; recipient for ops daily digest and outcome-disputed copy.
- `CRON_SECRET` — required for `/api/cron/mentorship-ops-check`.

---

## Exit Criteria

- Unified Mentorship Ops hub at `/dashboard/admin/mentorship` with Overview, Engagements, Mentor Monitoring, Audit Log, Alerts.
- All mentorship lifecycle actions (contract, outcome, tier) write to MentorshipAuditLog and platform AuditLog.
- Ops can intervene with warn/pause only; PAUSED engagements show banner and still count toward capacity.
- Daily cron runs checks and creates alerts; digest email when critical/high in 24h.
- `tsc --noEmit` passes; build may fail on existing Resend dependency.
