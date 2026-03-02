# Phase 3: Company Profiles — Build

**Project:** Ascend  
**Phase:** 3 — Company Profiles (claimable, Glassdoor-style)  
**Build date:** 2025-02-27

---

## Goal

Build claimable, Glassdoor-style company pages with overview, media, ratings, Q&A, benefits, and company discovery. Phases 1, Pre-2, 2, and 2A remain unchanged; no modifications to existing auth, profile, or resume builder unless required for Phase 3 integration.

---

## Task Map (3.1 – 3.11)

| #    | Task | Deliverables |
|------|------|--------------|
| 3.1  | Prisma schema | `Company`, `CompanyAdmin`, `CompanyMedia`, `CompanyBenefit`, `CompanyBenefitRating`, `CompanyReview`, `CompanyReviewVote`, `InterviewReview`, `SalaryReport`, `CompanyQA`, `CompanyQAVote`; enums; indexes; migration `phase-3-company-profiles`. |
| 3.2  | Company CRUD & claim | POST create, GET/PATCH by slug, slug uniqueness (`lib/companies/slug.ts`), permissions (`lib/companies/permissions.ts`), POST claim, POST verify (platform admin). |
| 3.3  | Company overview UI | `/companies/[slug]` server page: hero (banner, logo, verified), tabs (Overview \| Reviews \| Interviews \| Salaries \| Q&A \| Jobs), overview content (about, quick facts, specialties, rating summary, trending badges, benefits, media gallery); 404 when not found. |
| 3.4  | Media management | GET/POST `/api/companies/[slug]/media`, DELETE/PATCH `.../media/[mediaId]`; photo upload (S3/Cloudinary, max 20); VIDEO_EMBED, VIRTUAL_TOUR; admin drag-reorder UI. |
| 3.5  | Ratings & reviews | GET/POST/PATCH reviews; vote (helpful), flag; list (sort/filter); submit form; one review per user per company; rate limiting. |
| 3.6  | Interview reviews | GET/POST interviews; list + submit form (job title, experience, difficulty, got offer, process, sample questions, duration, anonymous). |
| 3.7  | Q&A | GET/POST qa; vote (up/down); answer (company admin); sort (upvoted / recent). |
| 3.8  | Benefits | GET/POST/DELETE benefits; POST rate; display on overview (icon + label + avg rating). |
| 3.9  | Company discovery | `/companies`: search, filters (industry, size, type, min rating, verified), sort, company cards, pagination; GET `/api/companies` with aggregate rating. |
| 3.10 | Company admin dashboard | `/dashboard/company`: COMPANY_ADMIN only; tabs Overview, Edit Profile, Media, Benefits, Reviews (approve/flag), Team (invite stub). |
| 3.11 | Salary stub | POST salary report; GET aggregate (median, 25th/75th by job title); pages submit + list. |

---

## Routes

| Route | Purpose |
|-------|---------|
| `/companies` | Company discovery: search, filters, sort, pagination. |
| `/companies/[slug]` | Company overview (server-rendered); hero, tabs, about, ratings, benefits, media. |
| `/companies/[slug]/reviews` | List reviews (sort/filter); link to write review. |
| `/companies/[slug]/reviews/new` | Submit review form (auth required). |
| `/companies/[slug]/interviews` | List interview experiences; link to submit. |
| `/companies/[slug]/interviews/new` | Submit interview review. |
| `/companies/[slug]/qa` | Q&A list; ask question; vote; answer (admin). |
| `/companies/[slug]/salaries` | Salary aggregate by job title; link to submit. |
| `/companies/[slug]/salaries/new` | Submit salary report. |
| `/dashboard/company` | Company admin dashboard (Overview, Edit Profile, Media, Benefits, Reviews, Team). |
| `/api/companies` | GET list (filters, sort, pagination); POST create (RECRUITER/COMPANY_ADMIN). |
| `/api/companies/[slug]` | GET company (public); PATCH (company admin). |
| `/api/companies/[slug]/claim` | POST claim unclaimed company. |
| `/api/companies/[slug]/verify` | POST set verified (platform admin). |
| `/api/companies/[slug]/media` | GET list, POST add (admin). |
| `/api/companies/[slug]/media/[mediaId]` | DELETE, PATCH caption/order (admin). |
| `/api/companies/[slug]/reviews` | GET list, POST create. |
| `/api/companies/[slug]/reviews/[id]` | PATCH edit; POST vote, POST flag. |
| `/api/companies/[slug]/interviews` | GET list, POST create. |
| `/api/companies/[slug]/qa` | GET list, POST ask. |
| `/api/companies/[slug]/qa/[id]/vote` | POST vote (UP/DOWN). |
| `/api/companies/[slug]/qa/[id]/answer` | POST answer (company admin). |
| `/api/companies/[slug]/benefits` | GET list, POST add (admin). |
| `/api/companies/[slug]/benefits/[id]` | DELETE (admin). |
| `/api/companies/[slug]/benefits/[id]/rate` | POST rate 1–5 (auth). |
| `/api/companies/[slug]/salaries` | GET aggregate; POST submit. |
| `/api/companies/[slug]/admins/invite` | POST invite (stub / coming soon). |

---

## Key Files

### Prisma & migrations

- `prisma/schema.prisma` — Company, CompanyAdmin, CompanyMedia, CompanyBenefit, CompanyBenefitRating, CompanyReview, CompanyReviewVote, InterviewReview, SalaryReport, CompanyQA, CompanyQAVote; enums CompanyType, CompanySize, CompanyAdminRole, CompanyMediaType, ReviewStatus, EmploymentStatus, InterviewExperience, InterviewDifficulty, SalaryReportStatus, CompanyQAVoteType; indexes on Company(slug, industry, verified), CompanyReview(companyId, userId), InterviewReview(companyId), SalaryReport(companyId, jobTitle). JobPost has optional `companyId` + `companyRef`.
- `prisma/migrations/*_phase_3_company_profiles/` — Migration for Phase 3 models.

### Lib

- `lib/companies/slug.ts` — `slugify(name)`, `generateUniqueSlug(baseName)` with DB uniqueness (-2, -3, …).
- `lib/companies/permissions.ts` — `getCompanyRole`, `isCompanyAdmin`, `isCompanyOwner`, `isCompanyOwnerOrAdmin` (compound unique `companyId_userId` for findUnique).
- `lib/companies/ratings.ts` — `getCompanyRatingAggregate(companyId)`: overall/sub-averages, recommend %, CEO approval % (approved reviews only).
- `lib/companies/queries.ts` — `getCompanyBySlugForPage(slug)` for server-side company page (media, benefits with avg rating, rating aggregate).
- `lib/html/sanitize.ts` — `sanitizeRichText(html)` for company `about` (sanitize-html; allowed tags/attrs).

### API

- `app/api/companies/route.ts` — GET list (page, limit, industry, size, type, minRating, verifiedOnly, sort, search); POST create (session + RECRUITER/COMPANY_ADMIN, unique slug, CompanyAdmin OWNER).
- `app/api/companies/[slug]/route.ts` — GET (company + media, benefits, ratingAggregate, isAdmin); PATCH (company admin; overview/about/specialties).
- `app/api/companies/[slug]/claim/route.ts` — POST claim (unclaimed → claimed + CompanyAdmin OWNER).
- `app/api/companies/[slug]/verify/route.ts` — POST verify (PLATFORM_ADMIN only).

### UI — Company pages

- `app/companies/page.tsx` — Discovery page; `CompaniesDiscovery` client component.
- `app/companies/[slug]/page.tsx` — Company overview (server); `getCompanyBySlugForPage`, CompanyHero, CompanyTabs, CompanyOverview; `notFound()` when missing.

### UI — Company components

- `components/company/CompanyHero.tsx` — Banner, logo, name, verified badge, industry/type/size tags, “Write a Review”, “Claim this company”.
- `components/company/CompanyTabs.tsx` — Tabs: Overview, Reviews, Interview Experiences, Salaries, Q&A, Jobs (client; uses pathname).
- `components/company/CompanyOverview.tsx` — About (sanitized), mission, quick facts, specialties, RatingSummaryCard, trending badges, benefits, MediaGallery.
- `components/company/RatingSummaryCard.tsx` — Overall score, sub-rating bars, recommend %, CEO %.
- `components/company/BenefitChip.tsx` — Icon + label + optional avg rating.
- `components/company/MediaGallery.tsx` — Photo grid (lightbox), video embed, virtual tour link.
- `components/company/CompaniesDiscovery.tsx` — Search, fetch GET /api/companies, company cards, pagination.

### Dashboard

- `app/dashboard/company/page.tsx` — Company admin dashboard (currently stub; Phase 3.10).

---

## Phase 3 Exit Checklist

- [x] All Prisma models created and migrated
- [x] Company CRUD and claim flow work (create, GET/PATCH by slug, claim, verify)
- [x] Company overview page renders with hero, tabs, ratings, benefits, media
- [ ] Reviews: submit, list (APPROVED only public), helpful vote, flag
- [ ] Interview reviews: submit and list
- [ ] Q&A: ask, answer (company admin), vote
- [ ] Benefits: add/remove, rate (API + display on overview done; admin add/remove pending)
- [ ] Salary stub: submit and view aggregate
- [x] Company discovery (/companies): search, filter, sort, paginate
- [ ] Company admin dashboard: edit profile, media, benefits, review moderation, team tab
- [x] Slug generation and uniqueness enforced
- [x] CompanyAdmin permissions enforced on all implemented write routes
- [x] Rich text (about) sanitized on render
- [ ] Rate limiting on review/interview submission

---

## Run / Deploy

1. **Database:** Set `DATABASE_URL`; run `npx prisma migrate deploy` (or `npx prisma migrate dev --name phase-3-company-profiles` if applying fresh).
2. **Company creation:** RECRUITER or COMPANY_ADMIN users can POST to `/api/companies` to create a company; creator becomes OWNER. Unclaimed companies can be claimed via POST `/api/companies/[slug]/claim`.
3. **Discovery:** Visit `/companies` for search and filters; `/companies/[slug]` for the public company overview.

---

## Dependencies Added (Phase 3)

- `sanitize-html` — Server-side sanitization of company `about` (rich text).
- `@types/sanitize-html` — TypeScript types (dev).
