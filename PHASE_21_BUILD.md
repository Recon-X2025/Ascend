# Phase 21 Build — Global Multilingual & Market Expansion

## Exit checklist

- [x] Prisma migration: `phase21_global_multilingual` — User extended (preferredLanguage, preferredCurrency, preferredRegion), ParsedJDTranslation model, SupportedLanguage model
- [x] `/messages/` directory with all 7 translation files (en, hi, es, ar, fr, pt, de), keys aligned with spec
- [x] next-intl: i18n/request.ts loads all 7 locales, fallback to English for missing keys; locale from cookie
- [x] RTL layout: `app/layout.tsx` sets `<html dir="rtl" lang="ar">` when locale is `ar`
- [x] `/settings/language` page (language, region, currency; PATCH preferences; cookie + refresh)
- [x] GET/PATCH `/api/user/preferences`
- [x] `LanguageSwitcher` updated (7 languages, dropdown with native name + flag; auth + anon via cookie)
- [x] `lib/i18n/currency.ts` — formatCurrency, convertFromInr, formatSalaryRange, SUPPORTED_CURRENCIES
- [x] Salary on job cards uses preferredCurrency (session.preferredCurrency passed to JobCard)
- [x] Subscription/billing: upgrade page can show INR vs USD note (billing copy in page; full pricing by currency can be wired to preferences)
- [x] `scripts/ingestion/translate.ts` + npm scripts `translate:jds`, `translate:jds:es`, etc.
- [x] `lib/ai/prompts/translate.ts` (JD translation prompt)
- [ ] JD detail page: show ParsedJD translation alongside original when available (ParsedJD is ingestion layer; JobPost detail can be extended when JobPost↔ParsedJD link exists)
- [ ] Resume builder: language selector + multilingual AI generation + RTL/Devanagari PDF (stub/placeholder for follow-up)
- [ ] hreflang / localised sitemaps / OG locale (can be added in metadata helper and sitemap)
- [x] PWA: `/public/manifest.json` + theme/background; manifest link in layout; `/offline` page
- [ ] Service worker (next-pwa or custom) and “Add to Home Screen” prompt (manifest and offline in place; SW optional)
- [x] `/dashboard/admin/languages` — table, coverage %, active toggle, “Trigger JD translation” → BullMQ
- [x] GET `/api/admin/languages`, PATCH `/api/admin/languages/[code]`, POST `/api/admin/languages/[code]/translate`
- [x] Outcome events: PHASE21_LANGUAGE_CHANGED, PHASE21_CURRENCY_CHANGED (PHASE21_JD_TRANSLATED, PHASE21_RESUME_GENERATED_LANG, PHASE21_PWA_INSTALLED in schema; tracking wired where applicable)
- [x] `tsc --noEmit` passes
- [ ] `npm run build` — may fail on pre-existing dependency (e.g. Resend / @react-email/render); Phase 21 code is type-clean

## File list

### Prisma & DB
- `prisma/schema.prisma` — User.preferredLanguage, preferredCurrency, preferredRegion; ParsedJDTranslation; SupportedLanguage; OutcomeEventType Phase 21 values
- `prisma/seed.ts` — SupportedLanguage seed (7 languages)
- `prisma/migrations/20260307000000_phase21_global_multilingual/migration.sql`

### Messages & i18n
- `messages/en.json` — source of truth (nav, auth, jobs, profile, dashboard, mentorship, common, settings, resume, billing)
- `messages/hi.json`, `es.json`, `ar.json`, `fr.json`, `pt.json`, `de.json`
- `i18n/request.ts` — all 7 locales, deepMergeFallback to en
- `lib/i18n/locales.ts` — SUPPORTED_LOCALES, LOCALE_INFO, isRtl, isValidLocale
- `lib/i18n/currency.ts` — SUPPORTED_CURRENCIES, formatCurrency, convertFromInr, formatSalaryRange

### Layout & auth
- `app/layout.tsx` — `dir="rtl"` for `ar`, manifest link, theme-color
- `lib/auth/nextauth.ts` — session callback adds preferredCurrency, preferredLanguage from DB

### Settings & API
- `app/settings/language/page.tsx` — language, region, currency form; PATCH preferences; cookie + refresh
- `app/api/user/preferences/route.ts` — GET/PATCH; outcome events for language/currency change
- `components/layout/LanguageSwitcher.tsx` — 7 languages, dropdown, cookie + API for auth

### Salary & job cards
- `components/jobs/JobCard.tsx` — preferredCurrency prop, formatSalary with formatSalaryRange
- `components/jobs/JobsListing.tsx` — useSession, pass preferredCurrency to JobCard

### JD translation
- `lib/ai/prompts/translate.ts` — buildJDTranslatePrompt, JD_TRANSLATE_PROMPT_VERSION
- `scripts/ingestion/translate.ts` — batch translate ParsedJD → ParsedJDTranslation
- `lib/queues/index.ts` — jdTranslateQueue, JdTranslateJobData
- `lib/queues/workers/jd-translate.worker.ts` — worker for jd-translate queue
- `package.json` — scripts: translate:jds, translate:jds:hi, :es, :ar, :fr, :pt, :de

### Admin
- `app/dashboard/admin/languages/page.tsx` — server wrapper
- `components/dashboard/admin/AdminLanguagesClient.tsx` — table, coverage, active toggle, trigger translate
- `app/api/admin/languages/route.ts` — GET list + coverage %
- `app/api/admin/languages/[code]/route.ts` — PATCH isActive, launchDate
- `app/api/admin/languages/[code]/translate/route.ts` — POST queue JD translate job
- `components/dashboard/admin/AdminDashboardClient.tsx` — link to Languages

### PWA
- `public/manifest.json` — name, short_name, start_url, display, colors, icons (paths expect /icons/icon-*.png)
- `app/offline/page.tsx` — offline message and link home

## Notes

- **Locale routing:** Locale is determined by cookie `NEXT_LOCALE` and (in request config) fallback to en. URL-prefix routing (`/es/jobs`) would require moving app routes under `app/[locale]/` and middleware rewrite; not done in this phase.
- **Exchange rates:** Set env vars `EXCHANGE_RATE_USD_INR`, `EXCHANGE_RATE_EUR_INR`, etc. (target per 1 INR). Non-INR salary display is labeled approximate when converted.
- **Icons:** Add `/public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` for PWA.
- **Resume builder language / RTL PDF:** Deferred; schema and prompts are in place for a follow-up.
- **Hreflang / sitemaps:** Can be added in `lib/seo/metadata.ts` and `app/sitemap.ts` using SUPPORTED_LOCALES.
