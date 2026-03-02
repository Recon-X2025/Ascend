# Phase 4: Job Post Creation & Listing — Build

**Project:** Ascend  
**Phase:** 4 — Job Post Creation & Listing  
**Build date:** 2025-02-27

---

## Goal

Build the full job post creation flow for recruiters and the public job listing + job detail pages for job seekers. Phase 3 company overview is unchanged; reviews, Q&A, interviews, salary, and company admin dashboard are not required for Phase 4.

---

## Task Map (4.1 – 4.7)

| #    | Task | Deliverables |
|------|------|--------------|
| 4.1  | Prisma schema | `JobPost` (full fields, slug, status, recruiterId, companyId, etc.), `JobPostSkill`, `JobScreeningQuestion`, `SavedJob`; enums JobType, EducationLevel, JobStatus, ScreeningQuestionType; indexes. |
| 4.2  | Job post form | `/jobs/post-a-job`; RECRUITER/COMPANY_ADMIN; sections: Basics, Role Details, Skills, Compensation, Application Settings; Save as Draft / Publish; React Hook Form + Zod. |
| 4.3  | Job listing | `/jobs`; GET /api/jobs (filters, sort, pagination); JobCard; JobFilters; SaveJobButton; SavedJob model + POST save. |
| 4.4  | Job detail | `/jobs/[slug]`; server-rendered; sanitized description; skills; Apply CTA; CompanySnippetCard; SimilarJobs; view count; Report stub. |
| 4.5  | Permissions & lifecycle | `lib/jobs/permissions.ts` (isJobOwner, canManageJob); DRAFT → ACTIVE → PAUSED → CLOSED; `lib/jobs/deadline.ts` (closeExpiredJobs); cron `/api/cron/close-expired-jobs`. |
| 4.6  | API routes | GET/POST /api/jobs; GET/PATCH/DELETE /api/jobs/[id]; POST save, report, duplicate, view; GET fit-score stub. |
| 4.7  | Recruiter dashboard | `/dashboard/recruiter/jobs`; list jobs (all statuses); Post a New Job; Edit link; duplicate via API. |

---

## Routes

| Route | Purpose |
|-------|---------|
| `/jobs` | Public job listing; filters, sort, pagination. |
| `/jobs/[slug]` | Job detail (server-rendered); apply CTA, save, company snippet, similar jobs. |
| `/jobs/post-a-job` | Create job (RECRUITER/COMPANY_ADMIN); draft/publish. |
| `/dashboard/recruiter/jobs` | Recruiter job list; Post a New Job; Edit. |
| `/api/jobs` | GET list (filters, sort, pagination); POST create. |
| `/api/jobs/[id]` | GET (with view increment), PATCH, DELETE (soft close). |
| `/api/jobs/[id]/save` | POST toggle save/unsave. |
| `/api/jobs/[id]/report` | POST stub (log). |
| `/api/jobs/[id]/duplicate` | POST clone as DRAFT. |
| `/api/jobs/[id]/view` | POST fire-and-forget view count. |
| `/api/jobs/[id]/fit-score` | GET stub. |
| `/api/cron/close-expired-jobs` | GET; CRON_SECRET; closeExpiredJobs(). |
| `/api/queues/jobs/[jobId]` | BullMQ job status (moved from /api/jobs/[jobId]). |

---

## Key Files

### Prisma & migrations

- `prisma/schema.prisma` — JobPost (slug, title, description, type, workMode, locations, salary*, experience*, educationLevel, openings, deadline, easyApply, applicationUrl, tags, status, viewCount, applicationCount, companyId, companyName, recruiterId, publishedAt, etc.); JobPostSkill; JobScreeningQuestion; SavedJob; enums; indexes. Run: `npx prisma migrate dev --name phase-4-job-posts`.

### Lib

- `lib/jobs/permissions.ts` — isJobOwner, canManageJob (recruiterId or company admin).
- `lib/jobs/slug.ts` — slugifyTitle, jobSlug(title, id).
- `lib/jobs/deadline.ts` — closeExpiredJobs().
- `lib/jobs/queries.ts` — getJobBySlug, getSimilarJobs, getJobsForListing, getCompanyRatingForJob; jobListInclude, jobDetailInclude.
- `lib/validations/job.ts` — jobBaseSchema, createJobSchema (with refinements), updateJobSchema (base.partial).

### API

- `app/api/jobs/route.ts` — GET list, POST create (slug, skills, screeningQuestions).
- `app/api/jobs/[id]/route.ts` — GET (view increment, company rating, similar jobs), PATCH, DELETE.
- `app/api/jobs/[id]/save/route.ts` — POST toggle SavedJob.
- `app/api/jobs/[id]/report/route.ts` — POST stub.
- `app/api/jobs/[id]/duplicate/route.ts` — POST clone.
- `app/api/jobs/[id]/view/route.ts` — POST increment viewCount.
- `app/api/jobs/[id]/fit-score/route.ts` — GET stub.
- `app/api/cron/close-expired-jobs/route.ts` — GET; CRON_SECRET; closeExpiredJobs.
- `app/api/queues/jobs/[jobId]/route.ts` — BullMQ job status (resume generation polling).

### UI — Jobs

- `app/jobs/page.tsx` — Listing; JobsListing client component.
- `app/jobs/[slug]/page.tsx` — Job detail (server); getJobBySlug, company rating, similar jobs; ViewCountTracker; JobDetailSidebar; ReportJobButton; CompanySnippetCard; SimilarJobs.
- `app/jobs/post-a-job/page.tsx` — Auth + role check; JobPostForm.
- `app/dashboard/recruiter/jobs/page.tsx` — Recruiter job list; Post a New Job; Edit link.

### UI — Components

- `components/jobs/JobCard.tsx` — Card for listing (title, company, locations, work mode, type, salary, tags, save button).
- `components/jobs/JobFilters.tsx` — Filters state + UI (keyword, location, job type, work mode, date posted, easy apply, include not disclosed).
- `components/jobs/JobsListing.tsx` — Client listing with filters, sort, pagination.
- `components/jobs/SaveJobButton.tsx` — Heart toggle; optimistic UI.
- `components/jobs/ViewCountTracker.tsx` — Client; POST view on mount.
- `components/jobs/JobDetailSidebar.tsx` — Apply CTA, Copy link, Save, views/applicants.
- `components/jobs/ReportJobButton.tsx` — Report job (POST).
- `components/jobs/CompanySnippetCard.tsx` — Company logo, name, industry, size, rating, View Company.
- `components/jobs/SimilarJobs.tsx` — List of similar job links.
- `components/jobs/JobPostForm.tsx` — Multi-section form; Save as Draft / Publish; Zod + RHF.

---

## Integration Notes

- **JobPost** no longer has `company` or `role`; use `companyName`, `title`, and `companyId` (FK to Company). Resume version API and `ResumeVersionsList` use `jobPost.title`, `jobPost.companyName`, `jobPost.companyId`.
- **Queue job status** (resume generation polling) moved from `/api/jobs/[jobId]` to `/api/queues/jobs/[jobId]` to avoid dynamic segment conflict with `/api/jobs/[id]` (JobPost by numeric id). `AIContentStep` updated to poll the new URL.
- **Job description** and company **about** are sanitized with `lib/html/sanitize.ts` (sanitize-html).

---

## Phase 4 Exit Checklist

- [x] Prisma models created (JobPost, JobPostSkill, JobScreeningQuestion, SavedJob); run `npx prisma migrate dev --name phase-4-job-posts`.
- [x] Job post form: create with sections, save as draft, publish.
- [x] Edit job: load via query param; PATCH /api/jobs/[id].
- [x] Job listing (/jobs): ACTIVE jobs, filters, sort, pagination.
- [x] Job card: all fields, save button.
- [x] Job detail (/jobs/[slug]): layout, sanitized description, skills, apply CTA, company snippet, similar jobs.
- [x] Save/unsave job (API + SaveJobButton).
- [x] Recruiter permissions (canManageJob) on write routes.
- [x] Job lifecycle: DRAFT/ACTIVE/PAUSED/CLOSED; deadline cron stub.
- [x] Recruiter dashboard job list; duplicate API.
- [x] Fit-score and report stubs; view count increment.
- [x] Description sanitized on store and render.

---

## Run / Deploy

1. **Database:** `npx prisma migrate dev --name phase-4-job-posts` (or deploy existing migrations).
2. **Cron:** Set `CRON_SECRET`; call `GET /api/cron/close-expired-jobs` with `Authorization: Bearer <CRON_SECRET>` (e.g. Vercel Cron).
3. **Recruiters:** RECRUITER or COMPANY_ADMIN can post jobs at `/jobs/post-a-job` and manage them at `/dashboard/recruiter/jobs`.
