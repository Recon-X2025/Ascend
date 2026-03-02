# Phase 6A: JD Resume Optimiser — Build Summary

## Overview

Phase 6A implements the **JD Resume Optimiser**: from an existing base `ResumeVersion` and a target `JobPost`, the system produces a new job-specific `ResumeVersion` tailored to that JD. All AI work runs via BullMQ; no synchronous AI in HTTP handlers.

**Core constraint:** The AI may only rewrite, reorder, or rephrase content that exists in the candidate’s profile. It must never invent, infer, or add skills, responsibilities, or experience. JD keywords with no profile evidence are listed as gaps, not filled in.

## Deliverables

### Prisma
- **ResumeVersion**: `optimisedFrom` (String?), `optimisationMeta` (Json?), relations `sourceVersion` / `derivedVersions` (OptimisedVersions), `optimisationSessionsAsBase` / `optimisationSessionsAsOutput`; `jobPost` relation named `JobPostResumeVersions`.
- **OptimisationSession**: id, userId, jobPostId (Int), baseVersionId, outputVersionId, status (OptimisationStatus), fitScoreBefore/After, gapAnalysis (Json), errorMessage, timestamps; relations to User, JobPost, ResumeVersion (base + output).
- **OptimisationStatus** enum: PENDING, PROCESSING, DONE, FAILED.
- **OutcomeEventType**: RESUME_OPTIMISED added.
- Migration: `phase-6a-optimiser`.

### AI prompts
- **lib/ai/prompts/jd-optimiser.ts**: `JD_OPTIMISER_SYSTEM_PROMPT` (fabrication-prevention rules, sourceRef, fabricationRisk), `JD_OPTIMISER_USER_PROMPT(input)` (job + profile data + required JSON shape).

### Queue & worker
- **lib/queues/jd-optimiser.queue.ts**: `JD_OPTIMISER_QUEUE`, `JdOptimiserJobData`, `jdOptimiserQueue`, `enqueueOptimisation()`.
- **lib/queues/workers/jd-optimiser.worker.ts**: Fetches base version, job post (with skills), JobSeekerProfile (experiences with achievements → bullets, skills, educations, projects); builds prompt; calls OpenAI GPT-4o JSON mode; merges rewritten summary/bullets/skills into base `contentSnapshot`; creates new ResumeVersion with `jobPostId`, `optimisedFrom`, `optimisationMeta`; updates session to DONE/FAILED; `trackAIInteraction` (JD_OPTIMISER); `trackOutcome` (RESUME_OPTIMISED).

### APIs
- **POST /api/resume/optimise**: Body `{ jobPostId, baseVersionId }`; auth; rate limit 10/user/day (Redis); validate base version ownership and ACTIVE job; create OptimisationSession; enqueue job; return `{ sessionId, status }` 202.
- **GET /api/resume/optimise/[sessionId]**: Auth; return session status, fitScoreBefore/After, gapAnalysis, errorMessage, outputVersion, jobSlug.
- **GET /api/resume/optimised-versions**: Auth; list ResumeVersions where `jobPostId != null` with jobPost (id, title, slug, companyName).
- **GET /api/resume/versions**: Supports `?baseOnly=true` (filter `jobPostId` null).

### UI
- **OptimiseResumeButton** (job detail): Dialog to select base version (useResumeVersions `baseOnly`), POST optimise, redirect to session page.
- **app/dashboard/resume/optimise/[sessionId]/page.tsx**: Polls session; status card; gap analysis (present/missing keywords); “View optimised resume” → /resume/versions; “Apply with this version” → /jobs/[jobSlug]/apply when jobSlug present.
- **OptimisedVersionsList**: Fetches `/api/resume/optimised-versions`; section on /resume/versions “Optimised for specific jobs”.
- **hooks/useResumeVersions.ts**: Fetches versions (optional `baseOnly`), returns `{ versions, isLoading, error, refetch }`.
- **Job detail page**: Renders OptimiseResumeButton for authenticated JOB_SEEKER when job is ACTIVE.

### Rate limiting & outcomes
- Rate limit in POST optimise: `checkRateLimit(\`optimise:${userId}\`, 10, 86400)`.
- On session DONE: `trackOutcome(userId, RESUME_OPTIMISED, { metadata: sessionId, jobPostId, baseVersionId, outputVersionId, bulletsRewritten, keywordsCovered, keywordsGapped })`.

## Key Files

| File | Purpose |
|------|---------|
| `lib/ai/prompts/jd-optimiser.ts` | System + user prompts; no fabrication |
| `lib/queues/jd-optimiser.queue.ts` | Queue + enqueueOptimisation |
| `lib/queues/workers/jd-optimiser.worker.ts` | BullMQ worker; AI + merge + create version |
| `app/api/resume/optimise/route.ts` | POST create session + enqueue |
| `app/api/resume/optimise/[sessionId]/route.ts` | GET poll session |
| `app/api/resume/optimised-versions/route.ts` | GET JD-specific versions |
| `components/resume/OptimiseResumeButton.tsx` | CTA on job detail |
| `app/dashboard/resume/optimise/[sessionId]/page.tsx` | Progress + result + gap analysis |
| `components/resume/OptimisedVersionsList.tsx` | Dashboard list |
| `hooks/useResumeVersions.ts` | Base versions for optimiser |

## Schema notes

- **JobPost.id** is Int; **ResumeVersion.jobPostId** and **OptimisationSession.jobPostId** are Int.
- **ResumeVersion** uses **contentSnapshot** (not `content`) for version body.
- Profile data for the prompt comes from **JobSeekerProfile** (experiences with **achievements** as bullets, skills via UserSkill+Skill, educations, projects).

## Worker bootstrap

Ensure the JD optimiser worker is loaded when running the worker process (e.g. import `lib/queues/workers/jd-optimiser.worker` in your worker entrypoint so the process processes the `jd-optimiser` queue).

## Exit checklist

- [x] OptimisationSession model migrated; ResumeVersion has optimisedFrom, optimisationMeta, relations
- [x] AI prompt includes fabrication-prevention constraint and output schema
- [x] Worker runs end-to-end; creates JD-specific ResumeVersion with jobPostId set
- [x] POST /api/resume/optimise returns sessionId immediately (202)
- [x] GET /api/resume/optimise/[sessionId] returns status, gapAnalysis, outputVersion, jobSlug
- [x] UI polls and shows gap analysis on DONE; missing keywords as gaps only
- [x] OptimisedVersionsList on /resume/versions
- [x] Rate limit 10/user/day on POST optimise
- [x] AI interaction and RESUME_OPTIMISED outcome logged
- [x] No inline prompt strings outside lib/ai/prompts
- [x] No direct Prisma in client components
