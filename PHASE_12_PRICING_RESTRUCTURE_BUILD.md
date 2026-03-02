# Phase 12: Pricing Restructure — Build Summary

## Overview

Phase 12 restructures the pricing model with new plan keys, resume optimisation credits (pay-per-use), mentor marketplace subscription, and updated gates. SEEKER_PILOT_OPEN bypass remains for seeker features during pilot.

## Deliverables

### 1. lib/payments/plans.ts
- Replaced PLAN_LIMITS with new structure: SEEKER_FREE, SEEKER_PAID, MENTOR_FREE, MENTOR_PAID, MENTOR_MARKETPLACE, RECRUITER_FREE, RECRUITER_STARTER, RECRUITER_PRO, RECRUITER_ENTERPRISE, BOOST_*
- Export PlanKey type, PLAN_KEYS array
- `legacyPlanToKey()` — maps SEEKER_PREMIUM/SEEKER_ELITE → SEEKER_PAID
- Feature renames: `resumeOptimisationsPerMonth`, `fitScoreDetailed`, `jobPostsMax` (was activeJobPosts)

### 2. lib/payments/gate.ts
- `getUserPlan(userId)` — returns PlanKey; reads from UserSubscription.planKey or plan; fallback by role: SEEKER_FREE, MENTOR_FREE, RECRUITER_FREE
- `isUnlimited(limit)`, `getLimit(planKey, feature)`
- `canUseFeature` — FEATURE_ALIASES: optimiserSessionsPerMonth→resumeOptimisationsPerMonth, fitScoreBreakdown→fitScoreDetailed, activeJobPosts→jobPostsMax
- `checkJobPostLimit` — uses jobPostsMax
- SEEKER_PILOT_OPEN bypass unchanged

### 3. Prisma Schema
- **BillingPeriod** enum: MONTHLY, ANNUAL
- **UserSubscription** — added: planKey, billingPeriod, pricePaidPaise, startsAt, expiresAt, cancelledAt
- **ResumeOptimisationCredit** — userId, balance, paymentId

### 4. lib/payments/credits.ts
- `hasResumeOptimisationCredit(userId)`
- `deductResumeOptimisationCredit(userId)`
- `addResumeOptimisationCredits(userId, count, paymentId?)`

### 5. Phase 6A Optimiser API (app/api/resume/optimise/route.ts)
- When `resumeOptimisationsPerMonth === 0`: check `hasResumeOptimisationCredit`, return 402 PAY_PER_USE_REQUIRED if not
- When `resumeOptimisationsPerMonth === -1`: unlimited, proceed
- When quota > 0: monthly count gate
- Deduct credit for pay-per-use before creating session

### 6. Resume Optimise Purchase
- **Page:** `/resume/optimise/purchase` — "Unlock one resume optimisation — ₹99", Razorpay checkout
- **API:** POST /api/payments/create-order type: resume_credit (9900 paise)
- **Verify:** addResumeOptimisationCredits + PaymentEvent + PRICING_RESUME_CREDIT_PURCHASED

### 7. Webhook POST /api/webhooks/razorpay/resume-credit
- Idempotent; payment.captured → fetch order notes, addResumeOptimisationCredits
- Uses RAZORPAY_RESUME_CREDIT_WEBHOOK_SECRET or RAZORPAY_WEBHOOK_SECRET

### 8. Mentor Subscription
- **Page:** `/dashboard/mentor/subscription` — Monthly ₹1,199, Annual ₹11,942
- **API:** create-order type: mentor_subscription
- **Verify:** update UserSubscription to MENTOR_MARKETPLACE, set expiresAt
- **Become-mentor gate:** when `agreedToList` && plan !== MENTOR_MARKETPLACE → 402 redirectTo /dashboard/mentor/subscription
- **Webhook:** POST /api/webhooks/razorpay/mentor-subscription (idempotent)
- **TODO:** wire createInvoice() when subscription userId resolution is solved

### 9. Billing Dashboard
- Subscription tab — planKey/plan display, expiresAt
- **Resume Credits tab** — SEEKER_FREE only; balance + purchase link
- Admin: `/dashboard/admin/subscriptions` — summary, table, manual override (planKey, expiresAt)

### 10. Migration
- `scripts/migrate-legacy-plans.ts` — SEEKER_PREMIUM/SEEKER_ELITE → SEEKER_PAID in UserSubscription.planKey
- Prisma migration: `20260309000000_phase_12_pricing_restructure`

### 11. Pricing Page
- `/pricing` — Seeker Free/Paid, Recruiter, Mentor marketplace plans

### 12. Outcome Events
- PRICING_RESUME_CREDIT_PURCHASED
- PRICING_MENTOR_SUBSCRIPTION_PURCHASED
- PRICING_SEEKER_UPGRADE_CLICKED
- PRICING_RECRUITER_UPGRADE_CLICKED

### 13. canUseFeature Call Sites
- Feature aliases in gate.ts handle: optimiserSessionsPerMonth→resumeOptimisationsPerMonth, fitScoreBreakdown→fitScoreDetailed, activeJobPosts→jobPostsMax. No call-site changes required.

## Run Order

```bash
npx prisma migrate deploy   # apply phase_12_pricing_restructure
npx prisma generate
npx tsx scripts/migrate-legacy-plans.ts   # optional: backfill planKey
```

## Exit Checklist

- [x] lib/payments/plans.ts — new plan structure, PlanKey export
- [x] lib/payments/gate.ts — getUserPlan, isUnlimited, getLimit, feature aliases
- [x] Prisma — BillingPeriod, UserSubscription evolvement, ResumeOptimisationCredit
- [x] lib/payments/credits.ts
- [x] Optimiser API — pay-per-use + 402 PAY_PER_USE_REQUIRED
- [x] /resume/optimise/purchase page
- [x] Webhook resume-credit
- [x] /dashboard/mentor/subscription + become-mentor gate
- [x] Webhook mentor-subscription
- [x] Billing dashboard — subscription tab, Resume Credits tab
- [x] /dashboard/admin/subscriptions
- [x] migrate-legacy-plans.ts
- [x] /pricing page
- [x] PRICING_* outcome events
- [x] SEEKER_PILOT_OPEN bypass

---
*Phase 12 — Pricing Restructure | Ascend*
