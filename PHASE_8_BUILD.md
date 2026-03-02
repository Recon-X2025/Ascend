# Phase 8: Salary Insights — Build Summary

## Overview

Phase 8 delivers the **Salary Insights** product: browse salaries by role/company/city, compare with cost of living, estimate market value, and see top payers. Data comes from **SalaryReport** (community, APPROVED only) and **JDSalarySignal** (JD-extracted). Individual data is never exposed; aggregates only, with a 5-submission minimum for community data. Premium gates percentile breakdowns, top payers, and city comparison.

## Delivered

### 1. Prisma schema & migration

- **SalaryInsightCache:** `cacheKey` (unique), `data` (Json), `submissionCount`, `jdSignalCount`, `computedAt`, `expiresAt` (24h TTL).
- **CityMetric:** `city` (unique), `rentIndex`, `costIndex` (Bangalore = 100 baseline), `updatedAt`.
- **Migration:** `20260301060952_phase8_salary_insights`.

### 2. Plan limits (Phase 12)

- **lib/payments/plans.ts:** Added `salary_percentiles`, `salary_top_payers`, `salary_city_comparison`, `salary_estimator_full` (all `false` for FREE, `true` for SEEKER_PREMIUM/SEEKER_ELITE). Used by `canUseFeature()` for gating.

### 3. Data layer — lib/salary

| File | Purpose |
|------|---------|
| **percentile.ts** | Linear interpolation: p25, p50, p75, p90 from sorted values. |
| **normalize.ts** | JDSalarySignal normalisation (midpoint of range, annual); `roleToSlug()`, `normaliseCity()`. |
| **cache.ts** | Build cache keys (role, company, top-payers, trending); `getCached`, `setCached`, `invalidateCacheByPrefix`. |
| **aggregate.ts** | `getRoleSalary`, `getCompanySalaries`, `getTopPayers`, `getCitySalaryComparison`, `getSalaryEstimate`, `getTrendingRoles`. Community 5+ floor; combined 70% community / 30% JD when both exist. |
| **format.ts** | `formatSalaryLPA`, `formatSalaryShort` (₹XL/yr, ₹X Cr/yr). |

### 4. API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/salary/roles` | GET | Browse/search by role; optional city, year, page. Returns roles with median and source label. |
| `/api/salary/role/[slug]` | GET | Detail for one role: median, city breakdown, source. Premium: p25/p75/p90, top payers, city comparison. |
| `/api/salary/company/[companyId]` | GET | Salaries by role for a company. Premium: p25/p75 per role. |
| `/api/salary/estimate` | POST | Body: role, city, yearsExp, companyType?. Rate limit 10/hr (IP) or 50/hr (auth). Free: estimate; Premium: range + confidence. |
| `/api/salary/top-payers` | GET | Query: role, city. Premium-gated; 403 + upgradeRequired for free. |
| `/api/salary/city-comparison` | GET | Query: role, cities (comma, max 5). Premium-gated. |
| `/api/salary/trending` | GET | Trending roles from JDSalarySignal; public, cached. |

### 5. Premium gating

- **components/shared/PremiumGate.tsx:** Wraps content; when `allowed` is false, renders children with `blur(4px)` and overlay (lock icon + “Upgrade to Premium” CTA). Never hides content.
- All salary APIs that return percentiles / top payers / city comparison check `canUseFeature(userId, feature)`; unauthenticated treated as FREE.

### 6. Cache invalidation

- On **admin approve** of a salary submission (`PATCH /api/admin/moderation/salary/[id]/approve`): invalidate cache prefixes for that role slug, company id, and top payers so next request recomputes.

### 7. Pages

| Path | Description |
|------|-------------|
| `/salary` | Hub: hero (“Know your worth”), role + city search, trending roles strip, browse by category, how it works, Premium upsell. |
| `/salary/roles/[slug]` | Role detail: median, city table, percentile bar (Premium), city comparison (Premium), top payers (Premium), estimator widget, “Add your salary” CTA. |
| `/salary/companies/[slug]` | Company salary: table by role (median; Premium: p25/p75), “Add your salary” → `/reviews/salary/new?companyId=`. |
| `/salary/compare` | City comparison tool (Premium): role + cities input; shows upgrade message for free users. |
| `/salary/estimate` | Standalone estimator form; result shows estimate (free) or range + confidence (Premium). |

### 8. Components

- **SalaryOverviewCard,** **PercentileBar,** **CityComparisonTable,** **TopPayersCard:** Display components.
- **SalaryEstimatorWidget:** Form (role, city, yearsExp) + result; used on role page and standalone estimate page.
- **RoleSearchBar:** Role + optional city, “Explore salaries” → `/salary/roles/[slug]`.
- **TrendingRolesStrip:** Fetches `/api/salary/trending`, horizontal role cards.
- **DataSourceBadge:** “Community reported” / “From job postings” / “Combined” pill.

### 9. Navigation & job detail

- Nav “Salary” / “Salary Insights” already point to `/salary` (verified).
- **Job detail** (`/jobs/[slug]`): When job has visible salary, added “See how this compares →” linking to `/salary/roles/[role-slug]?city=[city]`.

### 10. BullMQ

- **lib/queues/index.ts:** `salaryAggregateQueue`, `SalaryAggregateJobData` (role, city?, year?).
- **lib/queues/workers/salary-aggregate.worker.ts:** Worker that calls `getRoleSalary` to warm cache for heavy roles (optional use for background pre-warm).

## Key files

| Area | Paths |
|------|-------|
| Schema | `prisma/schema.prisma` (SalaryInsightCache, CityMetric); `prisma/migrations/.../phase8_salary_insights/` |
| Plans | `lib/payments/plans.ts` (salary_* feature flags) |
| Lib | `lib/salary/percentile.ts`, `normalize.ts`, `cache.ts`, `aggregate.ts`, `format.ts` |
| APIs | `app/api/salary/roles/route.ts`, `role/[slug]/route.ts`, `company/[companyId]/route.ts`, `estimate/route.ts`, `top-payers/route.ts`, `city-comparison/route.ts`, `trending/route.ts` |
| Moderation | `app/api/admin/moderation/salary/[id]/approve/route.ts` (cache invalidation) |
| Components | `components/salary/*`, `components/shared/PremiumGate.tsx` |
| Pages | `app/salary/page.tsx`, `app/salary/roles/[slug]/page.tsx`, `app/salary/companies/[slug]/page.tsx`, `app/salary/compare/page.tsx`, `app/salary/estimate/page.tsx` |
| Queue | `lib/queues/index.ts`, `lib/queues/workers/salary-aggregate.worker.ts` |

## Acceptance criteria (checklist)

- [x] `/salary` hub loads with trending roles and search.
- [x] Role search returns results with correct median and source label.
- [x] `/salary/roles/[slug]` shows median + city table for free users.
- [x] Percentile breakdown blurred for free users with upgrade CTA visible.
- [x] Premium user sees full percentile breakdown, top payers, city comparison.
- [x] Estimator returns estimate for free user, full range for premium.
- [x] Company salary page shows role breakdown.
- [x] `/salary/compare` city comparison tool works for premium users; free sees upgrade message.
- [x] JD signal data normalised (range → midpoint; ParsedJD already annual).
- [x] Aggregations cached (SalaryInsightCache, 24h); second request returns cached result.
- [x] Cache invalidated when new salary submission approved in admin.
- [x] 5-submission floor enforced for community data; JD-only when community &lt; 5.
- [x] Individual submission data never returned in any API response.
- [x] `canUseFeature()` correctly gates premium endpoints.
- [x] Salary Insights nav link points to `/salary`.
- [x] Job detail page shows “See how this compares” link when salary data exists.

## Notes

- **SalaryReport** (Phase 7) is the community source; **JDSalarySignal** (Phase 0) is the JD source. No new migration for SalaryReport.
- **CityMetric** can be seeded separately for cost-of-living indices (e.g. Bangalore = 100); aggregation uses 100 as default when city not in table.
- Recruiter-facing salary benchmarking is Phase 16B.

---

*Phase 8 — Company Launch track. Next: Phase 16B (Recruiter Intelligence) or Phase 10B (Candidate Intelligence).*
