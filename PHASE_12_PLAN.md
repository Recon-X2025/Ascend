# Phase 12: Monetisation (Multi-Gateway) — Plan & Build Summary

## Overview

Phase 12 adds the full monetisation layer to Ascend with a **payment abstraction**: application code never calls Razorpay or Stripe directly; it uses `lib/payments` (PaymentService pattern), which routes by currency (INR → Razorpay, USD → Stripe).

**Gateways:**
- **Razorpay** — INR (UPI, cards, netbanking, wallets). Subscriptions via Razorpay Subscriptions; one-time via Razorpay Orders.
- **Stripe** — USD/international. Stripe Billing for subscriptions; Payment Element for one-time.

**Pricing (locked):**

| Product | Price |
|---------|-------|
| Seeker Premium | ₹499/month · ₹3,999/year |
| Seeker Elite | ₹999/month · ₹7,999/year (scaffold only) |
| Recruiter Starter | ₹4,999/month |
| Recruiter Pro | ₹12,999/month |
| Recruiter Enterprise | ₹29,999+/month (manual — contact sales) |
| Standard job boost | ₹799/week |
| Featured job listing | ₹1,999/week |
| Urgent hiring badge | ₹299/week (add-on) |
| Resume DB unlock | ₹999 per 10 profile unlocks (Starter) |

**Pilot rule:** All gates are enforcement-ready; `SEEKER_PILOT_OPEN=true` keeps seeker features unlocked during pilot. Recruiter monetisation is live (companies pay to post).

---

## Architectural constraints

1. All payment logic goes through `lib/payments` — no direct Razorpay/Stripe in API or components.
2. Every payment is logged to `PaymentEvent` — idempotent, webhook-safe.
3. Subscription status is source of truth — never trust client-side plan claims.
4. Feature gates are enforced server-side only.
5. Webhooks are idempotent (replay-safe).
6. Enterprise is manual — no self-serve; "Contact Sales" flow.

---

## Deliverables

### 1. Prisma models (migration: `phase-12-monetisation`)

- **Enums:** `PlanType`, `PaymentGateway`, `PaymentStatus`, `SubscriptionStatus`
- **UserSubscription** — user's current plan, gateway sub/customer IDs, period, cancelAtPeriodEnd
- **CompanySubscription** — company/recruiter plan, seats, same fields
- **PaymentEvent** — all transactions (one-time + subscription); `gatewayEventId` unique for idempotency
- **JobBoost** — jobPostId, companyId, boostType, startsAt/endsAt, amountPaid, gatewayPayId, active
- **ResumeUnlock** — recruiterId, seekerId, companyId, amountPaid, gatewayPayId; unique (recruiterId, seekerId)
- **Relations:** User (subscription, paymentEvents, resumeUnlocksAsRecruiter, unlockedBy); Company (subscription, boosts, resumeUnlocks); JobPost (boosts)

### 2. Payment abstraction (`lib/payments/`)

| File | Purpose |
|------|---------|
| **types.ts** | Currency, Gateway, CreateOrderParams/Result, CreateSubscriptionParams/Result, VerifyPaymentParams, RefundParams |
| **razorpay.ts** | createOrder, createSubscription, verifyPayment (HMAC), refund; lazy init from env |
| **stripe.ts** | createOrder (PaymentIntent), createSubscription, verifyPayment (stub), refund; getStripeInstance() for webhooks |
| **index.ts** | selectGateway(currency), createOrder, createSubscription, refund; re-exports adapters and types |
| **pricing.ts** | BOOST_PRICE_PAISE (standard/featured/urgent), RESUME_UNLOCK_PACK_PRICE_PAISE, RESUME_UNLOCK_PACK_SIZE |
| **plans.ts** | PLAN_LIMITS for all 6 plan types, getLimits(plan), isPilotFreeOverride() |
| **gate.ts** | getUserPlan, getCompanyPlan, canUseFeature(userId, feature), checkJobPostLimit(companyId) |

### 3. API routes

| Route | Purpose |
|-------|---------|
| **POST /api/payments/create-order** | One-time order (boost or resume_unlock); body: type, jobPostId/boostType/weeks or seekerId; returns orderId, amount, gateway, key |
| **POST /api/payments/verify** | Razorpay HMAC verification; creates PaymentEvent + JobBoost or ResumeUnlock; idempotent on gatewayEventId |
| **POST /api/payments/subscribe** | Creates subscription (plan, currency, billingCycle, optional companyId); RECRUITER_ENTERPRISE → contact sales |
| **POST /api/payments/cancel-subscription** | Sets cancelAtPeriodEnd = true for current user |
| **GET /api/payments/subscription** | Current user subscription (plan, status, period end, cancelAtPeriodEnd) |
| **POST /api/webhooks/razorpay** | Signature verification; payment.captured, subscription.activated/cancelled; idempotent |
| **POST /api/webhooks/stripe** | constructEvent; invoice.payment_succeeded, customer.subscription.deleted |
| **POST /api/jobs/[id]/boost** | Creates boost order (boostType, weeks); returns order for Razorpay checkout |
| **GET /api/cron/deactivate-expired-boosts** | Sets JobBoost.active = false where endsAt < now(); optional CRON_SECRET |

### 4. Billing & boost UI

- **/dashboard/billing** — Current plan card, next billing date, payment history, upgrade CTA
- **/dashboard/billing/upgrade** — Placeholder upgrade + "Contact Sales" for Enterprise
- **/dashboard/recruiter/jobs/[id]/boost** — Boost purchase flow (type + weeks → create order → Razorpay)
- **components/payments/RazorpayCheckout.tsx** — Loads script, opens modal, onSuccess(paymentId, signature)
- **components/payments/StripeCheckout.tsx** — Payment Element + confirm (use with Stripe Elements provider)
- **components/payments/BoostPurchaseForm.tsx** — Type (standard/featured), weeks, create order, Razorpay, verify

### 5. Plan gates wired

- **Resume optimiser** — canUseFeature(userId, 'optimiserSessionsPerMonth'); monthly session count; 402 when limit exceeded (pilot bypass)
- **Job post (ACTIVE)** — checkJobPostLimit(companyId) when creating ACTIVE job with companyId; 402 with current/limit
- **Fit score** — canUseFeature(userId, 'fitScoreBreakdown'); free users get overallScore only; premium get full breakdown

### 6. Environment & dependencies

- **.env.local.example** — Razorpay (key, secret, webhook, plan IDs); Stripe (secret, publishable, webhook, price IDs); SEEKER_PILOT_OPEN; CRON_SECRET
- **npm:** razorpay, stripe, @stripe/stripe-js, @stripe/react-stripe-js

---

## Key files

| File | Purpose |
|------|---------|
| prisma/schema.prisma | UserSubscription, CompanySubscription, PaymentEvent, JobBoost, ResumeUnlock + relations |
| lib/payments/types.ts | Shared payment types |
| lib/payments/razorpay.ts | Razorpay adapter |
| lib/payments/stripe.ts | Stripe adapter |
| lib/payments/index.ts | Gateway router |
| lib/payments/plans.ts | PLAN_LIMITS, getLimits, isPilotFreeOverride |
| lib/payments/gate.ts | getUserPlan, getCompanyPlan, canUseFeature, checkJobPostLimit |
| lib/payments/pricing.ts | Boost and unlock prices (paise) |
| app/api/payments/* | create-order, verify, subscribe, cancel-subscription, subscription |
| app/api/webhooks/razorpay/route.ts | Razorpay webhook handler |
| app/api/webhooks/stripe/route.ts | Stripe webhook handler |
| app/api/jobs/[id]/boost/route.ts | Job boost order |
| app/api/cron/deactivate-expired-boosts/route.ts | Expire boosts cron |
| app/dashboard/billing/page.tsx | Billing UI |
| app/dashboard/recruiter/jobs/[id]/boost/page.tsx | Boost purchase page |
| components/payments/RazorpayCheckout.tsx | Razorpay modal |
| components/payments/StripeCheckout.tsx | Stripe Payment Element |
| components/payments/BoostPurchaseForm.tsx | Boost flow client |

---

## Run order

```bash
# Migration (if not already applied)
npx prisma migrate deploy   # or: npx prisma migrate dev --name phase-12-monetisation

# Regenerate client
npx prisma generate

# Env: set RAZORPAY_*, STRIPE_*, SEEKER_PILOT_OPEN, optional CRON_SECRET in .env.local
```

---

## Exit checklist

- [x] Migration applied — UserSubscription, CompanySubscription, PaymentEvent, JobBoost, ResumeUnlock
- [x] lib/payments — types, razorpay, stripe, index, plans, gate, pricing
- [x] createOrder / createSubscription / refund via abstraction
- [x] PLAN_LIMITS for all 6 plan types; canUseFeature, checkJobPostLimit
- [x] POST create-order, verify, subscribe, cancel-subscription; GET subscription
- [x] Webhooks: Razorpay + Stripe, idempotent, signature verification
- [x] POST /api/jobs/[id]/boost; cron deactivate-expired-boosts
- [x] /dashboard/billing, upgrade stub, /dashboard/recruiter/jobs/[id]/boost
- [x] RazorpayCheckout, StripeCheckout, BoostPurchaseForm
- [x] Optimiser gate (402 when limit exceeded); job post limit (402); fit-score breakdown gate
- [x] Env vars in .env.local.example; razorpay, stripe, @stripe/* installed
- [x] Enterprise → contact sales; SEEKER_PILOT_OPEN bypass

**Optional / follow-up:**
- [ ] Boost visibility in job listing (pin featured/sponsored above organic in search)
- [ ] Full plan comparison table on billing; Stripe client secret route for Payment Element
- [ ] InMail credits gate (Phase 9 messages route when built)

---

*Phase 12 — Monetisation (Multi-Gateway: Razorpay + Stripe) | Ascend*
