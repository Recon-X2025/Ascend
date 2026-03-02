# SEO Setup — Google Search Console

## Steps completed

- [ ] Verified domain ownership via DNS TXT record
- [ ] Submitted sitemap: https://ascend.jobs/sitemap.xml
- [ ] Requested indexing for homepage, /jobs, /companies
- [ ] Tested job detail page with Rich Results Test (https://search.google.com/test/rich-results)
- [ ] Confirmed JobPosting schema passes validation (no errors, only warnings acceptable)
- [ ] Confirmed Organization schema passes validation on at least one company page
- [ ] Set up performance report monitoring (queries, impressions, CTR)
- [ ] Set up URL Inspection alerts for coverage errors

## Key URLs to monitor

- Homepage: https://ascend.jobs
- Jobs listing: https://ascend.jobs/jobs
- Sample job: https://ascend.jobs/jobs/[first-live-slug]
- Sample company: https://ascend.jobs/companies/[first-live-slug]
- Sitemap: https://ascend.jobs/sitemap.xml
- Robots: https://ascend.jobs/robots.txt

## Phase 14 deliverables

- **Metadata:** All public pages use `buildMetadata()` from `lib/seo/metadata.ts` with canonical URLs and Open Graph.
- **JSON-LD:** Job detail (JobPosting + BreadcrumbList), company (Organization + BreadcrumbList), root layout (WebSite with SearchAction).
- **Sitemap:** Dynamic `app/sitemap.ts` includes active jobs, companies, and static pages.
- **Robots:** `app/robots.ts` allows public paths and disallows dashboard, api, settings, auth, resume, internal, admin.
- **OG image:** Default `public/og-default.png` (1200×630); job detail has dynamic `opengraph-image.tsx`.
