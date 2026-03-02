# M-13: Mentor Monetisation Unlock — Build Summary

## Overview

M-13 delivers the **Mentor Monetisation Unlock** — "Monetisation is earned, not bought." All five criteria must be met before a mentor can charge mentees. Unlock is automatic (weekly cron); no manual application. Session fee floor ₹2,000–ceiling ₹25,000. SEO boost for discovery ranking. Monthly payout reports.

**Criteria:** minVerifiedOutcomes 3, minStenoRate 90%, maxUpheldDisputes 0, minMonthsOnPlatform 6, reVerificationCurrent. `canChargeMentees` requires both `isUnlocked` AND active MENTOR_MARKETPLACE plan.

---

## Deliverables Checklist

- [x] Prisma migration `m13_mentor_monetisation` — MentorMonetisationStatus, MentorSeoBoost, SeoBoostType, MentorProfile extended (sessionFeePaise, canChargeMentees, monthlyReportSentAt, upheldDisputeCount)
- [x] MONETISATION_UNLOCK_CRITERIA, MENTORSHIP_PRICING_RULES constants
- [x] seoBoostPricing in MENTOR_MARKETPLACE_PLAN
- [x] `lib/mentorship/monetisation.ts` — checkMonetisationEligibility, computeStenoRate, runMonetisationUnlockCheck, validateSessionFee, setSessionFee
- [x] `lib/mentorship/seo-boost.ts` — purchaseSeoBoost, hasActiveSeoBoost, getSeoBoostMultiplier, expireEndedBoosts
- [x] GET /api/cron/mentorship-monetisation-check (Monday 06:00 IST)
- [x] GET /api/cron/seo-boost-expire (daily 00:00 IST)
- [x] GET /api/cron/monthly-mentor-report, GET /api/cron/annual-mentor-summary
- [x] Razorpay mentor-subscription webhook extended — canChargeMentees gate
- [x] GET /api/mentorship/mentor/monetisation-status
- [x] POST /api/mentorship/mentor/monetisation-check (rate limited 1/24hrs)
- [x] PATCH /api/mentorship/mentor/session-fee
- [x] POST /api/mentorship/mentor/seo-boost
- [x] POST /api/webhooks/razorpay/seo-boost
- [x] GET /api/admin/mentorship/monetisation
- [x] /dashboard/mentor/pricing — fee setting
- [x] /dashboard/mentor/seo-boost — boost options
- [x] TierReputationCard — Monetisation Unlock progress widget
- [x] Discovery: SEO boost multiplier (same-tier only)
- [x] BullMQ: monthly-mentor-report, annual-mentor-summary workers
- [x] Outcome events: M13_MONETISATION_UNLOCKED, M13_MONETISATION_ELIGIBLE, M13_MONETISATION_RELOCKED, M13_SESSION_FEE_SET, M13_SESSION_FEE_UPDATED, M13_SEO_BOOST_PURCHASED, M13_SEO_BOOST_EXPIRED, M13_MONTHLY_REPORT_SENT
- [x] upheldDisputeCount stub — // TODO: populated by M-9

---

## Exit Criteria

- [x] `tsc --noEmit` passes
- [x] `npm run build` passes
- [x] Zod on all API inputs

---

## Key Files

- `prisma/schema.prisma` — MentorMonetisationStatus, MentorSeoBoost
- `lib/mentorship/monetisation.ts`
- `lib/mentorship/seo-boost.ts`
- `app/api/cron/mentorship-monetisation-check/route.ts`
- `app/api/cron/seo-boost-expire/route.ts`
- `app/dashboard/mentor/pricing/page.tsx`
- `app/dashboard/mentor/seo-boost/page.tsx`
- `components/mentorship/mentor-dashboard/TierReputationCard.tsx`
