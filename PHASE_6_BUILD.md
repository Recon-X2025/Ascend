# Phase 6: Application System — Build Summary

## Overview

Phase 6 adds the full application system: Easy Apply flow, screening questions, application tracking, withdraw, confirmation and status emails, recruiter application inbox, and outcome tracking.

## Deliverables

### Schema & migration
- **ApplicationStatus** enum: SUBMITTED, UNDER_REVIEW, SHORTLISTED, INTERVIEW_SCHEDULED, OFFERED, REJECTED, WITHDRAWN
- **JobApplication** model: jobPostId (Int), applicantId, resumeVersionId (optional), coverLetter, responses (JSON), status, recruiterNotes, fitScoreSnapshot, timestamps; unique [jobPostId, applicantId]
- **OutcomeEventType**: APPLICATION_WITHDRAWN, APPLICATION_STATUS_CHANGED, APPLY_FLOW_STARTED, APPLY_FLOW_ABANDONED
- Migrations: `phase-6-applications`, `phase-6-outcome-events`

### Types
- **lib/applications/types.ts**: ScreeningResponse, ApplicationStatus

### APIs
- **POST /api/jobs/[id]/apply** — Seeker only; easyApply check; duplicate 409; creates JobApplication, increments applicationCount; fitScoreSnapshot; confirmation + recruiter alert emails (fire-and-forget); APPLICATION_SUBMITTED
- **GET /api/jobs/[id]/applied** — Returns { applied, applicationId?, status? } for seeker
- **GET /api/applications** — Seeker list; status filter, page, limit; statusCounts; job + resume info
- **GET /api/applications/[id]** — Applicant (own) or recruiter (with recruiterNotes); full detail
- **PATCH /api/applications/[id]** — Recruiter notes only (auto-save)
- **POST /api/applications/[id]/withdraw** — Applicant only; sets WITHDRAWN; decrements applicationCount (capped 0); APPLICATION_WITHDRAWN
- **PATCH /api/applications/[id]/status** — Recruiter; status transition + optional notes; status email; APPLICATION_STATUS_CHANGED
- **GET /api/jobs/[id]/applications** — Recruiter/admin; status, page, limit, sort (date | fitScore); statusCounts
- **PATCH /api/jobs/[id]/applications/bulk-status** — Recruiter; applicationIds + status (SHORTLISTED | REJECTED)

### Emails (lib/applications/emails.ts)
- Application confirmation (to applicant)
- Status update (to applicant)
- New application alert (to recruiter)
- All fire-and-forget; Resend

### Pages & components
- **/jobs/[slug]/apply** — Auth + JOB_SEEKER; redirect if !easyApply; already-applied gate; ApplyForm (3 steps)
- **ApplyForm** — Step 1: profile summary, completeness warning, fit score, resume selector, cover letter; Step 2: screening questions (skip if none); Step 3: review & submit; RHF + Zod; APPLY_FLOW_STARTED on mount; APPLY_FLOW_ABANDONED on beforeunload (step 1 or 2)
- **/dashboard/seeker/applications** — SeekerApplicationsClient; tabs by status; ApplicationCard; withdraw with confirm; pagination; statusCounts
- **/dashboard/recruiter/jobs/[id]/applications** — RecruiterApplicationsClient; status tabs; sort date/fitScore; ApplicantCard; ApplicationDrawer (detail, notes, status); bulk Shortlisted/Rejected
- **JobDetailSidebar** — Fetches /api/jobs/[id]/applied; shows "Applied ✓" or "Easy Apply" or "Apply on Company Website"
- **Recruiter jobs table** — "Applications" link to /dashboard/recruiter/jobs/[id]/applications

### Outcome events
- APPLICATION_SUBMITTED, APPLICATION_WITHDRAWN, APPLICATION_STATUS_CHANGED (server)
- APPLY_FLOW_STARTED, APPLY_FLOW_ABANDONED (client → POST /api/track)
- OUTCOMES.md updated with Phase 6 events

## Exit Checklist

- [x] Prisma migrations applied; JobApplication model
- [x] Easy Apply: 3-step form (review → screening → submit)
- [x] Step 2 skipped if no screening questions
- [x] Resume selector: seeker’s COMPLETE ResumeVersions + "Use my Ascend profile"
- [x] Fit score in apply flow + "Optimise Resume" CTA
- [x] Duplicate check: 409 on second apply
- [x] easyApply=false → redirect to applicationUrl or message
- [x] POST apply: create application, increment applicationCount
- [x] Confirmation email to applicant (fire-and-forget)
- [x] GET /api/applications with job details, statusCounts
- [x] POST withdraw: WITHDRAWN, decrement count (cap 0)
- [x] GET /api/jobs/[id]/applications (recruiter)
- [x] PATCH status: update + email
- [x] Bulk status (recruiter)
- [x] /dashboard/seeker/applications: list, tabs, withdraw confirm
- [x] /dashboard/recruiter/jobs/[id]/applications: applicant cards, drawer, notes, status
- [x] Job detail: Easy Apply / Applied ✓ / Apply on Company Website
- [x] Outcome events logged
- [x] GET /api/jobs/[id]/applied

## Constraints

- No hard deletes; WITHDRAWN only
- Recruiter notes never in seeker API
- applicationCount denormalized; increment/decrement
- fitScoreSnapshot immutable
- Emails fire-and-forget
- React Hook Form + Zod for apply form
