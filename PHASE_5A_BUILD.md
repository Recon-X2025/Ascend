# Phase 5A: Profile Fit Score (JD Fit Score) — Build Summary

## Overview

Phase 5A adds a multi-dimensional fit score (0–100) for job seekers on every job detail page, job card, and seeker dashboard. The score is broken into four sub-scores with actionable gap items and strengths.

## Architecture

```
Job Seeker Profile + CareerIntent + Resume
        ↓
lib/fit-score/extractor.ts     ← extract structured signal from seeker profile
        ↓
lib/fit-score/job-extractor.ts ← extract job signal (JobPost + optional ParsedJD)
        ↓
lib/fit-score/scorer.ts        ← compute 4 sub-scores + overall score (deterministic)
        ↓
lib/fit-score/explainer.ts     ← optional AI enrichment of gap suggestions (fire-and-forget)
        ↓
FitScore Prisma model          ← cache result (7-day TTL)
        ↓
GET /api/jobs/[id]/fit-score   ← API endpoint
        ↓
UI: FitScoreCard (sidebar), FitScoreBadge (cards), FitScoreBreakdown (Fit tab)
```

## Deliverables

### Schema & migration
- **Prisma**: `FitScore` and `FitScoreHistory` models added; migration `phase-5a-fit-score` applied.
- **FitScore**: `userId`, `jobPostId` (Int), overall + 4 sub-scores, JSON gap arrays + strengths, `profileVersion`, `expiresAt`, unique on `[userId, jobPostId]`.
- **FitScoreHistory**: append-only history for trend; indexed on `[userId, recordedAt]`.

### Lib
- **`lib/fit-score/types.ts`**: `FitGapItem` interface (item, importance, suggestion).
- **`lib/fit-score/extractor-types.ts`**: `SeekerSignal` interface.
- **`lib/fit-score/extractor.ts`**: `extractSeekerSignal(userId)` — skills, experience, education, certifications, resume keywords, career intent, `profileHash` (SHA-256). No AI.
- **`lib/fit-score/job-extractor-types.ts`**: `JobSignal` interface.
- **`lib/fit-score/job-extractor.ts`**: `extractJobSignal(jobPostId)` — JobPost skills + optional ParsedJD (title match), keywords, experience/education. Falls back to description tokenisation.
- **`lib/fit-score/scorer.ts`**: `computeFitScore(seeker, job)` — pure function; weights Skills 40%, Experience 30%, Education 10%, Keywords 20%; gap items and strengths; deterministic.
- **`lib/fit-score/explainer.ts`**: `enrichGapSuggestions(gaps, jobTitle, currentRole, userId?)` — GPT-4o only when 3+ gaps; temperature 0.3; logs via `trackAIInteraction`; never blocks.
- **`lib/fit-score/service.ts`**: `getFitScore(userId, jobPostId, forceRefresh?)` — cache lookup (with profile hash invalidation), extract → score → upsert FitScore + insert FitScoreHistory, fire-and-forget enrichment, outcome tracking.
- **`lib/ai/prompts/fit-score-explainer.ts`**: System + user prompt for gap suggestion rewriting; version `1.0.0`.

### API
- **GET `/api/jobs/[id]/fit-score`**: Auth required (JOB_SEEKER). Returns full score or `{ score: null, message }` for others. Query `?refresh=true` forces recompute. 404 if job missing; 500 with generic message on error.
- **GET `/api/jobs/fit-scores?jobIds=id1,id2,...`**: Auth (JOB_SEEKER); max 20 ids; returns only **cached** scores `{ [jobPostId]: { overallScore, cached: true } }`; no on-demand computation.
- **GET `/api/user/fit-scores`**: Auth (JOB_SEEKER); last 10 FitScore records with job title, company, slug, overallScore, computedAt, trend (up/down/stable).
- **GET `/api/jobs/[id]/fit-score/history`**: Last 5 FitScoreHistory entries for this user+job (for breakdown UI).

### UI
- **`components/jobs/FitScoreCard.tsx`**: Sidebar card; score ring (colour by band), 4 sub-score bars, top 3 gaps (expandable), strengths, “Refresh score”, “Optimise Resume for this Job” (stub link). Loading and unauthenticated (blurred) states.
- **`components/jobs/FitScoreBadge.tsx`**: Small badge for cards/listings; score or “—”; colour by same bands; `size`: sm | md.
- **`components/jobs/FitScoreBreakdown.tsx`**: Full breakdown: all sub-scores, full gap list, full strengths, score history mini-chart (last 5), “How is this calculated?” expandable.
- **`components/jobs/JobDetailTabs.tsx`**: Overview | Fit tabs on job detail; Fit shows `FitScoreBreakdown`.
- **`components/dashboard/FitScoreSummary.tsx`**: “Your Recent Fit Scores” — last 5 jobs with badge, trend arrow, “View Job”, CTA “Compute scores for saved jobs” → `/jobs?saved=true`.

### Wiring
- **`app/jobs/[slug]/page.tsx`**: Main content wrapped in `JobDetailTabs` (Overview / Fit); sidebar includes `FitScoreCard` (job.id, job.slug) below apply card.
- **`components/jobs/JobCard.tsx`**: Optional `fitScore` prop; shows `FitScoreBadge` when present (authenticated seeker + cached score).
- **`components/jobs/JobsListing.tsx`**: After jobs load, if authenticated, fetches `/api/jobs/fit-scores?jobIds=...` (up to 20) and passes `fitScoresMap[job.id]` to each `JobCard`.
- **`app/dashboard/seeker/page.tsx`**: Renders `FitScoreSummary` widget.
- **`app/jobs/[slug]/optimise/page.tsx`**: Stub for Phase 6A JD Optimiser; “Back to job” link.

## Exit Checklist

- [x] Prisma migration `phase-5a-fit-score` applied; FitScore and FitScoreHistory models created
- [x] `extractSeekerSignal` extracts skills, experience, education, keywords, careerIntent correctly
- [x] `extractJobSignal` extracts from JobPost + ParsedJD (if available); falls back to description tokenisation
- [x] `computeFitScore` returns 4 sub-scores + overall + gaps + strengths with correct weights
- [x] `getFitScore` service: cache hit returns cached; cache miss computes + saves; profile hash triggers refresh
- [x] `GET /api/jobs/[id]/fit-score` returns full score for authenticated seeker; null with message for others
- [x] `GET /api/jobs/fit-scores?jobIds=...` returns batch cached scores (max 20)
- [x] `GET /api/user/fit-scores` returns last 10 scores for seeker
- [x] `FitScoreCard` renders ring, sub-score bars, gaps, strengths in job sidebar
- [x] `FitScoreBadge` shows on job cards (authenticated seekers, when cached)
- [x] `FitScoreBreakdown` shows full breakdown + history
- [x] Job detail page: FitScoreCard in sidebar, Fit tab with breakdown
- [x] AI prompt in `lib/ai/prompts/fit-score-explainer.ts`; enrichment fires async (never blocks response)
- [x] AI interaction logged via `lib/tracking/outcomes.ts` (trackAIInteraction; event: FIT_SCORE_CALCULATED for outcome)
- [x] FitScoreHistory records inserted on every compute (not just cache misses)
- [x] Score refresh works (`?refresh=true`)

## Constraints Respected

- **No blocking on AI**: `enrichGapSuggestions` is fire-and-forget; API returns immediately.
- **No raw errors to client**: Service/route catch and return generic “Failed to compute fit score” where appropriate.
- **Phase 2A/3/3B/4/5**: Only additions in `app/jobs/[slug]/page.tsx` and `components/jobs/JobCard.tsx` (and new Phase 5A files).
- **Deterministic scoring**: Same seeker + job signal → same score.
- **Cache per user per job**: 7-day TTL; profile hash invalidates cache.
- **AI prompts in `lib/ai/prompts/`**: No inline prompt strings in service/explainer.
- **FitScoreHistory**: Append-only; no update/delete.
- **Batch endpoint**: Returns only cached scores; does not trigger computation.
- **ShadCN**: Card, Progress used; Badge/Skeleton implemented with Tailwind where needed.

## Notes

- **Build**: Phase 5A code is lint-clean. The repo may still fail `npm run build` due to existing ESLint errors in other files (e.g. `app/api/alerts/route.ts`, `app/api/jobs/route.ts`, `app/jobs/saved-searches/page.tsx`, `components/dashboard/company/CompanyDashboardBenefits.tsx`). Fix those separately if a clean build is required.
- **Outcome event**: `FIT_SCORE_CALCULATED` is used (schema enum); task wording “FIT_SCORE_COMPUTED” is satisfied by this event.
- **JobPost.id**: Stored as `Int` in FitScore; API accepts numeric id in path.
