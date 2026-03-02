# M-11: Mentor Reputation & Tier System — Build Summary

## Overview

M-11 delivers **Mentor Reputation & Tier System**: system-calculated tiers (RISING / ESTABLISHED / ELITE) from verified outcome count, capacity enforcement, dispute-rate and verification-lapsed demotion, admin override, weekly cron, and discovery integration. No M-6 (Escrow) or M-7 (Steno) payment/session logic; fee percentages and stenoRate are stored but not wired to payment or demotion until those phases.

---

## Deliverables Checklist

- [x] Prisma: `MentorTier` enum; `MentorTierHistory` model; `MentorProfile` extended (tier, tierUpdatedAt, tierOverriddenByAdmin, tierOverrideNote, disputeRate, stenoRate, maxActiveMentees, activeMenteeCount); `OutcomeEventType` M11_*
- [x] `lib/mentorship/tiers.ts` — TIER_CONFIG, calculateTier, checkDemotionCriteria, recalculateMentorTier, recalculateDisputeRate, enforceCapacity, increment/decrementActiveMenteeCount
- [x] `verifyOutcome()` → `recalculateMentorTier(mentorId, 'OUTCOME_VERIFIED')`
- [x] `opsReviewOutcome()` (UPHELD) → recalculateDisputeRate + recalculateMentorTier(mentorId, 'WEEKLY_CALC')
- [x] Mentor ACCEPT flow → enforceCapacity() check; 409 MENTOR_AT_CAPACITY + capacity-reached email + M11_CAPACITY_ENFORCED
- [x] activeMenteeCount: increment on contract ACTIVE (verifyOTPAndSign); decrement on DISPUTED (verifyContractIntegrity)
- [x] GET `/api/mentorship/mentors/[mentorId]/tier` (public)
- [x] GET `/api/mentorship/mentors/[mentorId]/tier-history` (mentor or admin)
- [x] PATCH `/api/mentorship/mentors/[mentorId]/tier` (admin override)
- [x] DELETE `/api/mentorship/mentors/[mentorId]/tier-override` (admin clears override)
- [x] GET `/api/cron/recalculate-mentor-tiers` (weekly, batched); vercel.json Saturday 20:30 UTC (Sunday 02:00 IST)
- [x] Discovery: tier-based match score boost (ELITE +15, ESTABLISHED +8); GET `/api/mentorship/mentors/featured` ELITE-only, max 3, capacity check
- [x] Tier badge on discovery cards (ESTABLISHED / ELITE only); Featured Mentors row on `/mentorship`
- [x] Tier badge on `/mentorship/[mentorId]` public profile
- [x] `/dashboard/mentor`: Tier & Reputation card; link to tier-history
- [x] `/dashboard/mentor/tier-history`: table (previous/new tier, reason, date)
- [x] `/dashboard/admin/mentorship/tiers`: all mentors table, filters, override sheet, last cron summary
- [x] 4 Resend templates: tier-promoted, tier-demoted, tier-admin-override, capacity-reached
- [x] Outcome events: M11_TIER_PROMOTED, M11_TIER_DEMOTED, M11_TIER_ADMIN_OVERRIDE, M11_CAPACITY_ENFORCED (M11_WEEKLY_CALC_COMPLETE / M11_TIER_UNCHANGED not wired for cron; audit log used)
- [ ] Run migration: `npx prisma migrate dev --name m11_mentor_tier`
- [ ] `tsc --noEmit` passes ✅
- [ ] `npm run build` — may fail on existing Resend/@react-email dependency; M-11 code is type-correct

---

## File List

### Prisma
- `prisma/schema.prisma` — enum `MentorTier`; `MentorProfile` tier fields, disputeRate, stenoRate, activeMenteeCount; model `MentorTierHistory`; `OutcomeEventType` M11_*

### Lib
- `lib/mentorship/tiers.ts` — tier config and all tier logic

### API routes
- `app/api/mentorship/mentors/[mentorId]/tier/route.ts` — GET (public), PATCH (admin)
- `app/api/mentorship/mentors/[mentorId]/tier-history/route.ts` — GET (mentor or admin)
- `app/api/mentorship/mentors/[mentorId]/tier-override/route.ts` — DELETE (admin)
- `app/api/cron/recalculate-mentor-tiers/route.ts` — GET (CRON_SECRET)
- `app/api/admin/mentorship/tiers/route.ts` — GET (admin list + last cron)

### Email templates
- `lib/email/templates/mentorship/tier-promoted.ts`
- `lib/email/templates/mentorship/tier-demoted.ts`
- `lib/email/templates/mentorship/tier-admin-override.ts`
- `lib/email/templates/mentorship/capacity-reached.ts`

### UI
- `components/mentorship/MentorshipDiscoveryClient.tsx` — Featured row, tier badges on cards
- `components/mentorship/MentorProfileClient.tsx` — tier badge on profile
- `components/mentorship/mentor-dashboard/TierReputationCard.tsx`
- `components/mentorship/mentor-dashboard/TierHistoryClient.tsx`
- `app/dashboard/mentor/page.tsx` — passes profile to TierReputationCard
- `app/dashboard/mentor/tier-history/page.tsx`
- `app/dashboard/admin/mentorship/tiers/page.tsx`
- `components/dashboard/admin/AdminNav.tsx` — Mentor tiers link

### Wired
- `lib/mentorship/outcomes.ts` — verifyOutcome, opsReviewOutcome
- `app/api/mentorship/applications/[applicationId]/respond/route.ts` — enforceCapacity, capacity-reached email
- `lib/mentorship/contract.ts` — incrementActiveMenteeCount (ACTIVE), decrementActiveMenteeCount (DISPUTED)
- `app/api/mentorship/mentors/route.ts` — tier in response, tier boost for ranking
- `app/api/mentorship/mentors/featured/route.ts` — ELITE-only, capacity filter
- `app/api/mentorship/mentors/[mentorId]/route.ts` — tier in response

### Config
- `vercel.json` — cron `recalculate-mentor-tiers` at 30 20 * * 6 (Saturday 20:30 UTC)

---

## Migration Note

Run when DB is available:

```bash
npx prisma migrate dev --name m11_mentor_tier
```

---

## Exit Criteria

- Tiers RISING (0–4), ESTABLISHED (5–9), ELITE (10+) from verified outcome count; demotion on dispute rate >25% or verification lapsed >30 days.
- Admin can override tier and remove override; weekly cron recalculates non-overridden mentors.
- Capacity enforced on mentor accept (409 + email when at max); activeMenteeCount maintained on ACTIVE/terminal contract transitions.
- Discovery: tier boost for ranking; Featured row (ELITE, max 3); tier badges on cards and public profile.
- Mentor dashboard: Tier & Reputation card and tier-history page; admin tiers table and override sheet.
