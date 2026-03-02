# Phase 16: Data & Analytics Platform — Build Summary

## Overview

Phase 16 builds the **internal analytics platform** for PLATFORM_ADMIN: persona cohort analytics, funnel (registration → persona → context → first action → return), feature usage by persona, seeker journey, and platform health. It is not a public-facing feature; the dashboard surfaces data already captured via existing models plus a lightweight event-tracking layer for gaps.

## Delivered

### 1. Prisma (migration `add-analytics-platform`)

- **AnalyticsEvent:** id, userId, sessionId, event, properties (Json), persona, page, referrer, deviceType, createdAt; indexes on (event, createdAt), (userId, createdAt), (persona, createdAt).
- **DailyMetricSnapshot:** date (unique), totalUsers, newUsersToday, activeUsersToday/Week/Month, persona counts (activeSeekersCount, passiveSeekersCount, earlyCareerCount, recruiterCount, noPersonaCount), funnel (registrationsToday, personaCompletedToday, contextCompletedToday, firstJobViewToday, firstApplicationToday), feature usage (fitScoresRunToday, resumeOptimisationsToday, resumeBuildsToday, mentorSessionsRequested/Completed), platform health (activeJobPostings, applicationsToday, jobsIndexedTotal), createdAt.

### 2. Event tracking library

- **lib/analytics/track.ts:** `track(event, properties?, context?)` — server-side only; writes to AnalyticsEvent (non-throwing). Exports `EVENTS` (user_registered, persona_selected, context_completed, context_skipped, job_viewed, job_saved, job_applied, job_search_performed, fit_score_viewed, resume_optimised, resume_built, salary_page_viewed, company_page_viewed, mentor_*, profile_*, dashboard_visited, return_visit) and `AnalyticsContext` type.
- **Wired into:** `app/api/auth/register/route.ts` (USER_REGISTERED), `app/api/user/persona/route.ts` (PERSONA_SELECTED), `app/api/user/career-context/route.ts` (CONTEXT_COMPLETED), `app/api/onboarding/skip-context/route.ts` (CONTEXT_SKIPPED), `app/api/jobs/[id]/route.ts` GET (JOB_VIEWED), `app/api/jobs/[id]/apply/route.ts` POST (JOB_APPLIED), `app/api/jobs/[id]/fit-score/route.ts` (FIT_SCORE_VIEWED), `app/api/mentorship/sessions/route.ts` POST (MENTOR_SESSION_REQUESTED).

### 3. Daily snapshot cron

- **app/api/cron/daily-snapshot/route.ts:** Auth via `Authorization: Bearer CRON_SECRET`. Snapshot date = yesterday (UTC). Aggregates from User, AnalyticsEvent, MentorSession, JobPost, JobApplication, ParsedJD; computes active users (distinct userId in events for day/week/month). Upserts one DailyMetricSnapshot per date (idempotent).
- **vercel.json:** Cron `30 23 * * *` → `/api/cron/daily-snapshot` (23:30 UTC ≈ midnight IST).

### 4. Analytics API routes (PLATFORM_ADMIN only)

- **GET /api/admin/analytics/overview** — Last 30 days of DailyMetricSnapshot + latest snapshot for stat tiles.
- **GET /api/admin/analytics/funnel?days=7|30|90** — Funnel counts (registered, personaCompleted, contextCompleted, firstJobView, firstApplication) and conversion rates (registrationToPersona, personaToContext, contextToJobView, jobViewToApplication, overallConversion).
- **GET /api/admin/analytics/personas?days=30** — Per-persona: count, avgCompletionScore, avgJobApplications, retentionRate7d, retentionRate30d, topFeatures.
- **GET /api/admin/analytics/features** — Feature usage (totalUses, uniqueUsers, topPersona, topPersonaPct) for last 30 days.
- **GET /api/admin/analytics/retention** — Weekly cohort retention (registration week vs return visits in week 1/2/4).

### 5. Analytics dashboard UI

- **app/dashboard/admin/analytics/page.tsx** — Server component; PLATFORM_ADMIN only (redirect others to `/dashboard`). Renders `AnalyticsClient`.
- **components/dashboard/admin/AnalyticsClient.tsx** — Four tabs: Overview, Funnel, Personas, Platform Health.
  - **Overview:** 6 stat tiles (Total Users, New Today, Active 7d/30d, Total Jobs, Applications Today); line chart (daily new users, last 30 days); persona distribution donut.
  - **Funnel:** Horizontal funnel bars; period selector 7/30/90 days.
  - **Personas:** 4 persona cards (count, avg completion, avg applications, 7d/30d retention, top features); comparison table.
  - **Platform Health:** Feature usage table; platform data tiles (Jobs Indexed, Active Job Posts, Applications Today, Fit scores, Resume optimisations).

### 6. Chart components

- **components/admin/analytics/PersonaColors.ts** — Ascend persona colours (ACTIVE_SEEKER #16A34A, PASSIVE_SEEKER #2563EB, EARLY_CAREER #9333EA, RECRUITER #EA580C, NO_PERSONA #94A3B8) and labels.
- **components/admin/analytics/OverviewLineChart.tsx** — recharts LineChart for daily new users.
- **components/admin/analytics/PersonaDonut.tsx** — recharts PieChart (donut) for persona distribution.
- **components/admin/analytics/FunnelChart.tsx** — Horizontal funnel bars (no recharts).
- **components/admin/analytics/PersonaCard.tsx** — Per-persona metric card.
- **components/admin/analytics/FeatureUsageTable.tsx** — Feature usage table.

### 7. Admin nav

- **components/dashboard/admin/AdminNav.tsx** — Added “Analytics” link → `/dashboard/admin/analytics` (BarChart2 icon).

### 8. Seed script

- **scripts/seed-analytics.ts** — Seeds 30 days of DailyMetricSnapshot with realistic ramp (registrations 5→~40/day, persona split ~45/25/20/10, funnel ~95/80/70/40%). Run: `npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-analytics.ts`.

### 9. Dependencies

- **recharts** (^2.15.0) added to package.json for line and donut charts.

## Key files

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma` (AnalyticsEvent, DailyMetricSnapshot) |
| Track | `lib/analytics/track.ts` |
| Cron | `app/api/cron/daily-snapshot/route.ts` |
| APIs | `app/api/admin/analytics/overview`, `funnel`, `personas`, `features`, `retention` |
| UI | `app/dashboard/admin/analytics/page.tsx`, `components/dashboard/admin/AnalyticsClient.tsx` |
| Charts | `components/admin/analytics/*` |
| Nav | `components/dashboard/admin/AdminNav.tsx` |
| Config | `vercel.json` (cron) |
| Seed | `scripts/seed-analytics.ts` |

## Constraints respected

- globals.css and tailwind.config.ts not modified.
- OutcomeEvent, AIInteraction, UserJourney models unchanged.
- No changes to existing dashboard pages outside `/dashboard/admin/analytics`.
- Only the new daily-snapshot cron added; existing crons unchanged.

## Exit checklist

- [x] Migration runs — AnalyticsEvent and DailyMetricSnapshot tables created.
- [x] lib/analytics/track.ts exports track() and EVENTS.
- [x] track() wired into register, persona, context, job view, application, fit score, mentorship routes.
- [x] GET /api/cron/daily-snapshot runs and creates a snapshot record (CRON_SECRET).
- [x] All 4 analytics API routes return correct data shapes (overview, funnel, personas, features; retention returns cohorts).
- [x] /dashboard/admin/analytics loads for PLATFORM_ADMIN and redirects others.
- [x] Overview tab: stat tiles, line chart, donut chart.
- [x] Funnel tab: horizontal funnel with period selector.
- [x] Personas tab: 4 persona cards + comparison table.
- [x] Platform Health tab: feature usage table + data tiles.
- [x] Seed script populates 30 days of snapshot data.
- [x] Admin nav includes Analytics link.
