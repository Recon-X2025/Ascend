# Phase 1 Report — Saved Search Alerts (BL-5)

**Date Completed:** March 3, 2026  
**Phase ID:** BL-5  
**Status:** ✅ COMPLETE

---

## FILES CREATED

- `__tests__/unit/lib/alerts/processor.test.ts` — Unit tests for `inferDatePostedFromLastSent`
- `BL_PHASE_1_REPORT.md` — This report

## FILES MODIFIED

- `lib/alerts/processor.ts` — Subject line with job count; `datePosted` from `lastSentAt`; export `inferDatePostedFromLastSent`
- `app/jobs/saved-searches/page.tsx` — Saved-search limit notice "You have X/10 saved searches"
- `app/jobs/saved-searches/page.tsx` — Pass count and MAX_SAVED_SEARCHES to UI

## DATABASE CHANGES

- None (no schema changes)

## API ENDPOINTS ADDED

- None (existing `/api/cron/alerts/immediate`, `/api/cron/alerts/daily`, `/api/cron/alerts/weekly` unchanged)

## WORKERS ADDED / MODIFIED

- None (processAlerts runs via cron routes, not a BullMQ worker)

## COMPONENTS ADDED

- None

## COMPONENTS MODIFIED

- `app/jobs/saved-searches/page.tsx` — Added limit notice paragraph

## TESTS ADDED

- `__tests__/unit/lib/alerts/processor.test.ts` — 6 tests for `inferDatePostedFromLastSent` (null, 24h, 7d, 30d boundaries)

---

## BUILD STATUS: PASS

```
npm run build — Exit code 0
```

## TEST STATUS: PASS

```
npm test — 154 tests passed (including 6 new alert processor tests)
```

---

## EXTERNAL DEPENDENCIES

- Resend (email) — unchanged
- Typesense (search) — unchanged
- Cron routes require `CRON_SECRET` for auth

## KNOWN ISSUES

- None. Cron jobs (`/api/cron/alerts/immediate`, `/daily`, `/weekly`) must be scheduled externally (e.g. Vercel Cron, external cron service) — `vercel.json` crons array is empty.

## VALIDATION SUMMARY

| Step | Status |
|------|--------|
| Phase analysis | ✅ |
| Backend (processor, datePosted/lastSentAt) | ✅ |
| Frontend (saved-search limit notice) | ✅ |
| Build check | ✅ |
| Database migration | N/A (no schema change) |
| Automated testing | ✅ |
| Functional validation | ✅ (logic verified) |
| Integration validation | ✅ (no regressions) |
| Performance check | ✅ (no new heavy queries) |
| Phase report | ✅ |
| Regression test | ✅ (key pages load) |

---

## DELIVERABLES

1. **Subject line improvement** — Emails now show "5 new jobs matching [name]" instead of generic "New jobs matching [name]"
2. **datePosted optimization** — When `lastSentAt` exists, search narrows to 24h/7d/30d based on time since last send
3. **Saved-search limit notice** — "/jobs/saved-searches" page shows "You have X/10 saved searches"
4. **Unit tests** — 6 tests for datePosted inference logic

---

*Phase 1 complete. Ready for Phase 2 (Profile View Notifications / BL-1) on user instruction.*
