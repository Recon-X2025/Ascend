# Phase 7: Reviews & Ratings — Build Summary

## Overview

Phase 7 adds the **community layer** on top of company profiles and the application system: verified company reviews, interview reviews, and salary data contributions. Reviews are seeker-submitted, pseudonymous (display name never email), require employment context, and go through admin moderation before going live. Helpful votes surface quality; rate limiting and one-per-company (or one-per-company-per-year for interviews) prevent spam.

## Delivered

### 1. Prisma schema & migration

- **Enums added:** `CEOApproval` (APPROVE, DISAPPROVE, NO_OPINION), `InterviewResult` (OFFER, REJECTED, WITHDREW, PENDING). **SignalType:** `REVIEW_SUBMITTED`.
- **CompanyReview (extended):** `headline`, `employmentType`, `employmentStart` / `employmentEnd` (YYYY-MM), `department`, `ceoApprovalRating`, `moderatedAt`, `moderatedById`, `isVerifiedEmployee`.
- **InterviewReview (extended):** `jobApplicationId`, `interviewYear`, `interviewResult`, `overallRating`, `headline`, `processDesc`, `questions`, `tips`, `roundCount`, `durationWeeks`, `rejectionReason`, `moderatedAt`, `moderatedById`, `unhelpfulCount`; relation `interviewVotes`.
- **InterviewVote:** New model (reviewId, userId, helpful); unique (reviewId, userId).
- **SalaryReport (extended):** `status` (ReviewStatus), `rejectionReason`, `department`, `salaryAmount`, `baseSalaryOpt`, `bonusOpt`, `stocksOpt`. Unique: `(userId, companyId)` (one submission per company per user).
- **Migration:** `20260301120000_phase7_reviews_ratings` (run `npx prisma migrate deploy` or `npx prisma migrate dev` when ready).

### 2. API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/reviews/company` | GET | List approved company reviews for `companyId`; query: page, limit, sort (recent \| helpful \| rating_high \| rating_low). Returns aggregate. |
| `/api/reviews/company` | POST | Submit company review (auth, rate limit 3/24h, one per company, PENDING; CareerSignal REVIEW_SUBMITTED; email “review received”). |
| `/api/reviews/company/[reviewId]/vote` | POST | Helpful/unhelpful vote (auth; one per user per review, upsert). |
| `/api/reviews/interview` | GET | List approved interview reviews for `companyId`. |
| `/api/reviews/interview` | POST | Submit interview review (auth, rate limit, one per company per year per user, PENDING). |
| `/api/reviews/interview/[reviewId]/vote` | POST | Vote (same pattern as company). |
| `/api/reviews/salary` | GET | Aggregated salary data for company (median, p25, p75, count); only if 5+ approved submissions. Optional filters: jobTitle, location, year. Never returns individual records. |
| `/api/reviews/salary` | POST | Submit salary (auth, rate limit, one per company per user, PENDING). |
| `/api/reviews/mine` | GET | Current user’s company reviews, interview reviews, salary submissions with status (auth). |

### 3. Rate limiting & validation

- **lib/reviews/rate-limit.ts:** Redis key `review_submit:${userId}`, max 3 per rolling 24h, TTL 86400s. Returns 429 with message when exceeded.
- **lib/reviews/validate.ts:** Zod schemas `companyReviewSchema`, `interviewReviewSchema`, `salarySubmissionSchema`, `voteSchema` (char limits, rating 1–5, YYYY-MM, etc.).
- **lib/reviews/sanitize.ts:** `sanitizeReviewText()` for pros/cons/advice/process (strip HTML).

### 4. Company profile — Reviews tab

- **Unified Reviews tab:** `/companies/[slug]/reviews` (and `/interviews`, `/salaries` with initial sub-tab) render `ReviewsTab` with three sub-tabs: **Company Reviews** | **Interview Reviews** | **Salaries**.
- **Company Reviews:** `RatingSummaryCard` (overall + 5 sub-ratings bars, recommend %, CEO approval); sort (Recent, Helpful, Highest/Lowest rated); `CompanyReviewCard` (headline, employment badge, pros/cons/advice, `HelpfulVote`); pagination; “Share your experience” CTA.
- **Interview Reviews:** List with `InterviewReviewCard` (headline, result/difficulty badges, process, questions, tips, helpful vote).
- **Salaries:** `SalaryAggregateTable` only when 5+ approved submissions; filters job title/location; disclaimer; “Add your salary” CTA.

### 5. Review submission forms

- **/reviews/company/new?companyId=** — `CompanyReviewForm`: employment (title, department, type, status, start/end YYYY-MM), 5-star ratings (overall, work-life, culture, career, compensation, management), headline, pros/cons/advice, would recommend, CEO approval. Submit → PENDING; success message “within 48 hours”.
- **/reviews/interview/new?companyId=** — `InterviewReviewForm`: job title, year, result, difficulty, experience, overall rating, headline, process description, questions, tips, rounds/duration. Same PENDING flow.
- **/reviews/salary/new?companyId=** — `SalarySubmissionForm`: job title, department, type, location, years exp, year, CTC, optional base/bonus/stocks. Disclaimer: individual never shown.

### 6. Seeker dashboard

- **AddReviewPromptCard:** Shown when user has ≥1 application with status INTERVIEW_SCHEDULED or OFFERED and no existing company review for that company. “Share your experience at [Company]” with “Write a review” → `/reviews/company/new?companyId=`. Dismissible per company (localStorage).

### 7. Admin moderation

- **GET /api/admin/moderation:** Query `filter` (PENDING | ALL), `type` (all | company | interview | salary). Returns unified list: company name, type badge, author email, headline, preview (first 100 chars), status, “Submitted X hours ago” (red if >24h).
- **Approve:** Company `PATCH /api/admin/moderation/reviews/[id]/approve` (sets moderatedAt, moderatedById; sends “Your review is now live” email). Interview `PATCH .../interview/[id]/approve`, Salary `PATCH .../salary/[id]/approve`.
- **Reject:** All three have reject route; body `reason` (min 5 chars). Rejection reason dropdown in UI: Inappropriate language, Unverifiable claim, Personal information included, Spam or duplicate, Does not meet quality guidelines, Other (free text). Stores rejectionReason; sends “Your review wasn’t approved — [reason]” email; `logAdminAction()`.
- **Stats:** Pending / approved today / rejected today across all three types.

### 8. Email (Resend)

- **lib/email/templates/review-received.ts:** “Review received — under moderation (48hrs)” to author after company review submit.
- **lib/email/templates/review-approved.ts:** “Your review is now live” on company review approval.
- **lib/email/templates/review-rejected.ts:** “Your [review type] wasn’t approved — [reason]” (company | interview | salary).

### 9. Company card rating

- **Job detail:** `CompanySnippetCard` shows star rating (1 decimal) + review count only when **3+** approved reviews (`rating.reviewCount >= 3`).
- **Companies discovery:** Same rule; rating shown as “X.X (N reviews)” when count ≥ 3.

## Key files

| Area | Paths |
|------|------|
| Schema | `prisma/schema.prisma` (CompanyReview, InterviewReview, SalaryReport, InterviewVote, enums); `prisma/migrations/20260301120000_phase7_reviews_ratings/` |
| Lib | `lib/reviews/rate-limit.ts`, `lib/reviews/validate.ts`, `lib/reviews/sanitize.ts`; `lib/companies/ratings.ts` (ceoApprovalRating support) |
| APIs | `app/api/reviews/company/route.ts`, `app/api/reviews/company/[reviewId]/vote/route.ts`, `app/api/reviews/interview/route.ts`, `app/api/reviews/interview/[reviewId]/vote/route.ts`, `app/api/reviews/salary/route.ts`, `app/api/reviews/mine/route.ts` |
| Moderation | `app/api/admin/moderation/route.ts`, `app/api/admin/moderation/stats/route.ts`, `app/api/admin/moderation/reviews/[id]/approve|reject`, `app/api/admin/moderation/interview/[id]/approve|reject`, `app/api/admin/moderation/salary/[id]/approve|reject` |
| Email | `lib/email/templates/review-received.ts`, `review-approved.ts`, `review-rejected.ts` |
| Forms | `app/reviews/company/new/page.tsx`, `app/reviews/interview/new/page.tsx`, `app/reviews/salary/new/page.tsx`; `components/reviews/CompanyReviewForm.tsx`, `InterviewReviewForm.tsx`, `SalarySubmissionForm.tsx`, `StarSelector.tsx` |
| Company profile | `app/companies/[slug]/reviews/page.tsx` (and interviews, salaries); `app/companies/[slug]/components/ReviewsTab.tsx`, `CompanyReviewsSection.tsx`, `InterviewReviewsSection.tsx`, `SalariesSection.tsx` |
| Cards | `components/reviews/RatingSummaryCard.tsx`, `CompanyReviewCard.tsx`, `InterviewReviewCard.tsx`, `HelpfulVote.tsx`, `SalaryAggregateTable.tsx` |
| Dashboard | `components/dashboard/seeker/AddReviewPromptCard.tsx`; `app/api/dashboard/seeker/route.ts` (companiesForReviewPrompt) |
| Admin UI | `components/dashboard/admin/AdminModerationClient.tsx` (type filter, approve/reject per type, rejection dropdown) |
| Company card | `components/jobs/CompanySnippetCard.tsx`, `components/company/CompaniesDiscovery.tsx` (rating only if ≥3 reviews) |

## Acceptance criteria (checklist)

- [x] Seeker can submit company review — form validates, stores PENDING.
- [x] Seeker can submit interview review — form validates, stores PENDING.
- [x] Seeker can submit salary data — form validates, stores PENDING.
- [x] Rate limit: 4th submission in 24h returns 429.
- [x] Duplicate: second review for same company returns 409.
- [x] Company profile reviews tab shows only APPROVED reviews; rating summary from approved.
- [x] Salary aggregate: data only if 5+ approved; individual never exposed.
- [x] Helpful vote: one per user, upsertable; counts update.
- [x] Admin moderation: all three types, type filter; approve sets status, moderatedAt, moderatedById; reject requires reason, stores it, sends email, logs action.
- [x] Review cards: no author name/email — only “[Current/Former] [Job Title]”.
- [x] Company card in listings/discovery shows aggregate rating if 3+ reviews.

## Notes

- **Migration:** If you have existing `SalaryReport` rows with the old unique `(userId, companyId, jobTitle, year)`, the migration drops that constraint and adds `(userId, companyId)`. Ensure no duplicate (userId, companyId) rows before migrating, or the unique index creation will fail.
- **PILOT_BUILD.md** updated with Phase 7 marked ✅ Done in the Company Launch track.

---

*Phase 7 — Company Launch track. Next: Phase 8 (Salary Insights) after Phase 7 is confirmed green.*
