# Phase 11 — AI Features — Build Summary

## Status: ✅ Complete

Phase 11 activates platform-wide AI features using existing Pre-Phase 2 infrastructure (BullMQ, prompt registry, outcome tracking). No new AI infra; new queues only for cover letter, interview prep, and profile optimise.

---

## Exit Checklist

- [x] `CoverLetter` model + migrate
- [x] `InterviewPrep` model + migrate
- [x] `ProfileOptimiserResult` model + migrate
- [x] `JobDismissal` model + migrate
- [x] `JobApplication.coverLetterId` optional FK + migrate
- [x] `lib/ai/prompts/cover-letter.ts` — prompt + version
- [x] `lib/ai/prompts/interview-prep.ts` — prompt + version
- [x] `lib/ai/prompts/profile-optimiser.ts` — prompt + version
- [x] BullMQ `cover-letter` worker
- [x] BullMQ `interview-prep` worker
- [x] BullMQ `profile-optimise` worker
- [x] `POST /api/ai/cover-letter` + `GET /api/ai/cover-letter/[jobId]` (rate limited 5/day)
- [x] `POST /api/ai/interview-prep` + `GET /api/ai/interview-prep/[jobId]` (rate limited 3/day)
- [x] `POST /api/ai/profile-optimise` + `GET /api/ai/profile-optimise/result` (rate limited 1/48h, Redis cache)
- [x] `GET /api/jobs/recommended` with JobDismissal support; `POST /api/jobs/[id]/dismiss`
- [x] Salary prediction verified/updated in `lib/intelligence/candidate.ts` (adjustments, confidence)
- [x] Cover letter UI on `/jobs/[id]/apply` and job detail (generate, copy, download, attach)
- [x] Interview prep page `/jobs/[slug]/interview-prep` (status-gated: SHORTLISTED or INTERVIEW_SCHEDULED)
- [x] Profile optimiser card on seeker dashboard
- [x] "Recommended for You" row on seeker dashboard (replaces placeholder)
- [x] EVENTS constants added + wired (cover letter, interview prep, profile optimiser, recommendation dismissed/applied, suggestion copied)
- [x] Feature flags: cover_letter_generator, interview_prep, profile_optimiser, smart_recommendations
- [x] Premium gate on Profile Optimiser (skill gaps + bullet rewrites via `canUseFeature('profileOptimiser')`)
- [x] All rate limits in place (Redis)
- [x] `npm run build` green

---

## Implementation Notes

### 11.1 — Cover Letter Generator

- **Models:** `CoverLetter` (userId, jobPostId, content, tone, generatedFrom), unique on (userId, jobPostId). `JobApplication.coverLetterId` optional.
- **Queue:** `cover-letter`; worker in `lib/queues/workers/cover-letter.worker.ts`. Fetches user, job post, profile, career intent, fit score strengths; optional ParsedJD for responsibilities/tone. Uses `buildCoverLetterMessages()` from `lib/ai/prompts/cover-letter.ts`.
- **APIs:** `POST /api/ai/cover-letter` (body: jobId, resumeVersionId?, optionalNote); `GET /api/ai/cover-letter/[jobId]`. Rate limit: 5 generations per user per day (Redis key `cover-letter:limit:{userId}`).
- **UI:** Apply form has "Generate Cover Letter" (poll until ready), editable textarea, Copy, Download .txt, Regenerate; checkbox "Include this cover letter with my application" sets `coverLetterId` on submit. Outcome: `COVER_LETTER_GENERATED`, `COVER_LETTER_ATTACHED_TO_APPLICATION`.

### 11.2 — Interview Question Generator

- **Models:** `InterviewPrep` (userId, jobPostId, expectQuestions Json, askQuestions Json), unique on (userId, jobPostId).
- **Queue:** `interview-prep`; worker in `lib/queues/workers/interview-prep.worker.ts`. Uses JD (ParsedJD or job description), fit score gaps, profile experience. Prompt in `lib/ai/prompts/interview-prep.ts`.
- **APIs:** `POST /api/ai/interview-prep` (body: jobId); `GET /api/ai/interview-prep/[jobId]`. Rate limit: 3 per user per day.
- **UI:** "Prepare for Interview" in job detail sidebar when application status is SHORTLISTED or INTERVIEW_SCHEDULED. Page `/jobs/[slug]/interview-prep` with two sections (questions to expect / questions to ask); "why this question" per expect item. Outcome: `INTERVIEW_PREP_GENERATED`.

### 11.3 — Profile Strength Analyser

- **Models:** `ProfileOptimiserResult` (userId unique, result Json, analysedAt, promptVersion). Result shape: headline, summary, skillGaps, bulletSuggestions.
- **Queue:** `profile-optimise`; worker in `lib/queues/workers/profile-optimise.worker.ts`. Aggregates top 50 ParsedJDs for target role; compares profile; prompt in `lib/ai/prompts/profile-optimiser.ts`.
- **APIs:** `POST /api/ai/profile-optimise` (queues job); `GET /api/ai/profile-optimise/result`. Rate limit: 1 per user per 48h. Redis cache `profile-optimise:{userId}` TTL 48h; invalidate on profile update.
- **Premium:** Headline + summary free; skill gaps + bullet rewrites require `canUseFeature('profileOptimiser', userId)`. Plan limits in `lib/payments/plans.ts`.
- **UI:** Card on seeker dashboard; "Last analysed" + Refresh; copy suggestion, deep-link to profile edit. Outcome: `PROFILE_OPTIMISER_RUN`, `PROFILE_SUGGESTION_COPIED`.

### 11.4 — Smart Job Recommendations

- **Models:** `JobDismissal` (userId, jobPostId unique). No new AI; uses CareerIntent, top skills, ParsedJD similarity → active JobPost via Typesense, then `computeFitScore()` (Phase 5A). Excludes viewed, applied, saved, dismissed.
- **APIs:** `GET /api/jobs/recommended` (5 jobs, fit ≥60%, cache 6h per user); `POST /api/jobs/[id]/dismiss` (record dismissal).
- **UI:** "Recommended for You" horizontal row on seeker dashboard; card with fit badge, Save, Apply, "Why this?" tooltip (top 2 skills), "Not interested" (dismiss). Outcomes: `JOB_RECOMMENDATION_DISMISSED`, `JOB_RECOMMENDATION_APPLIED`.

### 11.5 — Salary Prediction (Profile-Based)

- **Logic:** Extends `computeMarketValue()` in `lib/intelligence/candidate.ts`. Base: market median for role+location; adjustments: experience delta (±5% per year), premium skills (+3% each, max +15%), postgrad (+5%), verified employer tenure (+7%), location. Returns `estimatedRange`, `marketMedian`, `adjustments[]`, `confidence` (low/medium/high from data volume). Stored in Phase 10B `CandidateInsightSnapshot.marketValue`; weekly refresh.
- **UI:** Market Value card on `/dashboard/seeker/intelligence` (Phase 10B); no new UI in Phase 11.

### Feature Flags & Events

- **Flags:** cover_letter_generator, interview_prep, profile_optimiser, smart_recommendations (all default ON for pilot). Admin toggle in `/dashboard/admin` → Feature Flags.
- **Events:** COVER_LETTER_GENERATED, COVER_LETTER_ATTACHED_TO_APPLICATION, INTERVIEW_PREP_GENERATED, PROFILE_OPTIMISER_RUN, PROFILE_SUGGESTION_COPIED, JOB_RECOMMENDATION_DISMISSED, JOB_RECOMMENDATION_APPLIED. Defined in `lib/analytics/track.ts` and used in APIs/UI.

### Migration

- Migration name: `phase_11_ai_features`
- New models: CoverLetter, InterviewPrep, ProfileOptimiserResult, JobDismissal
- Modified: JobApplication.coverLetterId (optional)

If `prisma migrate dev` fails (e.g. shadow DB issues), apply schema with `npx prisma db push` and document in deployment notes.

### Workers

- New workers: cover-letter, interview-prep, profile-optimise. Registered in `lib/queues/index.ts`; worker files in `lib/queues/workers/`. Ensure a worker process (or deploy step) runs these queues in production.

---

## Files Touched (Summary)

- **Prisma:** schema.prisma (CoverLetter, InterviewPrep, ProfileOptimiserResult, JobDismissal; JobApplication.coverLetterId)
- **Prompts:** lib/ai/prompts/cover-letter.ts, interview-prep.ts, profile-optimiser.ts
- **Queues:** lib/queues/index.ts; lib/queues/workers/cover-letter.worker.ts, interview-prep.worker.ts, profile-optimise.worker.ts
- **APIs:** app/api/ai/cover-letter/*, app/api/ai/interview-prep/*, app/api/ai/profile-optimise/*, app/api/jobs/recommended/route.ts, app/api/jobs/[id]/dismiss/route.ts; app/api/jobs/[id]/apply/route.ts (coverLetterId, tracking)
- **Logic:** lib/jobs/recommended.ts, lib/intelligence/candidate.ts (computeMarketValue)
- **UI:** components/applications/ApplyForm.tsx, app/jobs/[slug]/interview-prep/page.tsx, components/jobs/InterviewPrepClient.tsx, JobDetailSidebar.tsx, components/dashboard/seeker/ProfileOptimiserCard.tsx, RecommendedJobsCard.tsx, SeekerDashboardClient.tsx
- **Analytics/plans:** lib/analytics/track.ts (EVENTS), lib/payments/plans.ts (profileOptimiser), seed (feature flags)

---

Build completed; `npm run build` passes (warnings only: no-img-element, exhaustive-deps).
