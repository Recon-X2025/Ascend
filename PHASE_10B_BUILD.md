# Phase 10B: Candidate Intelligence Dashboard — Build Summary

## Overview

Phase 10B adds a **Career Intelligence** layer to the seeker dashboard: data-driven cards (Market Value, Profile Visibility Score, Skills Gap, Application Performance, Best Time to Apply) with premium gating, background computation via BullMQ, and a weekly Monday digest email.

## Deliverables

### Prisma
- **CandidateInsightSnapshot** model: userId (unique), marketValueMin/Max/Median/Basis/At, visibilityScore/visibilityFactors, skillsGapData/skillsGapAt, appPerformanceData/appPerformanceAt, heatmapData/heatmapAt, computedAt, updatedAt.
- Migration: `20260301190000_phase10b_candidate_intelligence` (run when DB is in sync).

### Plan limits (lib/payments/plans.ts)
- **candidate_intelligence_market_value**: Market Value card (Premium/Elite only).
- **candidate_intelligence_skills_gap_full**: Full skills gap beyond top 3 (Premium/Elite only).

### Intelligence computation (lib/intelligence/)
- **candidate.ts**: computeMarketValue, computeVisibilityScore, computeSkillsGap, computeApplicationPerformance, computeHeatmap, computeWeeklyDigest, saveSnapshot. All logic here; no raw Prisma in routes.
- **visibility.ts**: Factor scoring (completeness, keyword density, recency, application activity, social proof) and recommendations.
- **heatmap.ts**: buildHeatmapFromDates, toPeriodHeatmap, getBestPeriod (day × period from JobPost.createdAt, IST).

### API
- **GET /api/intelligence/candidate**: Session-gated; returns full snapshot. If snapshot &gt;24h or missing, enqueues refresh and returns `stale: true`. Premium gates: market value and full skills gap server-side; gated fields null with premiumRequired* flags.
- **POST /api/intelligence/candidate/refresh**: Session-gated; rate limit 3/24h (Redis); enqueues compute job; returns `{ queued: true, estimatedSeconds: 10 }`.

### BullMQ
- **Queue**: `compute-candidate-intelligence` (CandidateIntelligenceJobData: userId).
- **Worker** (lib/queues/workers/candidate-intelligence.worker.ts): Runs computeMarketValue, computeVisibilityScore, computeSkillsGap, computeApplicationPerformance, computeHeatmap; saveSnapshot; partial failure OK.
- **Queue**: `weekly-digest` (WeeklyDigestJobData: userId).
- **Worker** (lib/queues/workers/weekly-digest.worker.ts): Loads user (marketingConsent, role), computeWeeklyDigest, sendWeeklyDigestEmail.

### Cron
- **GET /api/cron/candidate-intelligence**: CRON_SECRET; enqueues compute job for all JOB_SEEKER users (e.g. Sunday 11pm IST).
- **GET /api/cron/weekly-digest**: CRON_SECRET; enqueues weekly digest for all JOB_SEEKER with marketingConsent (e.g. Monday 7am IST).

### Dashboard widgets (components/dashboard/intelligence/)
- **CareerIntelligenceSection**: Single SWR on GET /api/intelligence/candidate; section header “Career Intelligence” + Refresh button; 2-col grid.
- **MarketValueCard**: Premium blur + lock + CTA when premiumRequired; empty state “Add your salary”; link to salary/roles/[slug] or /salary.
- **VisibilityScoreCard**: Score ring (red &lt;40, amber 41–70, green 71+); factor bars; up to 3 recommendations; “Edit profile”.
- **SkillsGapCard**: Target role; top 3 free / all 10 premium; frequency bar + urgency badge; blur overlay for free beyond 3; “Find courses” → /jobs.
- **ApplicationPerformanceCard**: 2×2 tiles (Applied, Response Rate, Avg Days to Response, Shortlist Rate); industry avg ~15%; tip for optimiser when below avg; empty state “Browse jobs”.
- **BestTimeToApplyCard**: Heatmap 7×3 (days × morning/afternoon/evening); green opacity by volume; best period line; empty when &lt;100 jobs or no target role.
- **IntelligenceSkeleton**: Loading skeletons per card.

### Email
- **lib/email/templates/weekly-digest.ts**: sendWeeklyDigestEmail(to, WeeklyDigestData); subject “Your weekly career snapshot — [FirstName]”; market value, visibility score + top recommendation, top 3–5 missing skills, application stats, best time line; CTA “View full dashboard”; unsubscribe link to /settings/privacy.

### Integration
- **SeekerDashboardClient**: CareerIntelligenceSection rendered below existing widgets (ErrorBoundary).

## Key Files

| File | Purpose |
|------|---------|
| prisma/schema.prisma | CandidateInsightSnapshot, User.candidateInsightSnapshot |
| prisma/migrations/20260301190000_phase10b_candidate_intelligence/migration.sql | Migration |
| lib/payments/plans.ts | candidate_intelligence_market_value, candidate_intelligence_skills_gap_full |
| lib/intelligence/candidate.ts | All compute + saveSnapshot |
| lib/intelligence/visibility.ts | Visibility factors + recommendations |
| lib/intelligence/heatmap.ts | Heatmap from JobPost dates |
| app/api/intelligence/candidate/route.ts | GET snapshot |
| app/api/intelligence/candidate/refresh/route.ts | POST refresh (rate limited) |
| lib/queues/index.ts | candidateIntelligenceQueue, weeklyDigestQueue, job types |
| lib/queues/workers/candidate-intelligence.worker.ts | Compute snapshot worker |
| lib/queues/workers/weekly-digest.worker.ts | Send digest worker |
| app/api/cron/candidate-intelligence/route.ts | Enqueue compute for all seekers |
| app/api/cron/weekly-digest/route.ts | Enqueue digest for opted-in seekers |
| components/dashboard/intelligence/*.tsx | Section + 5 cards + skeletons |
| lib/email/templates/weekly-digest.ts | Monday digest email |
| components/dashboard/seeker/SeekerDashboardClient.tsx | Renders CareerIntelligenceSection |

## Design Notes

- Brand: Parchment #F7F6F1, Green #16A34A, Ink #0F1A0F.
- Visibility ring: SVG circle, stroke-dashoffset; red &lt;40, amber 41–70, green 71+.
- Heatmap: green opacity scale; tooltip with count per cell.
- Market value: ₹XL – ₹YL / year; median below; basis line; source badge.
- Premium blur: blur(6px) + overlay + lock + “Upgrade to Premium” CTA.

## Exit checklist

- [x] CandidateInsightSnapshot migrated (migration file created; run when DB ready)
- [x] Plan limits and canUseFeature used server-side for market value and full skills gap
- [x] Single GET returns full snapshot; stale triggers background refresh
- [x] Manual refresh rate-limited 3/24h
- [x] Worker computes all 5 metrics and saves; weekly digest worker sends to marketingConsent seekers
- [x] All 5 cards with loading, empty, and populated states
- [x] Monday digest email template; cron routes for compute and digest
- [x] Career Intelligence section on seeker dashboard with Refresh button
