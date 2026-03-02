# Phase 3B: Company Admin Dashboard Completion — Build Summary

**Project:** Ascend  
**Phase:** 3B — Company Admin Dashboard Completion  
**Build date:** 2025-02-27

---

## Goal

Complete everything left pending from Phase 3 (Company Profiles): extend schema for reviews, interviews, Q&A, salaries, benefits, and company admin; add all APIs (reviews, interviews, Q&A, salaries, benefits, media, admins); build the company admin dashboard with six tabs; add public submit forms and wire company page tabs to real data. Phase 3B is a prerequisite for Phase 7 (Reviews & Ratings) and Phase 8 (Salary Insights).

---

## Task Map (3B.1 – 3B.10)

| #    | Task | Deliverables |
|------|------|--------------|
| 3B.1 | Prisma schema | `CompanyReview` (flagReason, helpfulCount, notHelpfulCount; optional sub-ratings); `ReviewStatus` + REJECTED; `InterviewReview` (helpfulCount, updatedAt, unique + index); `CompanyQA` (updatedAt, index); `SalaryReport` (year, stockValue; unique); `CompanyInvite`; `CompanyBenefit` (emoji); Company (facebook, instagram). Migration: `phase-3b-company-dashboard`. |
| 3B.2 | Reviews API | POST/GET `/api/companies/[slug]/reviews`; POST vote, flag; PATCH status (CompanyAdmin); rate limit 3/hour; 409 duplicate. |
| 3B.3 | Interview reviews API | POST/GET `/api/companies/[slug]/interviews`; rate limit 3/hour; 409 duplicate; experienceBreakdown, avgDifficulty, offerRate. |
| 3B.4 | Q&A API | GET/POST `/api/companies/[slug]/qa`; POST answer (CompanyAdmin), POST vote; rate limit 10/hour. |
| 3B.5 | Salary API | POST/GET `/api/companies/[slug]/salaries`; aggregates by job title (median, p25, p75, min 3); rate limit 5/hour; 409 duplicate. |
| 3B.6 | Benefits & media | POST/DELETE/PATCH reorder benefits; POST/DELETE media, PATCH media reorder; GET/POST admins/invite, DELETE admins/[id]. |
| 3B.7 | Company admin dashboard | `/dashboard/company` — Overview, Edit Profile, Media, Benefits, Reviews, Team (invite stub). |
| 3B.8 | Submit forms | `/companies/[slug]/reviews/new` (multi-step), `/companies/[slug]/interviews/new`, `/companies/[slug]/salaries/new`; React Hook Form + Zod. |
| 3B.9 | Company page tabs | `/companies/[slug]/reviews`, `/interviews`, `/salaries`, `/qa` — tab content with APIs, CTAs, pagination. |
| 3B.10 | Rate limiting | `lib/rate-limit.ts` (checkRateLimit → allowed, remaining, resetIn); 429 with resetIn on exceed. |

---

## Routes

| Route | Purpose |
|-------|---------|
| `GET /api/companies/[slug]/reviews` | Public list (APPROVED only); aggregates, breakdown, subRatings. |
| `POST /api/companies/[slug]/reviews` | Auth; submit review; rate limit 3/h; 409 if duplicate. |
| `POST /api/companies/[slug]/reviews/[id]/vote` | Auth; helpful / not helpful. |
| `POST /api/companies/[slug]/reviews/[id]/flag` | Auth; set FLAGGED + reason. |
| `PATCH /api/companies/[slug]/reviews/[id]/status` | CompanyAdmin; APPROVED / REJECTED / FLAGGED. |
| `GET /api/companies/[slug]/admin/reviews` | CompanyAdmin; all statuses, pagination. |
| `GET/POST /api/companies/[slug]/interviews` | Public list; auth submit; 3/h; 409 duplicate. |
| `GET/POST /api/companies/[slug]/qa` | Public list; auth ask; 10/h. |
| `POST /api/companies/[slug]/qa/[id]/answer` | CompanyAdmin only. |
| `POST /api/companies/[slug]/qa/[id]/vote` | Auth; upvote/downvote. |
| `GET/POST /api/companies/[slug]/salaries` | Public aggregates; auth submit; 5/h; 409 duplicate; min 3 per group. |
| `POST/DELETE /api/companies/[slug]/benefits`, `PATCH .../benefits/reorder` | CompanyAdmin. |
| `POST/DELETE /api/companies/[slug]/media`, `PATCH .../media/reorder` | CompanyAdmin; photo upload or video/tour URL. |
| `GET /api/companies/[slug]/admins` | CompanyAdmin; list admins. |
| `POST /api/companies/[slug]/admins/invite` | CompanyAdmin; CompanyInvite stub. |
| `DELETE /api/companies/[slug]/admins/[id]` | CompanyAdmin; cannot remove self if only admin. |
| `GET /dashboard/company` | CompanyAdmin; 6-tab dashboard. |
| `PATCH /api/companies/[slug]` | CompanyAdmin; edit profile (incl. facebook, instagram). |
| `/companies/[slug]/reviews/new` | Auth; multi-step review form. |
| `/companies/[slug]/interviews/new` | Auth; interview form. |
| `/companies/[slug]/salaries/new` | Auth; salary form. |
| `/companies/[slug]/reviews`, `.../interviews`, `.../salaries`, `.../qa` | Tab pages with real data and CTAs. |

---

## Key Files

### Schema & migration

- `prisma/schema.prisma` — CompanyReview, InterviewReview, CompanyQA, SalaryReport, CompanyBenefit, CompanyInvite, Company (facebook, instagram) updates.
- `prisma/migrations/20250227210000_phase_3b_company_dashboard/migration.sql` — Apply after resolving any failed migration: `npx prisma migrate resolve --rolled-back <failed_name>` then `npx prisma migrate deploy`.

### Lib

- `lib/rate-limit.ts` — checkRateLimit(key, maxRequests, windowSeconds) → { allowed, remaining, resetIn }; Redis incr/expire/ttl.
- `lib/companies/ratings.ts` — getCompanyRatingAggregate (handles optional sub-ratings).
- `lib/companies/permissions.ts` — isCompanyOwnerOrAdmin (unchanged).

### API

- `app/api/companies/[slug]/reviews/route.ts` — GET (public), POST (auth, rate limit, 409).
- `app/api/companies/[slug]/reviews/[reviewId]/vote/route.ts`, `.../flag/route.ts`, `.../status/route.ts`.
- `app/api/companies/[slug]/admin/reviews/route.ts` — GET (CompanyAdmin, all statuses).
- `app/api/companies/[slug]/interviews/route.ts` — GET, POST.
- `app/api/companies/[slug]/qa/route.ts` — GET, POST.
- `app/api/companies/[slug]/qa/[qaId]/answer/route.ts`, `.../vote/route.ts`.
- `app/api/companies/[slug]/salaries/route.ts` — GET (aggregates), POST (auth, rate limit, 409).
- `app/api/companies/[slug]/benefits/route.ts` — POST; `.../benefits/[benefitId]/route.ts` — DELETE; `.../benefits/reorder/route.ts` — PATCH.
- `app/api/companies/[slug]/media/route.ts` — POST (photo upload or video/tour URL); `.../media/[mediaId]/route.ts` — DELETE; `.../media/reorder/route.ts` — PATCH.
- `app/api/companies/[slug]/admins/route.ts` — GET; `.../admins/invite/route.ts` — POST; `.../admins/[adminId]/route.ts` — DELETE.

### Dashboard & forms

- `app/dashboard/company/page.tsx` — Server; COMPANY_ADMIN only; first company or “claim a company”.
- `components/dashboard/company/CompanyDashboard.tsx` — Tabs: Overview, Edit Profile, Media, Benefits, Reviews, Team.
- `components/dashboard/company/CompanyDashboardOverview.tsx`, `CompanyDashboardEditProfile.tsx`, `CompanyDashboardMedia.tsx`, `CompanyDashboardBenefits.tsx`, `CompanyDashboardReviews.tsx`, `CompanyDashboardTeam.tsx`.
- `components/company/ReviewSubmitForm.tsx` — Multi-step (employment → ratings → pros/cons); Zod + React Hook Form.
- `components/company/InterviewSubmitForm.tsx` — Single page; job title, experience, difficulty, process, questions, duration, anonymous.
- `components/company/SalarySubmitForm.tsx` — job title, experience, location, type, base/bonus/stock, year.
- `app/companies/[slug]/reviews/new/page.tsx`, `.../interviews/new/page.tsx`, `.../salaries/new/page.tsx`.

### Company tab pages

- `app/companies/[slug]/reviews/page.tsx`, `.../interviews/page.tsx`, `.../salaries/page.tsx`, `.../qa/page.tsx`.
- `components/company/CompanyReviewsTab.tsx`, `CompanyInterviewsTab.tsx`, `CompanySalariesTab.tsx`, `CompanyQATab.tsx`.

---

## Fixes Applied (Pre-Run)

1. **components/jobs/SearchBar.tsx** — TypeScript errors at lines 151 and 169 (`':' expected`): the ternary expressions for `suggestions?.titles?.length` and `suggestions?.companies?.length` were missing the false branch. Changed `)}` to `) : null}` so the ternary is complete. Also fixed the template literal on line 158 so the comparison is correctly parenthesized: `highlight === ((suggestions?.titles?.length ?? 0) + i)`.
2. **app/api/companies/[slug]/salaries/route.ts** — File is complete; GET returns aggregated salaries by job title (median, p25, p75, min, max, avgBonus, locations) with minimum 3 reports; POST validates body, rate limits, checks duplicate, creates SalaryReport. No syntax errors.
3. **app/api/companies/[slug]/benefits/route.ts** — File is complete; POST validates label/emoji, CompanyAdmin only, computes next order, creates CompanyBenefit. No syntax errors.

---

## Phase 3B Exit Checklist

- [ ] Prisma migration `phase-3b-company-dashboard` applied (resolve failed migration first if needed).
- [ ] Reviews: submit form, list (APPROVED only public), vote, flag, status PATCH (CompanyAdmin).
- [ ] One review per user per company (409 on duplicate).
- [ ] Interview reviews: submit form, list (APPROVED only), 409 duplicate.
- [ ] Q&A: ask (auth), answer (CompanyAdmin), upvote/downvote.
- [ ] Salary: submit form, aggregate display (median/p25/p75 per role, min 3 threshold).
- [ ] Benefits: CompanyAdmin add/remove/reorder; shown on company page.
- [ ] Company admin dashboard: all 6 tabs (Overview, Edit Profile, Media, Benefits, Reviews, Team).
- [ ] Company page tabs: Reviews, Interviews, Salaries, Q&A use real APIs and CTAs.
- [ ] CompanyInvite stub: invite stores record, shows “Invite sent”.
- [ ] Rate limiting: Redis keys (rl:review:*, rl:interview:*, rl:salary:*, rl:qa:*); 429 with resetIn.

---

## What's Next

| Phase   | Focus                    | Status   |
|---------|--------------------------|----------|
| Phase 3B| Company Admin Dashboard  | Done     |
| Phase 7 | Reviews & Ratings        | Next     |
| Phase 8 | Salary Insights          | After 7  |
