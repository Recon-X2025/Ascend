# Phase 20: Platform Intelligence & Investor Metrics — Build Summary

## Overview

Phase 20 adds a **private, read-only metrics layer** for internal leadership and board-level reporting. It is not the public-facing analytics dashboard (Phase 16) but a deeper, acquisition-narrative-ready view of platform health, growth, retention, and monetisation. Access is **PLATFORM_ADMIN only**; the investor dashboard is intentionally low-profile (direct URL, not linked from main admin nav).

**Scope:** Prisma models (`InvestorSnapshot`, `MetricAlert`), platform intelligence library, admin investor APIs, daily cron, and `/dashboard/admin/investor` with North Star, key metrics, trend charts, retention cohorts, metric alerts, and CSV export.

---

## Delivered

### 1. Prisma schema (migration `phase20_platform_intelligence`)

- **InvestorSnapshot:** Single row per day (`snapshotDate` unique). Fields: totalUsers, newUsersToday, dau, wau, mau, dauMauRatio; activeSeekers, profileCompletionAvg, resumesGenerated, applicationsSubmitted; activeCompanies, activeRecruiters, jobPostsActive, avgApplicantsPerJob; mentorsVerified, activeEngagements, verifiedOutcomes, outcomeVerificationRate; mrrInr, mrrUsd, arpu, payingUsers, churnRate, ltv; referralConversionRate, viralCoefficient, organicSignupRate; aiInteractionsToday, aiInteractions30d, resumeOptimisations, fitScoresComputed.
- **MetricAlert:** metric, threshold, direction (ABOVE/BELOW), message, triggeredAt, resolvedAt, isActive.
- **OutcomeEventType:** PHASE20_SNAPSHOT_COMPUTED, PHASE20_METRIC_ALERT_TRIGGERED, PHASE20_METRIC_ALERT_RESOLVED, PHASE20_INVESTOR_DASHBOARD_VIEWED.

Run when DB is ready: `npx prisma migrate dev --name phase20_platform_intelligence`.

### 2. lib/intelligence/platform.ts

- **computeInvestorSnapshot(snapshotDate)** — Computes all snapshot fields from existing DB (AnalyticsEvent, User, JobSeekerProfile, ResumeVersion, JobApplication, JobPost, Company, MentorshipContract, MentorshipOutcome, UserSubscription, CompanySubscription, PaymentEvent, AIInteraction, OptimisationSession, FitScore). MRR from active subscriptions; exchange rate from env `EXCHANGE_RATE_USD_INR` (default 84). Idempotent upsert by snapshotDate.
- **getRetentionCohorts()** — 90-day cohort table: users by registration week, retention % at W1/W2/W4/W8/W12 from AnalyticsEvent activity.
- **getNorthStarMetric()** — Weekly Active Mentorship Engagements: ACTIVE contracts with ≥1 EngagementSession in last 7 days; trend vs prior week.
- **getRevenueWaterfall()** — Last 6 months: newMrr, expansionMrr, churnedMrr, netNewMrr from PaymentEvent.
- **checkMetricAlerts()** — Compares latest InvestorSnapshot to active MetricAlert thresholds; sets triggeredAt/resolvedAt; sends ops email on trigger.

### 3. Email

- **lib/email/templates/investor/metric-alert-triggered.ts** — Sends to OPS_EMAIL with metric, threshold, direction, current value, message.

### 4. APIs (all PLATFORM_ADMIN only)

| Route | Method | Description |
|-------|--------|-------------|
| /api/admin/investor/snapshot | GET | Latest snapshot + vsLastWeek + vsLastMonth (percent/delta) |
| /api/admin/investor/snapshots | GET | ?days=7\|30\|90 — list for charting |
| /api/admin/investor/retention | GET | Cohort retention table |
| /api/admin/investor/revenue | GET | Revenue waterfall (6 months) |
| /api/admin/investor/north-star | GET | North star value + trend |
| /api/admin/investor/alerts | GET, POST | List alerts; create (Zod-validated) |
| /api/admin/investor/alerts/[id] | PATCH | Update isActive, threshold, direction, message (Zod) |

### 5. Cron

- **GET /api/cron/investor-snapshot** — Protected by CRON_SECRET. Computes snapshot for yesterday, upserts InvestorSnapshot, runs checkMetricAlerts(), logs AuditLog SYSTEM / INVESTOR_SNAPSHOT_COMPUTED.
- **vercel.json** — Cron schedule `0 19 * * *` (19:00 UTC = 00:30 IST).

### 6. Dashboard

- **/dashboard/admin/investor** — Server page: session + PLATFORM_ADMIN check; redirect otherwise.
- **InvestorDashboardClient** — North Star card; 2×3 key metrics grid (DAU/MAU, MRR INR, Paying Users, Churn, Viral Coefficient, Verified Outcomes) with vs-last-week; Recharts: user growth (DAU/WAU/MAU 30d), MRR trend (30d), revenue waterfall (6 months), AI usage (30d); retention cohort table (heatmap W1/W2/W4/W8/W12); metric alerts list + Add Alert form + toggle enable/disable; Export Snapshot (CSV). Sampled PHASE20_INVESTOR_DASHBOARD_VIEWED on view (~50%).

### 7. Outcome events

- PHASE20_SNAPSHOT_COMPUTED — Logged via AuditLog from cron (no OutcomeEvent userId for system).
- PHASE20_METRIC_ALERT_TRIGGERED / RESOLVED — Handled in checkMetricAlerts (email sent; no OutcomeEvent for system).
- PHASE20_INVESTOR_DASHBOARD_VIEWED — Client POST /api/track, sampled on dashboard load.

---

## Key files

| Area | Paths |
|------|------|
| Schema | `prisma/schema.prisma` (InvestorSnapshot, MetricAlert, PHASE20_* enum) |
| Intelligence | `lib/intelligence/platform.ts` |
| Email | `lib/email/templates/investor/metric-alert-triggered.ts` |
| APIs | `app/api/admin/investor/snapshot/route.ts`, `snapshots/route.ts`, `retention/route.ts`, `revenue/route.ts`, `north-star/route.ts`, `alerts/route.ts`, `alerts/[id]/route.ts` |
| Cron | `app/api/cron/investor-snapshot/route.ts` |
| Config | `vercel.json` (cron) |
| Dashboard | `app/dashboard/admin/investor/page.tsx`, `components/dashboard/admin/InvestorDashboardClient.tsx` |

---

## Exit checklist (from build prompt)

- [x] Prisma migration: phase20_platform_intelligence — InvestorSnapshot, MetricAlert.
- [x] lib/intelligence/platform.ts — computeInvestorSnapshot, getRetentionCohorts, getNorthStarMetric, getRevenueWaterfall, checkMetricAlerts.
- [x] GET /api/admin/investor/snapshot (with vsLastWeek, vsLastMonth).
- [x] GET /api/admin/investor/snapshots?days=.
- [x] GET /api/admin/investor/retention.
- [x] GET /api/admin/investor/revenue.
- [x] GET /api/admin/investor/north-star.
- [x] GET/POST /api/admin/investor/alerts, PATCH /api/admin/investor/alerts/[id].
- [x] GET /api/cron/investor-snapshot (daily 00:30 IST), vercel.json.
- [x] /dashboard/admin/investor — North Star, key metrics grid, 4 trend charts, retention cohort table, alerts panel, CSV export.
- [x] 4 outcome events wired (snapshot via AuditLog; alerts via email; dashboard viewed sampled).
- [ ] `npx prisma migrate dev --name phase20_platform_intelligence` — run when DB available.
- [x] tsc --noEmit and npm run build — must pass.

---

*Phase 20 — Platform Intelligence & Investor Metrics | Ascend | PLATFORM_ADMIN only | Read-only + alert management*
