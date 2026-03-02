# Phase 5: Job Search & Filters — Build Summary

Phase 5 replaces the Phase 4 ILIKE job search with **Typesense** full-text search, adds **faceted filters**, **saved searches**, **job alerts**, and a **Redis** cache layer.

---

## 5.1 — Search Backend (Typesense)

- **lib/search/client.ts** — Singleton Typesense client from env: `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL`, `TYPESENSE_API_KEY`. Export: `typesenseClient`.
- **lib/search/schemas/jobs.ts** — Collection `jobs` with fields: id, title (infix), description, companyName, companySlug, location[], workMode, jobType, skills[], salaryMin/Max, salaryVisible, experienceMin/Max, educationLevel, tags[], status, easyApply, companyRating, companyVerified, publishedAt (int64), viewCount, applicationCount. Default sort: `publishedAt` DESC. `ensureJobsCollection()`.
- **lib/search/sync/jobs.ts** — `indexJob(job, companyRating?)` (fire-and-forget upsert), `removeJob(jobId)`, `reindexAllJobs()` (batch 100). Transform Prisma JobPost → Typesense doc; call `invalidateJobSearchCache()` after index/remove.

---

## 5.2 — Search API & Cache

- **lib/search/queries/jobs.ts** — `searchJobs(params)`: filter_by, facet_by, sort_by (recent | salary | relevance), datePosted → publishedAt filter. Returns `{ hits, found, facets, page, totalPages }`.
- **lib/search/cache.ts** — `getCachedSearch` / `setCachedSearch` (key = 16-char SHA-256 prefix), `getCachedSuggestions` / `setCachedSuggestions` (10 min TTL), `getJobFeed` / `cacheJobFeed` (15 min), `invalidateJobSearchCache()` (SCAN + DEL `search:jobs:*`).
- **GET /api/jobs** — Uses `searchJobs()`; Redis cache (5 min TTL) when **unauthenticated**; on Typesense error falls back to Prisma `getJobsForListing()`; response: `{ data, found, facets, page, totalPages }`. Hydrates hit IDs from DB for consistent list shape.
- **Sync hooks (fire-and-forget):**
  - **POST /api/jobs** — After create, if status ACTIVE: `indexJob(fullJob, companyRating)`.
  - **PATCH /api/jobs/[id]** — If status CLOSED/PAUSED: `removeJob(id)`; if ACTIVE: `indexJob(updatedJob, companyRating)`.
  - **DELETE /api/jobs/[id]** — After update status to CLOSED: `removeJob(id)`.
  - **GET /api/cron/close-expired-jobs** — After `closeExpiredJobs()` (returns `closedIds`), calls `removeJob(id)` for each.
- **lib/jobs/deadline.ts** — `closeExpiredJobs()` now returns `{ count, closedIds }` for index removal.
- **scripts/reindex-jobs.ts** — `ensureJobsCollection()` then `reindexAllJobs()`; npm script: `reindex:jobs`.

---

## 5.3 — Search UI

- **components/jobs/JobFilters.tsx** — Filters: keyword (moved to SearchBar), location, job type, work mode, **skills** (multi-select, search-within, top 10 + “Show more”), **min company rating** (0–5, 0.5 steps; hidden when `companySlug` set), date posted, easy apply, include not disclosed, **verified only**. Facet counts next to options. **Your saved searches** (collapsed) to re-apply.
- **components/jobs/JobsListing.tsx** — Fetches `/api/jobs` with URL query params; **URL sync** via `useSearchParams` / `router.push`; **active filter chips** with remove and “Clear all”; result count “X jobs found”; sort: Recent / Salary / Relevance; **loading**: 5 skeleton cards; **error**: “Search is temporarily unavailable…” + Try again; **empty**: “No jobs match…” + Clear filters; **300ms debounce** on keyword (in SearchBar).
- **GET /api/jobs/suggestions?q=** — Typesense prefix search on title, companyName; returns `{ titles: string[], companies: string[] }` (top 5 / 3); Redis cache 10 min.
- **components/jobs/SearchBar.tsx** — Keyword input, **suggestions popover** (titles + companies), **recent searches** dropdown (focus, no query), keyboard nav (arrows + Enter), Escape/click outside to close; **Save this search** (bookmark) when authenticated.

---

## 5.4 — Saved Searches

- **Prisma** — `SavedSearch`: id, userId, name, query, filters (Json), createdAt. Index: userId.
- **GET /api/search/saved** — List for current user.
- **POST /api/search/saved** — Body: `{ name, query, filters }`; max 10 per user.
- **DELETE /api/search/saved/[id]** — Own only.
- **UI** — “Save this search” in search bar (bookmark) → POST with current query/filters. **/jobs/saved-searches**: list with “Search again”, “Create Alert”, Delete. Filter panel: “Your saved searches” (from JobsListing + JobFilters).

---

## 5.5 — Job Alerts

- **Prisma** — `JobAlert`: id, userId, savedSearchId?, name, query, filters (Json), frequency (IMMEDIATE | DAILY | WEEKLY), active (default true), lastSentAt?, createdAt. Indexes: userId, (frequency, active).
- **GET /api/alerts** — List for current user.
- **POST /api/alerts** — Body: `{ name?, query, filters, frequency, savedSearchId? }`; limit 3 (free) / 20 (premium).
- **PATCH /api/alerts/[id]** — Update name, frequency, active.
- **DELETE /api/alerts/[id]** — Own only.
- **POST /api/alerts/[id]/test** — Send test email via `processAlertById(id)`.
- **lib/alerts/processor.ts** — `processAlertById(alertId)` (single test); `processAlerts(frequency)`: load active alerts, run `searchJobs`, filter by `publishedAt > lastSentAt`, send digest (max 10 jobs), update `lastSentAt`. Email: “New jobs matching [name]”, job cards with View link, “View all X results”.
- **Cron** — POST, `CRON_SECRET`:
  - **/api/cron/alerts/immediate** — `processAlerts("IMMEDIATE")`
  - **/api/cron/alerts/daily** — `processAlerts("DAILY")`
  - **/api/cron/alerts/weekly** — `processAlerts("WEEKLY")`
- **UI** — Saved search page: “Create Alert” → frequency (Immediate/Daily/Weekly) → POST. **/settings/job-alerts**: list alerts, toggle active, change frequency, Test, Delete; limit notice “You have X/3 alerts. Upgrade for up to 20.”

---

## 5.6 — Search History

- **Prisma** — `SearchHistory`: id, userId, query, filters (Json?), searchedAt. Index: (userId, searchedAt DESC). Cap: last 20 per user on POST.
- **POST /api/search/history** — Body: `{ query, filters? }`; fire-and-forget from client after search.
- **GET /api/search/history** — Last 10 for current user; includes `summary` (filter summary string).
- **DELETE /api/search/history** — No query: clear all; `?query=...`: delete that item.
- **UI** — Search bar: on focus with no query, “Recent searches” (last 5); click to re-run; “×” to delete one; “Clear history”.

---

## 5.7 — Redis Cache

- **lib/search/cache.ts** — Search results 5 min; suggestions 10 min; job feed 15 min. `invalidateJobSearchCache()` used in `indexJob` and `removeJob`.

---

## Environment Variables

- `TYPESENSE_HOST`
- `TYPESENSE_PORT` (default 443)
- `TYPESENSE_PROTOCOL` (default https)
- `TYPESENSE_API_KEY`

---

## Phase 5 Exit Checklist

- [x] Typesense client configured; jobs collection schema created
- [x] indexJob / removeJob / reindexAllJobs; sync wired into job create/update/close routes
- [x] searchJobs with filter_by and facets
- [x] GET /api/jobs uses Typesense with Prisma fallback
- [x] Redis cache (5 min TTL); invalidated on index/remove
- [x] Search UI: facet counts, active chips, URL sync, result count
- [x] Autocomplete suggestions (title + company); Redis cached
- [x] Search history: record, retrieve, display in search bar
- [x] Saved searches: save, list, re-apply, delete; /jobs/saved-searches
- [x] Job alerts: create, frequency, email digest, cron routes; limit 3 free
- [x] /settings/job-alerts: list, toggle, frequency, delete
- [x] reindex-jobs.ts script
- [ ] Typesense fallback tested (disconnect Typesense → jobs page still works). **Test:** `docker stop typesense` → visit `/jobs` → console should show "Typesense error, falling back to Prisma"; restart with `docker start typesense` and tick when verified.

---

## What's next (reordered sequence)

| Phase   | Focus                          | Status        |
|---------|---------------------------------|---------------|
| Phase 5 | Job Search & Filters           | ✅ Done       |
| **Phase 3B** | Clear company profile debt   | ← **Next**    |
| **Phase 0**  | JD ingestion (parallel)       | Running       |

---

## Key Files

| Area | Path |
|------|------|
| Search client | lib/search/client.ts |
| Schema | lib/search/schemas/jobs.ts |
| Sync | lib/search/sync/jobs.ts |
| Queries | lib/search/queries/jobs.ts |
| Cache | lib/search/cache.ts |
| Alerts | lib/alerts/processor.ts |
| Reindex | scripts/reindex-jobs.ts |
| Jobs GET | app/api/jobs/route.ts |
| Suggestions | app/api/jobs/suggestions/route.ts |
| Saved | app/api/search/saved/route.ts, app/api/search/saved/[id]/route.ts |
| History | app/api/search/history/route.ts |
| Alerts | app/api/alerts/route.ts, app/api/alerts/[id]/route.ts, app/api/alerts/[id]/test/route.ts |
| Cron alerts | app/api/cron/alerts/immediate, daily, weekly |
| UI | components/jobs/JobFilters.tsx, JobsListing.tsx, SearchBar.tsx |
| Pages | app/jobs/saved-searches/page.tsx, app/settings/job-alerts/page.tsx |
