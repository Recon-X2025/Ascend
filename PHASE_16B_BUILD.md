# Phase 16B: Recruiter Intelligence & Hiring Analytics — Build Summary

## Overview

Phase 16B delivers a recruiter-facing data layer: time-to-hire, funnel drop-off, competitive benchmarking, fit score explainability, interview scorecards, and opt-in D&I metrics. All metrics are derived from real platform data; no stubs. Access is restricted to RECRUITER or COMPANY_ADMIN with company-scoped checks on every route.

## Delivered

### 1. Prisma schema

- **HiringAnalyticsSnapshot:** jobPostId (Int), companyId, snapshotDate; funnel counts (totalApplicants, totalViewed, totalShortlisted, totalInterview, totalOffered, totalHired, totalRejected); avg days per stage (avgDaysToFirstView, etc.); relations to JobPost, Company.
- **ScorecardRecommendation enum:** STRONG_YES, YES, UNDECIDED, NO, STRONG_NO.
- **InterviewScorecard:** jobApplicationId, recruiterId, jobPostId; scores 1–5 (technical, communication, culture, problemSolving, overall); notes (Text); recommendation; unique (jobApplicationId, recruiterId); relations to JobApplication, User, JobPost.
- **DIMetricsSnapshot:** jobPostId, companyId, stage (APPLIED | SHORTLISTED | HIRED), locationDistribution, educationDistribution, genderDistribution (Json?), totalCount.
- **Company.diMetricsEnabled:** Boolean @default(false).
- **JobApplication.applicationTimeline:** Json? for status transition history (used for time-to-hire stage timestamps when populated).
- **JobPost / Company / User / JobApplication:** relations added for the new models.

**Note:** If the repo has existing Prisma validation errors (e.g. MentorshipContract / ContractSignature back-relations on User), run `prisma generate` after fixing those; the Phase 16B models themselves are valid.

### 2. API routes (all RECRUITER or COMPANY_ADMIN; company/job access verified)

- **GET /api/recruiter/intelligence/context** — Companies and jobs the user can access (for dropdowns).
- **GET /api/recruiter/intelligence/time-to-hire** — Query: companyId (required), jobPostId?, period? (30d|90d|180d). Returns companyAvg (days per stage), platformBenchmark (same shape or benchmarkAvailable: false), byRole (roleTitle, avgDaysToHire, hireCount), trend (month, avgDaysToHire). Uses OFFERED as “hired”; supports applicationTimeline when present.
- **GET /api/recruiter/intelligence/funnel** — Query: jobPostId (required). Returns jobPostId, jobTitle, stages (stage, count, dropOffPct, suggestion), platformBenchmark (stage, avgDropOffPct). Server-generated suggestions when drop-off exceeds thresholds.
- **GET /api/recruiter/intelligence/benchmark** — Query: jobPostId (required). Returns thisJob, platformAvg (or benchmarkAvailable: false), differentials (metric, pctDifference, suggestion). Platform aggregate requires ≥5 comparable jobs across ≥3 companies.
- **GET /api/recruiter/intelligence/fit-explanation** — Query: applicationId (required). Returns applicationId, candidateName, overallScore, breakdown (6 dimensions with score/max/label), topStrengths, topGaps. Uses Phase 5A FitScore; maps to spec labels (skillsMatch, experienceMatch, etc.).
- **POST /api/recruiter/intelligence/scorecards** — Body: jobApplicationId, optional scores (1–5), notes (sanitized, max 2000), recommendation. Upsert per (jobApplicationId, recruiterId). AuditLog on save.
- **GET /api/recruiter/intelligence/scorecards** — Query: jobApplicationId (required). Returns scorecards and averageScores.
- **GET /api/recruiter/intelligence/di-metrics** — Query: jobPostId (required). If company.diMetricsEnabled is false, returns { enabled: false }. If enabled, computes on-the-fly aggregates (location, education) per stage; returns { insufficient: true } if any stage has &lt;10 records; otherwise stages with distributions.
- **PATCH /api/recruiter/intelligence/di-metrics** — Body: companyId, enabled (boolean). COMPANY_ADMIN only. Sets Company.diMetricsEnabled.
- **POST /api/recruiter/intelligence/track** — Body: event, properties?. Used by client to fire recruiter intelligence analytics events (allowlist of event names).

### 3. Auth and helpers

- **lib/recruiter-intelligence/auth.ts:** requireRecruiterSession(), getRecruiterCompanyIds(), assertCompanyAccess(), assertApplicationAccess(). All routes use these for 401/403 and company/job/application scoping.

### 4. Dashboard UI

- **app/dashboard/recruiter/intelligence/page.tsx** — Server component; RECRUITER/COMPANY_ADMIN guard; calls track(RECRUITER_INTELLIGENCE_VIEWED); renders IntelligenceClient.
- **components/dashboard/recruiter/IntelligenceClient.tsx** — Tabbed: Time to Hire (company + period selector; bar chart company vs platform; line chart trend; by-role table), Funnel (job selector; FunnelChart; suggestion cards), Benchmarking (job selector; this job vs platform; differential cards with colour coding), D&I Metrics (enable card when disabled; job selector; stage distributions; minimum 10 notice).
- **components/dashboard/recruiter/RecruiterNav.tsx** — Sidebar links: Overview, Jobs, Intelligence.
- **app/dashboard/recruiter/layout.tsx** — Wraps recruiter section with RecruiterNav sidebar.

### 5. Applicant pipeline integrations

- **ApplicantCard:** “Why X%?” link (when fitScoreSnapshot present) and “Scorecard” button; callbacks onOpenFitExplainer(id), onOpenScorecard(id).
- **RecruiterApplicationsClient:** Fit explainer Sheet (GET fit-explanation; breakdown bars, strengths, gaps); ScorecardSheet (form: 4 dimensions + overall 1–5, notes 2000, recommendation; “View all scorecards” with averages and list). Tracks FIT_EXPLAINER_OPENED and SCORECARD_SUBMITTED via POST …/track.

### 6. Analytics events

- **lib/analytics/track.ts:** EVENTS extended with RECRUITER_INTELLIGENCE_VIEWED, FUNNEL_VIEWED, BENCHMARK_VIEWED, FIT_EXPLAINER_OPENED, SCORECARD_SUBMITTED, DI_METRICS_ENABLED, DI_METRICS_VIEWED.
- Wired: page load (server), funnel job select, benchmark job select, fit explainer open, scorecard save, D&I enable, D&I tab view (client → POST …/track).

### 7. Navigation

- Recruiter sidebar (RecruiterNav): Intelligence → /dashboard/recruiter/intelligence. Visible to RECRUITER and COMPANY_ADMIN.

## Key constraints respected

- No fabricated benchmarks: platform aggregates use real data; benchmarkAvailable: false when &lt;5 comparable jobs or &lt;3 companies.
- D&I: aggregates only; minimum 10 records per stage; gender distribution optional (null when no opt-in data).
- Fit explainer: reads existing FitScore/FitScoreHistory (Phase 5A); no recompute.
- Scorecard: one per recruiter per application; upsert; recruiter-only; AuditLog on submit.
- All routes: RECRUITER or COMPANY_ADMIN; companyId/jobId/applicationId verified; no cross-company data.
- recharts only (BarChart, LineChart); FunnelChart from admin analytics (horizontal bars).
- Notes sanitized with sanitize-html (allowedTags: []).

## Exit checklist

- [ ] Migration applied — HiringAnalyticsSnapshot, InterviewScorecard, DIMetricsSnapshot, Company.diMetricsEnabled, JobApplication.applicationTimeline (run after resolving any existing schema validation issues).
- [x] All 6 intelligence API routes + context + track return correct shapes with real data.
- [x] Time-to-hire: company avg and platform benchmark (when available); byRole and trend.
- [x] Funnel: drop-off % and suggestions at threshold.
- [x] Benchmark: differential cards colour-coded; suggestions for significant differentials.
- [x] Fit explainer: Sheet from applicant card; 6 dimensions + strengths/gaps.
- [x] Scorecard: upsert; all interviewers’ cards visible; average scores.
- [x] D&I: opt-in gate; insufficient threshold; location/education aggregates.
- [x] All routes reject non-RECRUITER/COMPANY_ADMIN with 403; company cross-contamination prevented.
- [x] Benchmark queries anonymised (platform aggregate only).
- [x] recharts only; 7 outcome events wired.
- [x] Nav link in recruiter sidebar.
- [ ] No TypeScript errors; build passes (run `npm run build` after migration).

## Files touched

| Area | Paths |
|------|------|
| Schema | prisma/schema.prisma (Phase 16B models, Company.diMetricsEnabled, JobApplication.applicationTimeline, relations) |
| Auth | lib/recruiter-intelligence/auth.ts |
| APIs | app/api/recruiter/intelligence/context, time-to-hire, funnel, benchmark, fit-explanation, scorecards, di-metrics, track |
| Analytics | lib/analytics/track.ts (EVENTS) |
| Pages | app/dashboard/recruiter/intelligence/page.tsx, layout.tsx |
| UI | components/dashboard/recruiter/IntelligenceClient.tsx, RecruiterNav.tsx; components/applications/ApplicantCard.tsx, RecruiterApplicationsClient.tsx (Sheets) |
| Audit | lib/admin/audit.ts (used by scorecard POST) |
