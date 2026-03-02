# Phase 18B: Internal Job Board & Employee Mobility — Build Summary

## Overview

Phase 18B enables companies to run internal hiring (transfers, promotions, referrals) on Ascend. Jobs can be PUBLIC (default), INTERNAL (verified employees only), or UNLISTED (direct link only). Company admins configure verified email domains; matching users are auto-granted access to the internal portal. Referrals are tracked with outcomes; anonymous apply is supported for internal jobs.

## Delivered

### 1. Prisma schema

- **JobVisibility** enum: `PUBLIC`, `INTERNAL`, `UNLISTED`.
- **JobPost:** `visibility` (default PUBLIC), `internalFirstDays` (nullable, 1–30), `allowAnonymousApply` (default false), `jobReferrals` relation.
- **Company:** `verifiedDomains` (String[]), `employees` (CompanyEmployee[]).
- **CompanyEmployee:** userId, companyId, domain, verifiedAt; unique (userId, companyId); indexes on companyId, userId.
- **ReferralOutcome** enum: PENDING, APPLIED, SHORTLISTED, HIRED, EXPIRED.
- **JobReferral:** referrerId, referredEmail, jobPostId, outcome, referredAt, updatedAt; relations to User and JobPost.
- **JobApplication:** `isAnonymous` (Boolean, default false).
- **OutcomeEventType:** added JOB_REFERRAL_SENT, INTERNAL_JOB_VIEWED, INTERNAL_JOB_APPLIED, EMPLOYEE_VERIFIED, JOB_VISIBILITY_SWITCHED.

Migration: `prisma/migrations/20260304000000_phase18b_internal_job_board/migration.sql`. Run `prisma migrate deploy` (or `migrate dev` once shadow DB is fixed).

### 2. Job post form

- **components/jobs/JobPostForm.tsx:** Visibility selector (Public / Internal / Unlisted). When INTERNAL: “Open to internal candidates first” with days input (1–30, default 7); “Allow anonymous applications” checkbox.
- **lib/validations/job.ts:** visibility, internalFirstDays, allowAnonymousApply validation.
- **app/api/jobs/route.ts**, **app/api/jobs/[id]/route.ts:** Persist visibility, internalFirstDays, allowAnonymousApply; index to Typesense only when ACTIVE and PUBLIC; remove from index when visibility changes away from PUBLIC.

### 3. Visibility gates

- **lib/jobs/queries.ts:** `getJobsForListing` and `getSimilarJobs` filter `visibility: 'PUBLIC'`.
- **lib/search/sync/jobs.ts:** `reindexAllJobs` only fetches ACTIVE + PUBLIC jobs; index/remove on create/update by visibility.

### 4. Internal portal

- **app/internal/[companySlug]/page.tsx:** Auth required; redirect to login if unauthenticated; checks CompanyEmployee for session user + company by slug; “verified employees only” message if not employee; otherwise renders internal job list.
- **app/api/companies/[slug]/internal-jobs/route.ts:** GET; auth + CompanyEmployee check; returns jobs with `visibility in [INTERNAL, PUBLIC]`, status ACTIVE.
- **InternalPortalClient.tsx:** Fetches internal-jobs; job cards with “Internal Only” badge for INTERNAL jobs.
- **app/jobs/[slug]/page.tsx:** For INTERNAL jobs, requires CompanyEmployee for job’s company else notFound().
- **Apply flow:** POST apply sets `isAnonymous` from `job.allowAnonymousApply`; `ref` (body/query) updates JobReferral.outcome to APPLIED. Recruiter alert uses “Anonymous Applicant” when anonymous.
- **app/api/jobs/[id]/applications/route.ts:** When application is anonymous and status not in [SHORTLISTED, INTERVIEW_SCHEDULED, OFFERED], mask applicant name/avatar/headline as “Anonymous Applicant”.
- **app/api/applications/[id]/status/route.ts:** On transition to SHORTLISTED or OFFERED, update JobReferral by jobPostId + applicant email to SHORTLISTED or HIRED.

### 5. Employee domain verification

- **lib/auth/employee-verification.ts:** `grantCompanyEmployeeByEmail(userId, email)` — domain from email, companies where verifiedDomains contains domain (case-insensitive), upsert CompanyEmployee, track EMPLOYEE_VERIFIED. Called from NextAuth signIn callback.
- **app/api/companies/[slug]/domains/route.ts:** GET/PATCH; COMPANY_ADMIN (or PLATFORM_ADMIN); PATCH body `{ domains: string[] }`; domain validation (no http, no wildcards).
- **CompanyDashboardTeam.tsx:** VerifiedDomainsSection — list domains with remove, add-domain input.
- **app/api/dashboard/seeker/route.ts:** Returns `employeePortals` from CompanyEmployee for current user.
- **SeekerDashboardClient.tsx:** InternalPortalNudgeCard when `data.employeePortals?.length > 0`; links to `/internal/[company-slug]`.

### 6. Internal-first cron

- **app/api/cron/internal-to-public/route.ts:** GET; CRON_SECRET; finds INTERNAL jobs with internalFirstDays set where createdAt + (internalFirstDays days) <= now; updates visibility to PUBLIC, internalFirstDays to null; indexJob; logAudit JOB_VISIBILITY_AUTO_SWITCHED; trackOutcome JOB_VISIBILITY_SWITCHED (recruiterId).
- **vercel.json:** Cron `0 9 * * *` → `/api/cron/internal-to-public`.

### 7. Referral system

- **app/api/jobs/[id]/refer/route.ts:** POST; auth; for INTERNAL jobs requires CompanyEmployee; Redis rate limit 10/user/job/24h; body referredName, referredEmail; create JobReferral; sendJobReferralEmail; track JOB_REFERRAL_SENT.
- **lib/email/templates/job-referral.ts:** Subject/body with referrer name, job title, company, “View Job & Apply” link (with ref param), workMode, location, salaryRange.
- **components/jobs/ReferColleagueButton.tsx:** Dialog with colleague name + email; submits to refer API; success message with “View job” link.
- **app/jobs/[slug]/page.tsx:** canRefer = session && (visibility === PUBLIC || (INTERNAL && CompanyEmployee)); renders ReferColleagueButton.

### 8. HR analytics — Mobility tab

- **app/api/companies/[slug]/mobility-analytics/route.ts:** GET; COMPANY_ADMIN only; returns: internalFillRate, avgTimeToFillInternal, avgTimeToFillExternal, referralConversionRate, referralLeaderboard (name, sent, applied, hired), internalJobPerformance (title, postedDate, applications, shortlisted, hired, daysOpen) — last 90 days.
- **components/dashboard/company/CompanyDashboardMobility.tsx:** Fetches mobility-analytics; stat cards; referral leaderboard table; internal job performance table.
- **CompanyDashboard.tsx:** New “Mobility” tab.

### 9. Outcome events

- **lib/tracking/outcomes.ts:** Uses Prisma OutcomeEventType (new values in schema).
- **Wired:** JOB_REFERRAL_SENT → POST /api/jobs/[id]/refer; INTERNAL_JOB_VIEWED → job detail page when visibility INTERNAL; INTERNAL_JOB_APPLIED → POST apply when job INTERNAL; EMPLOYEE_VERIFIED → employee-verification upsert; JOB_VISIBILITY_SWITCHED → cron internal-to-public.

## Key files

| Area | Paths |
|------|------|
| Schema | `prisma/schema.prisma`, migration `20260304000000_phase18b_internal_job_board` |
| Jobs | `app/api/jobs/route.ts`, `app/api/jobs/[id]/route.ts`, `app/api/jobs/[id]/apply/route.ts`, `app/api/jobs/[id]/applications/route.ts`, `app/api/jobs/[id]/refer/route.ts` |
| Internal | `app/internal/[companySlug]/page.tsx`, `app/api/companies/[slug]/internal-jobs/route.ts` |
| Domains | `app/api/companies/[slug]/domains/route.ts`, `lib/auth/employee-verification.ts`, `CompanyDashboardTeam.tsx` |
| Seeker | `app/api/dashboard/seeker/route.ts`, `InternalPortalNudgeCard.tsx`, `SeekerDashboardClient.tsx` |
| Referral | `ReferColleagueButton.tsx`, `lib/email/templates/job-referral.ts` |
| Cron | `app/api/cron/internal-to-public/route.ts`, `vercel.json` |
| Mobility | `app/api/companies/[slug]/mobility-analytics/route.ts`, `CompanyDashboardMobility.tsx` |

## Constraints respected

- `visibility = PUBLIC` is the default; existing job seeker experience unchanged.
- No direct Prisma in client components; all data via API routes.
- Typesense index updated on visibility change (only PUBLIC jobs indexed).
- Anonymous apply: name revealed server-side on status change to SHORTLISTED, not client toggle.
- Domain matching case-insensitive (lowercase before compare).
- Referral ref param used in apply flow for attribution (body/query).

## Exit checklist

- [x] Migration provided; JobPost.visibility defaults to PUBLIC; CompanyEmployee, JobReferral, Company.verifiedDomains, JobPost.allowAnonymousApply/internalFirstDays, JobApplication.isAnonymous, OutcomeEventType additions.
- [x] PUBLIC/INTERNAL/UNLISTED visibility gates; internal portal requires auth + CompanyEmployee; employees see PUBLIC + INTERNAL in portal.
- [x] Company admin domains API; login auto-grants CompanyEmployee; seeker dashboard nudge for employee portals.
- [x] Anonymous apply stored; recruiter sees “Anonymous Applicant” until SHORTLISTED.
- [x] Cron internal-to-public daily; jobs switch after configured days; Typesense + AuditLog + outcome.
- [x] Refer modal on job detail; POST refer API; referral email; outcome updates APPLIED/SHORTLISTED/HIRED; rate limit 10/user/job/24h.
- [x] Mobility tab with stat cards, referral leaderboard, internal job performance table.
- [x] All five outcome events defined and wired.
- [x] `npm run build` passes.
