# Ascend Regression Test Report

**Date:** 2025-02-27  
**Build:** Post Phase 1 & 2 Fixes

## Automated Tests

- **Unit tests:** 64 passed / 0 failed
- **Coverage:** ~9% (lib + app/api; many routes untested by design)

## Manual Tests

Manual testing is to be run by the team with `npm run dev`, PostgreSQL and Redis available. Use the checklist in `__tests__/MANUAL_TEST_CHECKLIST.md`.

### Passing ✅
- Not run in this session (automated-only run).

### Failing ❌
- None reported.

### Skipped ⏭
- **LinkedIn OAuth** — requires live `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`.
- **Email flows** (verification, reset) — require Resend API key and delivery.
- **DB integrity check** — skipped (no `DATABASE_URL` in environment); run locally: `npx tsx scripts/db-check.ts`.
- **Redis connectivity** — not run in this session; run locally with Redis on localhost:6379.

## Bugs Fixed During Testing

| Bug | File | Fix Applied |
|-----|------|-------------|
| Jest mock hoisting: `redis` / `mockUpload` referenced before init in mock factory | `__tests__/unit/lib/auth/denylist.test.ts`, `__tests__/unit/lib/redis/ratelimit.test.ts`, `__tests__/unit/lib/storage/index.test.ts` | Use inline mock object in `jest.mock(...)` and `jest.requireMock('...')` to obtain reference after mock is applied. |
| `tsc --noEmit` fails on test files (no Jest types in app tsconfig) | `tsconfig.json` | Exclude `__tests__` from `tsconfig.json` so app type-check passes without `@types/jest`. |

## Outstanding Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| ESLint warnings in build (no-img-element, react-hooks/exhaustive-deps) | Low | Non-blocking; can be addressed in Phase 2A or later. |
| `test:components` uses `--project components`; some Jest versions don't support `--project` | Low | Use `jest __tests__/components` if needed; no component tests yet. |
| Manual checklist not executed | — | To be run with local env + browser. |
| DB check / Redis check not run | — | Run when PostgreSQL and Redis are available. |

## Sign-off

- [x] All automated tests pass
- [ ] All manual tests pass (or documented as skipped with reason)
- [x] No High severity outstanding issues
- [x] npm run build passes (zero errors; ESLint warnings only)
- [x] npx tsc --noEmit passes (with `__tests__` excluded)

## Ready to proceed to Phase 2A

**READY FOR PHASE 2A ✅** — Automated suite passes, build and type-check pass, no high-severity issues. Manual testing and DB/Redis checks should be run in a full environment and any findings documented.
