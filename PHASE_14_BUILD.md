# Phase 14: SEO Optimizations — Build Summary

## Overview

Phase 14 makes Ascend discoverable to search engines. Every public page is instrumented with structured data, metadata, and crawlability signals. The largest single win is **Google for Jobs** eligibility via `JobPosting` JSON-LD on job detail pages — job listings can appear as rich cards in Google Search results.

No new product features were added; all work is metadata, JSON-LD, sitemap, robots, and SEO content pages.

## Deliverables

### 1. Metadata utility

- **lib/seo/metadata.ts:** `buildMetadata({ title, description?, path, ogImage?, noIndex?, type? })` returns Next.js `Metadata` with:
  - `title | SITE_NAME`, `description`, `metadataBase`, `alternates.canonical`
  - `openGraph` (title, description, url, siteName, images)
  - `twitter` (card, title, description, images)
  - Optional `robots: { index: false, follow: false }` when `noIndex: true`
- Exports `BASE_URL` (from `NEXT_PUBLIC_APP_URL` or `https://ascend.jobs`) and `SITE_NAME`.

### 2. JSON-LD schemas and component

- **lib/seo/schemas.ts:**
  - `buildJobPostingSchema(job)` — JobPosting for Google for Jobs (employmentType, hiringOrganization, jobLocation, baseSalary, skills, directApply, etc.).
  - `buildOrganizationSchema(company)` — Organization with optional aggregateRating when reviews exist.
  - `buildBreadcrumbSchema(items)` — BreadcrumbList.
  - `buildWebSiteSchema()` — WebSite with SearchAction (urlTemplate `/jobs?search={search_term_string}`).
- **components/seo/JsonLd.tsx:** Renders `<script type="application/ld+json">` with `JSON.stringify(schema)`.

### 3. Job detail page

- **app/jobs/[slug]/page.tsx:**
  - `generateMetadata`: fetches job by slug; returns `buildMetadata` with title `{job.title} at {companyName}`, description including location and salary snippet, path `/jobs/[slug]`.
  - Renders `JsonLd` for `buildJobPostingSchema(job)` and `buildBreadcrumbSchema(Home → Jobs → Company → Job)`.
  - `jobDetailInclude` in lib/jobs/queries now includes `companyRef.website` for schema.
- **app/jobs/[slug]/opengraph-image.tsx:** Dynamic OG image (1200×630, edge runtime): company name, job title, location, type, “Ascend” branding.

### 4. Job listing page

- **app/jobs/page.tsx:**
  - `revalidate = 300` (ISR every 5 minutes).
  - `generateMetadata({ searchParams })`: query-aware title/description (e.g. “{q} Jobs in {location}”, “Jobs in India — Search & Apply” when no query).

### 5. Company page

- **app/companies/[slug]/page.tsx:**
  - `revalidate = 3600` (ISR every hour).
  - `generateMetadata`: fetches company + active job count; title “{name} — Jobs, Reviews & Salaries”, description with job count.
  - Renders `JsonLd` for `buildOrganizationSchema(company)` (with headquarters from `hq`, aggregateRating when reviews exist) and `buildBreadcrumbSchema(Home → Companies → Company)`.

### 6. Root layout

- **app/layout.tsx:** Default `metadata` from `buildMetadata({ title, description, path: '/' })`. First child of body: `<JsonLd schema={buildWebSiteSchema()} />`.

### 7. Salary page

- **app/salary/page.tsx:** `metadata` from `buildMetadata` for “Salary Insights in India — Compare by Role & City”.

### 8. Sitemap and robots

- **app/sitemap.ts:** Dynamic sitemap: static URLs (/, /jobs, /companies, /salary, /auth/login, /auth/register, /insights/jd-library); active jobs (status ACTIVE, up to 10k); companies (up to 5k). Each with lastModified, changeFrequency, priority.
- **app/robots.ts:** Allow `/`, `/jobs`, `/companies`, `/salary`, `/insights`; disallow `/dashboard/`, `/api/`, `/settings/`, `/profile/edit`, `/resume/`, `/auth/`, `/notifications`, `/internal/`, `/admin/`. Sitemap and host set from `BASE_URL`.

### 9. JD Library (Phase 0 SEO asset)

- **app/insights/jd-library/page.tsx:** Index page with metadata “JD Library — What Companies Really Ask For”; revalidate 86400.
- **app/insights/jd-library/[role-slug]/page.tsx:** Statically generated role pages from `ParsedJD` (groupBy title, ≥10 JDs). `generateStaticParams` returns role slugs from `toRoleSlug(title)`. Page shows aggregated top skills and keywords for that role; metadata “What Companies Ask For in a {role} Role”. Revalidate 86400.

### 10. Slug audit and docs

- **scripts/seo/audit-slugs.ts:** Logs jobs whose slug does not contain `-at-` (for future canonical format).
- **docs/SEO_SETUP.md:** Checklist for Google Search Console (verify domain, submit sitemap, Rich Results Test, URL Inspection, performance monitoring).

### 11. Open Graph default image

- Default OG image URL is `${BASE_URL}/og-default.png`. **public/og-default.png** (1200×630) must be created manually with Ascend logo and tagline; referenced in `lib/seo/metadata.ts`.

## Key files

| File | Purpose |
|------|---------|
| lib/seo/metadata.ts | buildMetadata(), BASE_URL, SITE_NAME |
| lib/seo/schemas.ts | JobPosting, Organization, BreadcrumbList, WebSite schema builders |
| components/seo/JsonLd.tsx | Renders application/ld+json script |
| app/layout.tsx | Default metadata + WebSite JSON-LD |
| app/jobs/page.tsx | Dynamic metadata + ISR 300 |
| app/jobs/[slug]/page.tsx | generateMetadata + JobPosting + BreadcrumbList JSON-LD |
| app/jobs/[slug]/opengraph-image.tsx | Dynamic OG image per job |
| app/companies/[slug]/page.tsx | generateMetadata + Organization + BreadcrumbList + ISR 3600 |
| app/salary/page.tsx | Metadata |
| app/sitemap.ts | Dynamic sitemap (jobs, companies, static) |
| app/robots.ts | Allow/disallow + sitemap URL |
| app/insights/jd-library/page.tsx | JD Library index |
| app/insights/jd-library/[role-slug]/page.tsx | Per-role JD insights (static params from ParsedJD) |
| scripts/seo/audit-slugs.ts | Slug audit script |
| docs/SEO_SETUP.md | GSC setup checklist |

## Exit checklist

- [x] buildMetadata() utility in place
- [x] All four schema builders (JobPosting, Organization, BreadcrumbList, WebSite) implemented
- [x] JsonLd component renders script tag
- [x] Job detail: JobPosting + BreadcrumbList JSON-LD; generateMetadata; dynamic OG image
- [x] Job listing: query-aware generateMetadata; revalidate 300
- [x] Company page: Organization + BreadcrumbList; aggregateRating when reviews exist; revalidate 3600
- [x] Root layout: default metadata + WebSite schema
- [x] Sitemap: jobs, companies, static pages (+ insights/jd-library)
- [x] Robots: allow public paths; disallow dashboard, api, settings, auth, resume, internal, admin
- [x] Salary page metadata
- [x] JD Library index and [role-slug] pages (statically generated from ParsedJD)
- [x] Slug audit script; docs/SEO_SETUP.md
- [ ] public/og-default.png created manually (1200×630)
- [ ] Validate JobPosting in Google Rich Results Test (manual)
- [ ] Submit sitemap and verify domain in Google Search Console (manual)
