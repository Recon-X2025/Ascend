# M-10: Outcome Verification & Attribution — Build Summary

## Overview

M-10 delivers **Outcome Verification & Attribution**: outcome claims at engagement end, 7-day mentee confirm/dispute window (VERIFIED / DISPUTED / UNACKNOWLEDGED), optional 6‑month check-in with badge, mentor profile stats (verified outcomes, transition types, avg time to outcome). No M-6/M-7 dependencies.

---

## Deliverables Checklist

- [x] Prisma: enums `OutcomeStatus`, `OutcomeCheckInStatus`; model `MentorshipOutcome`; `MentorProfile` extended (`verifiedOutcomeCount`, `totalEngagements`, `avgTimeToOutcomeDays`, `outcomeTypes`); `MentorshipContract.outcome`; `OutcomeEventType` M10_* values
- [x] `lib/mentorship/outcomes.ts` — submitOutcomeClaim, verifyOutcome, disputeOutcome, markUnacknowledged, opsReviewOutcome, submitCheckIn, recalculateMentorOutcomeStats
- [x] BullMQ: `outcomeAcknowledgementQueue`, `outcomeCheckinQueue`; workers `outcome-acknowledgement`, `outcome-checkin`
- [x] APIs: POST/GET `/api/mentorship/outcomes`, GET/PATCH `/api/mentorship/outcomes/[outcomeId]`, POST `/api/mentorship/outcomes/[outcomeId]/checkin`, GET `/api/mentorship/outcomes/mentor/[mentorId]` (public stats)
- [x] GET `/api/cron/outcome-reminders` — reminder emails (PENDING_MENTEE deadline, DISPUTED → ops); `vercel.json` cron
- [x] Email templates: outcome-submitted, outcome-reminder, outcome-verified, outcome-disputed, outcome-unacknowledged, ops-review-complete, testimonial-consent-confirmed, checkin-reminder, checkin-completed
- [x] Engagement dashboard: Outcome section (submit claim modal, confirm/dispute, 6‑month update); engagement GET includes `outcome`
- [x] Mentor public profile: Verified Outcomes section (count, avg time, outcome types, recent testimonials) via GET outcomes/mentor/[mentorId]
- [x] Mentor discovery cards: `verifiedOutcomeCount` in list API and “✓ X verified outcomes” on cards
- [x] Profile badge: 6-Month Check-In Verified on `/profile/[username]` when user has any outcome with `checkInBadgeGranted`
- [x] Admin: `/dashboard/admin/mentorship/outcomes` — Disputed tab (table + detail sheet with ops-review), All outcomes tab (filter by status, export CSV); GET `/api/admin/mentorship/outcomes`
- [ ] Run migration when DB ready: `npx prisma migrate dev --name m10_outcome_verification`

---

## File List

### Prisma
- `prisma/schema.prisma` — enums `OutcomeStatus`, `OutcomeCheckInStatus`; model `MentorshipOutcome`; `MentorProfile` fields; `MentorshipContract.outcome`; `OutcomeEventType` M10_*

### Lib
- `lib/mentorship/outcomes.ts` — core outcome logic
- `lib/queues/index.ts` — outcomeAcknowledgementQueue, outcomeCheckinQueue
- `lib/queues/workers/outcome-acknowledgement.worker.ts`
- `lib/queues/workers/outcome-checkin.worker.ts`

### API routes
- `app/api/mentorship/outcomes/route.ts` — POST submit claim, GET by contractId
- `app/api/mentorship/outcomes/[outcomeId]/route.ts` — GET, PATCH (verify/dispute/ops-review)
- `app/api/mentorship/outcomes/[outcomeId]/checkin/route.ts` — POST 6‑month check-in
- `app/api/mentorship/outcomes/mentor/[mentorId]/route.ts` — GET public mentor outcome stats
- `app/api/cron/outcome-reminders/route.ts` — GET cron
- `app/api/admin/mentorship/outcomes/route.ts` — GET list (admin)

### Email templates
- `lib/email/templates/mentorship/outcome-submitted.ts`
- `lib/email/templates/mentorship/outcome-reminder.ts`
- `lib/email/templates/mentorship/outcome-verified.ts`
- `lib/email/templates/mentorship/outcome-disputed.ts`
- `lib/email/templates/mentorship/outcome-unacknowledged.ts`
- `lib/email/templates/mentorship/ops-review-complete.ts`
- `lib/email/templates/mentorship/testimonial-consent-confirmed.ts`
- `lib/email/templates/mentorship/checkin-reminder.ts`
- `lib/email/templates/mentorship/checkin-completed.ts`

### UI
- `components/mentorship/EngagementDashboardClient.tsx` — Outcome section + submit modal
- `components/mentorship/MentorProfileClient.tsx` — Verified Outcomes section (SWR outcomes/mentor/[userId])
- `components/mentorship/MentorshipDiscoveryClient.tsx` — “✓ X verified outcomes” on cards
- `components/profile/PublicProfileView.tsx` — 6-Month Check-In Verified badge
- `app/profile/[username]/page.tsx` — passes hasMentorshipCheckInBadge
- `app/dashboard/admin/mentorship/outcomes/page.tsx` — Disputed / All tabs, ops-review sheet
- `components/dashboard/admin/AdminNav.tsx` — Outcome disputes link

### Config
- `vercel.json` — cron `outcome-reminders` at 03:30 UTC (09:00 IST)

---

## Migration Note

Run when DB is available:

```bash
npx prisma migrate dev --name m10_outcome_verification
```

Then `npx prisma generate` if not already run.

---

## Exit Criteria

- Mentor can submit outcome claim when engagement end or FINAL milestone complete; mentee gets 7-day window to confirm or dispute.
- Unacknowledged claims auto-mark UNACKNOWLEDGED after 7 days (worker).
- Verified outcomes update mentor profile stats; 6‑month check-in available for mentee with badge.
- Admin can review disputed outcomes (UPHELD/OVERTURNED) from dashboard.
- Mentor discovery and profile show verified outcome count and testimonials where applicable.
- Public profile shows 6-Month Check-In Verified badge for mentees who completed check-in.
