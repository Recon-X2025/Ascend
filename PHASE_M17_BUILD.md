# M-17: Mentorship Analytics & Insights — Build Summary

## Overview

M-17 adds three analytics layers on a single daily snapshot foundation: (1) platform analytics for PLATFORM_ADMIN, (2) mentor own analytics dashboard, (3) mentee engagement history and progress. This is the final milestone before pilot opens.

## Deliverables

### 1. Prisma

- **Migration:** `20260308000000_m17_mentorship_analytics` (or `npx prisma migrate dev --name m17_mentorship_analytics` when DB is ready).
- **MentorshipAnalyticsSnapshot:** snapshotDate (unique), active/new/completed/stalled engagements, avg engagement days, outcomes (submitted/verified/disputed, verification rate, avg time to outcome, six-month check-in rate), mentors (total/verified/active, mentorsByTier, avgDisputeRate, highDisputeRateMentors), sessions (total/this week, avg per engagement), milestonesCompletedRate.
- **MentorAnalyticsSnapshot:** mentorId + snapshotDate (unique), applications (received/accepted/declined, acceptance rate), engagements (active/completed/total, completion rate), outcomes (submitted/verified/disputed, outcome rate), sessions completed, avg sessions per engagement, currentTier, verifiedOutcomeCount, disputeRate.
- **User:** relation `mentorAnalyticsSnapshots` (MentorAnalyticsSnapshot[]).
- **OutcomeEventType:** M17_SNAPSHOT_COMPUTED, M17_MENTOR_SNAPSHOT_COMPUTED, M17_PLATFORM_ANALYTICS_VIEWED, M17_MENTOR_ANALYTICS_VIEWED, M17_MENTEE_ANALYTICS_VIEWED.

### 2. lib/mentorship/analytics.ts

- **computePlatformSnapshot(snapshotDate)** — Idempotent upsert on snapshotDate. Stalled = ACTIVE contracts with no EngagementSession in last 14 days. Six-month check-in rate from MentorshipOutcome.checkInStatus (COMPLETED / total with check-in).
- **computeMentorSnapshot(mentorId, snapshotDate)** — Upsert on (mentorId, snapshotDate).
- **computeAllMentorSnapshots(snapshotDate, onSampled?)** — Batched 50 at a time, 100ms delay; optional ~10% sample callback for M17_MENTOR_SNAPSHOT_COMPUTED.
- **getTransitionOutcomeBreakdown()** — Top 10 transitions by engagement count (transition, engagements, verifiedOutcomes, outcomeRate, avgDays).
- **getDisputeRateByTier()** — { RISING, ESTABLISHED, ELITE } dispute rates.
- **getMentorProgressToNextTier(mentorId)** — currentTier, nextTier, verifiedOutcomes, requiredForNext, remaining, progressPercent, blockers.
- **getMenteeEngagementSummary(menteeId)** — applicationsSubmitted, engagementsCompleted/Active, goalsAchieved, actionItemsPending, sixMonthCheckinDue, checkinsCompleted.

### 3. APIs

| Route | Access | Description |
|-------|--------|-------------|
| GET /api/admin/mentorship/analytics/overview | PLATFORM_ADMIN | Latest snapshot + delta7d/delta30d; M17_PLATFORM_ANALYTICS_VIEWED (10% sample) |
| GET /api/admin/mentorship/analytics/snapshots?days=7\|30\|90 | PLATFORM_ADMIN | Daily snapshots (Zod-validated) |
| GET /api/admin/mentorship/analytics/transitions | PLATFORM_ADMIN | Top 10 transition breakdown |
| GET /api/admin/mentorship/analytics/dispute-by-tier | PLATFORM_ADMIN | Dispute rate per tier |
| GET /api/admin/mentorship/analytics/mentors?page=&limit= | PLATFORM_ADMIN | Paginated mentors with latest snapshot |
| GET /api/mentorship/analytics/me | Mentor (self) | Latest snapshot + trend30d; M17_MENTOR_ANALYTICS_VIEWED |
| GET /api/mentorship/analytics/me/snapshots?days=7\|30\|90 | Mentor (self) | Daily snapshots for charts |
| GET /api/mentorship/analytics/me/tier-progress | Mentor (self) | getMentorProgressToNextTier() |
| GET /api/mentorship/analytics/me/engagements?filter=active\|completed\|all | Mentor (self) | Engagements (mentee first name only) |
| GET /api/mentorship/analytics/mentee/me | Mentee (self) | getMenteeEngagementSummary(); M17_MENTEE_ANALYTICS_VIEWED |
| GET /api/mentorship/analytics/mentee/me/engagements | Mentee (self) | List (mentor first name + transition type only) |

### 4. Cron

- **GET /api/cron/mentorship-analytics-snapshot** — CRON_SECRET; schedule 01:00 IST (`30 19 * * *` UTC). Runs computePlatformSnapshot(), computeAllMentorSnapshots() (with 10% M17_MENTOR_SNAPSHOT_COMPUTED), MentorshipAuditLog (SYSTEM, ANALYTICS_SNAPSHOT_COMPUTED), M17_SNAPSHOT_COMPUTED. Returns { mentorsProcessed, snapshotDate }.
- **vercel.json:** Entry added for mentorship-analytics-snapshot.

### 5. Platform Analytics (6th tab in /dashboard/admin/mentorship)

- **Tab:** "Analytics" in MentorshipOpsClient (TabsList grid-cols-7).
- **Content:** 6 metric cards (Active Engagements, Outcome Verification Rate, Avg Time to Outcome, Avg Mentor Dispute Rate, Sessions This Week, Milestone Completion Rate) with trend vs prior period; 4 recharts (engagement trends 30d line, outcome funnel bar, avg time to outcome trend 30d line, tier distribution donut); top 10 transition table; dispute-by-tier table (colour-coded green &lt;10%, amber 10–25%, red &gt;25%).

### 6. Mentor Analytics Dashboard

- **Route:** /dashboard/mentor/analytics (MentorProfile required).
- **Layout:** app/dashboard/mentor/layout.tsx — MentorDashboardNav (Dashboard, Tier history, Analytics).
- **Page:** MentorAnalyticsClient — Performance card (acceptance/completion/outcome/dispute rate, colour-coded, trend30d); Tier progress card (badge, progress bar, “X more to reach [Next Tier]”, blockers, link to tier-history); Engagements table (mentee first name, type, start, status, sessions, milestones X/Y, outcome); filter active/completed/all; trend charts only if ≥4 data points (sessions/week bar, outcome rate line); Earnings stub text only.
- **Nav:** “Analytics” in MentorDashboardNav.

### 7. Mentee Analytics

- **Route:** /dashboard/mentee/engagements.
- **Page:** MenteeEngagementsClient — 5-card strip (Applications Submitted, Engagements Active/Completed, Goals Achieved, Action Items Pending); engagements list (mentor first name + transition type only, start date, status, milestones X/Y, outcome status, check-in status); ACTIVE → “View Engagement”; VERIFIED → “Check-in complete ✓” or check-in date.
- **Hub:** “My Progress” card in MentorshipHubClient when user has ≥1 engagement (goals achieved, active count, link to /dashboard/mentee/engagements).

### 8. Outcome events

- M17_SNAPSHOT_COMPUTED — cron (snapshotDate, activeEngagements, outcomeVerificationRate).
- M17_MENTOR_SNAPSHOT_COMPUTED — cron, 10% sample (mentorId, outcomeRate, disputeRate).
- M17_PLATFORM_ANALYTICS_VIEWED — admin overview, 10% sample (adminId).
- M17_MENTOR_ANALYTICS_VIEWED — mentor analytics/me.
- M17_MENTEE_ANALYTICS_VIEWED — mentee analytics/me.

## Key files

| Area | Paths |
|------|------|
| Schema | prisma/schema.prisma (MentorshipAnalyticsSnapshot, MentorAnalyticsSnapshot, User.mentorAnalyticsSnapshots, OutcomeEventType M17_*) |
| Migration | prisma/migrations/20260308000000_m17_mentorship_analytics/migration.sql |
| Lib | lib/mentorship/analytics.ts |
| Admin APIs | app/api/admin/mentorship/analytics/overview, snapshots, transitions, dispute-by-tier, mentors |
| Mentor APIs | app/api/mentorship/analytics/me, me/snapshots, me/tier-progress, me/engagements |
| Mentee APIs | app/api/mentorship/analytics/mentee/me, mentee/me/engagements |
| Cron | app/api/cron/mentorship-analytics-snapshot/route.ts |
| Platform tab | components/dashboard/admin/MentorshipOpsClient.tsx (Analytics tab, PlatformAnalyticsTab) |
| Mentor UI | app/dashboard/mentor/layout.tsx, analytics/page.tsx; components/mentorship/mentor-dashboard/MentorDashboardNav.tsx, MentorAnalyticsClient.tsx |
| Mentee UI | app/dashboard/mentee/layout.tsx, engagements/page.tsx; components/mentorship/MenteeEngagementsClient.tsx |
| Hub card | components/mentorship/MentorshipHubClient.tsx (My Progress) |
| Config | vercel.json (cron) |

## Pilot gate

**After `npm run build` passes:** In the admin dashboard go to **Feature Flags** and set **seeker_pilot_open** to **true** to open the seeker pilot.

## Exit checklist

- [x] Prisma migration m17_mentorship_analytics (or migration file created)
- [x] lib/mentorship/analytics.ts — 7 functions
- [x] GET /api/admin/mentorship/analytics/overview, snapshots, transitions, dispute-by-tier, mentors
- [x] GET /api/mentorship/analytics/me, me/snapshots, me/tier-progress, me/engagements
- [x] GET /api/mentorship/analytics/mentee/me, mentee/me/engagements
- [x] GET /api/cron/mentorship-analytics-snapshot (01:00 IST, vercel.json)
- [x] Analytics 6th tab in /dashboard/admin/mentorship (6 cards, 4 recharts, transition table, dispute-by-tier table)
- [x] /dashboard/mentor/analytics (performance, tier progress, engagements, trend charts conditional, earnings stub)
- [x] Analytics in mentor nav
- [x] /dashboard/mentee/engagements (5-card strip, engagements list; no PII beyond first name + transition)
- [x] /mentorship hub “My Progress” card when ≥1 engagement
- [x] 5 outcome events wired
- [x] tsc --noEmit passes
- [x] npm run build passes
- [ ] Set seeker_pilot_open = true in Feature Flags (manual step after build)

## Build fixes (post-delivery)

- **Resend:** Added `@react-email/render` (^1.4.0) to satisfy Resend's optional peer dependency so the build resolves the module.
- **Lint/type:** Resolved ESLint and TypeScript errors across the repo (unused vars/imports, conditional hooks, `any` types, etc.).
- **Featured route:** Set `export const dynamic = "force-dynamic"` on `/api/mentorship/mentors/featured` so the route is not statically prerendered at build time (avoids Prisma errors when DB schema or env differs).
