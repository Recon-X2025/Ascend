# Phase 21 Rollback — Remove Multilingual, English Only

**Date:** 2025-03-01  
**Status:** ✅ Complete

## Summary

Phase 21 added multilingual support (7 languages: en, hi, es, ar, fr, pt, de). This rollback removes all i18n overhead and keeps the platform **English-only**. Currency preference (INR/USD/EUR/BRL/GBP/AED/SGD) for salary display is retained.

---

## Deliverable Checklist

- [x] `next-intl` uninstalled, removed from `package.json`
- [x] `/messages/` directory deleted (en.json, hi.json, es.json, ar.json, fr.json, pt.json, de.json)
- [x] `middleware.ts` — no locale routing (unchanged; auth-only)
- [x] `NextIntlClientProvider` removed from root layout
- [x] All `t('key')` calls replaced with English string literals (only used in `/settings/language`, now `/settings/currency`)
- [x] RTL logic removed from layout (`dir="rtl"`, `isRtl` → hardcoded `lang="en"`)
- [x] `LanguageSwitcher` component deleted and removed from Navbar
- [x] `/settings/language` deleted; `/settings/currency` created (currency selector only)
- [x] Settings nav updated: "Currency" link added
- [x] Prisma: `preferredLanguage`, `preferredRegion` removed from `User`; `SupportedLanguage` model deleted; `ParsedJDTranslation` model deleted
- [x] `npx prisma db push --accept-data-loss` run (migration history had issues; `db push` used per prior convention)
- [x] `/api/user/preferences`: `preferredLanguage` + `preferredRegion` removed from schema; `preferredCurrency` kept
- [x] `scripts/ingestion/translate.ts` deleted
- [x] `jd-translate` BullMQ queue + worker deleted
- [x] `/dashboard/admin/languages` page deleted, admin nav link removed
- [x] `lib/i18n/locales.ts` deleted; `lib/i18n/currency.ts` kept
- [x] PWA manifest: `"lang": "en"` added; `/offline` page kept
- [x] `PHASE21_LANGUAGE_CHANGED` and `PHASE21_JD_TRANSLATED` outcome events removed from schema
- [x] `grep` checks for `next-intl`, `useTranslations`, `preferredLanguage` — zero results
- [x] `tsc --noEmit` passes
- [x] `npm run build` passes

---

## What Was Removed

| Item | Action |
|------|--------|
| `next-intl` | Uninstalled |
| `i18n/request.ts` | Deleted |
| `messages/*.json` | All 7 files deleted |
| `middleware.ts` locale | N/A (had no locale routing) |
| `NextIntlClientProvider` | Removed from `app/layout.tsx` |
| `html lang` / `dir` | Hardcoded `lang="en"`, no RTL |
| `LanguageSwitcher` | Deleted + removed from Navbar |
| `/settings/language` | Deleted |
| `User.preferredLanguage` | Removed from schema |
| `User.preferredRegion` | Removed from schema |
| `SupportedLanguage` model | Deleted |
| `ParsedJDTranslation` model | Deleted |
| `ParsedJD.translations` relation | Removed |
| `/api/user/preferences` language/region | Removed from GET/PATCH |
| `scripts/ingestion/translate.ts` | Deleted |
| `lib/queues/workers/jd-translate.worker.ts` | Deleted |
| `lib/ai/prompts/translate.ts` | Deleted |
| `jdTranslateQueue` | Removed from `lib/queues/index.ts` |
| `/dashboard/admin/languages` | Page + API routes + `AdminLanguagesClient` deleted |
| Admin "Languages" link | Removed from `AdminDashboardClient` |
| `lib/i18n/locales.ts` | Deleted |
| `translate:jds*` npm scripts | Removed from `package.json` |
| `PHASE21_LANGUAGE_CHANGED` | Removed from enum |
| `PHASE21_JD_TRANSLATED` | Removed from enum |

---

## What Was Kept

| Item | Reason |
|------|--------|
| `User.preferredCurrency` | Salary display in user's preferred currency |
| `lib/i18n/currency.ts` | `formatCurrency`, `convertFromInr`, `formatSalaryRange` |
| `/api/user/preferences` (currency only) | Users can still set preferred currency |
| PWA manifest + `/offline` page | Useful independently; `"lang": "en"` |
| `PHASE21_CURRENCY_CHANGED` | Outcome event for currency preference |
| `PHASE21_PWA_INSTALLED` | Outcome event for PWA |
| `PHASE21_RESUME_GENERATED_LANG` | Kept in enum |

---

## New / Updated Files

| File | Change |
|------|--------|
| `app/settings/currency/page.tsx` | New — currency selector only |
| `components/settings/SettingsNav.tsx` | Added "Currency" link |
| `next.config.mjs` | Removed next-intl plugin |
| `app/layout.tsx` | Removed i18n provider, RTL; `lang="en"` |
| `app/api/user/preferences/route.ts` | Currency-only GET/PATCH |
| `lib/auth/nextauth.ts` | Removed `preferredLanguage` from session |
| `lib/queues/index.ts` | Removed `jdTranslateQueue`, `JdTranslateJobData` |
| `prisma/schema.prisma` | Removed multilingual models/fields |
| `prisma/seed.ts` | Removed `SupportedLanguage` seeding |
| `public/manifest.json` | Added `"lang": "en"` |

---

## Verification Commands

```bash
# Must return zero results:
grep -r "useTranslations\|getTranslations\|useLocale\|NextIntlClientProvider\|next-intl" app/ components/ lib/

# Must return zero results (except migration files):
grep -r "preferredLanguage\|preferredRegion\|SupportedLanguage\|ParsedJDTranslation" app/ lib/ components/

# Must pass:
npx tsc --noEmit
npm run build
```

---

## Smoke Test

- `/jobs` — renders correctly in English  
- `/profile/[username]` — renders correctly  
- `/settings/currency` — currency selector works  
- `/dashboard/seeker` — renders correctly  

No missing translation keys or console errors.
