# M-8: Session Rhythm & Milestone Framework — Build Summary

## Overview

M-8 delivers the **Session Rhythm & Milestone Framework**: the structured lifecycle of an active mentorship engagement. It builds on existing contract and session models. No M-6 (Escrow) or M-7 (Meeting Room/Steno) dependencies; sessions are manually marked complete by the mentor.

**Constraint:** No payment triggers, no join log or Steno references. `NO_SHOW` is reserved for M-9.

---

## Deliverables Checklist

- [x] Prisma migration: new enums (`EngagementType`, `MilestoneType`, `MilestoneStatus`, `DocumentType`), `NO_SHOW` on `SessionStatus`; models `EngagementSession`, `EngagementMilestone`, `EngagementDocument`; `MentorshipContract` extended with `engagementType`, `engagementStart`, `engagementEnd`, `sessions`, `milestones`, `documents`
- [x] `lib/mentorship/engagement.ts` — `ENGAGEMENT_CONFIG`, `initialiseEngagement()`
- [x] `verifyOTPAndSign()` in `lib/mentorship/contract.ts` wired to `initialiseEngagement()` on ACTIVE
- [x] `MentorshipContract.engagementType` — default STANDARD; set at contract creation from mentor profile `engagementPreference`
- [x] GET `/api/mentorship/engagements/[contractId]` — full engagement state
- [x] PATCH `/api/mentorship/engagements/[contractId]/sessions/[sessionId]` — schedule / complete / cancel (mentor)
- [x] PATCH `/api/mentorship/engagements/milestones/[milestoneId]` — file assessment (mentor or mentee)
- [x] POST `/api/mentorship/documents/[id]/goal` — create goal document (id = contractId; mentor, after session 1 complete)
- [x] POST `/api/mentorship/documents/[id]/sign` — sign document (id = documentId; mentor or mentee)
- [x] POST `/api/mentorship/documents/[id]/outcome` — create outcome document (id = contractId; mentor)
- [x] GET `/api/cron/engagement-reminders` — daily cron (ending soon, milestone reminder, session reminder, overdue goal)
- [x] 14 Resend email templates (engagement-started, session-scheduled/completed/cancelled, milestone-filed/complete/reminder, goal/outcome document created/final, document-signed, engagement-ending-soon, engagement-overdue-goal, session-reminder)
- [x] `/mentorship/engagements/[contractId]` — engagement dashboard (EngagementHeader, SessionTimeline, MilestonePanel, DocumentSection)
- [x] `/mentorship/dashboard` — Active Engagement card with CTA to engagement
- [x] Schedule session modal (mentor); Mark complete modal (mentor)
- [x] 9 outcome events: M8_ENGAGEMENT_INITIALISED, M8_SESSION_SCHEDULED, M8_SESSION_COMPLETED, M8_SESSION_CANCELLED, M8_MILESTONE_FILED, M8_MILESTONE_COMPLETE, M8_GOAL_DOCUMENT_CREATED, M8_DOCUMENT_SIGNED, M8_OUTCOME_DOCUMENT_CREATED
- [x] `npm run build` passes
- [x] `tsc --noEmit` passes (with Prisma generate)

---

## File List

### Prisma
- `prisma/schema.prisma` — enums `EngagementType`, `MilestoneType`, `MilestoneStatus`, `DocumentType`; `SessionStatus.NO_SHOW`; models `EngagementSession`, `EngagementMilestone`, `EngagementDocument`; `MentorshipContract` extensions; `OutcomeEventType` M8_* values

### Lib
- `lib/mentorship/engagement.ts` — ENGAGEMENT_CONFIG, initialiseEngagement()
- `lib/mentorship/contract.ts` — createContract() sets engagementType; verifyOTPAndSign() calls initialiseEngagement() on ACTIVE

### API routes
- `app/api/mentorship/engagements/[contractId]/route.ts` — GET engagement state
- `app/api/mentorship/engagements/active/route.ts` — GET active engagement summary for dashboard
- `app/api/mentorship/engagements/[contractId]/sessions/[sessionId]/route.ts` — PATCH schedule/complete/cancel
- `app/api/mentorship/engagements/milestones/[milestoneId]/route.ts` — PATCH file assessment
- `app/api/mentorship/documents/[id]/goal/route.ts` — POST create goal (id = contractId)
- `app/api/mentorship/documents/[id]/sign/route.ts` — POST sign (id = documentId)
- `app/api/mentorship/documents/[id]/outcome/route.ts` — POST create outcome (id = contractId)
- `app/api/cron/engagement-reminders/route.ts` — GET daily cron

### Email templates
- `lib/email/templates/mentorship/engagement-started.ts`
- `lib/email/templates/mentorship/engagement-session-scheduled.ts`
- `lib/email/templates/mentorship/engagement-session-completed.ts`
- `lib/email/templates/mentorship/engagement-session-cancelled.ts`
- `lib/email/templates/mentorship/engagement-milestone-filed.ts`
- `lib/email/templates/mentorship/engagement-milestone-complete.ts`
- `lib/email/templates/mentorship/engagement-milestone-reminder.ts`
- `lib/email/templates/mentorship/engagement-session-reminder.ts`
- `lib/email/templates/mentorship/engagement-goal-document-created.ts`
- `lib/email/templates/mentorship/engagement-document-signed.ts`
- `lib/email/templates/mentorship/engagement-goal-document-final.ts`
- `lib/email/templates/mentorship/engagement-outcome-document-created.ts`
- `lib/email/templates/mentorship/engagement-outcome-document-final.ts`
- `lib/email/templates/mentorship/engagement-ending-soon.ts`
- `lib/email/templates/mentorship/engagement-overdue-goal.ts`

### UI
- `app/mentorship/engagements/[contractId]/page.tsx` — engagement dashboard page
- `components/mentorship/EngagementDashboardClient.tsx` — EngagementHeader, SessionTimeline, MilestonePanel, DocumentSection, schedule/complete modals
- `components/mentorship/MentorshipDashboardClient.tsx` — Active Engagement card + link to `/mentorship/engagements/[contractId]`

### Config
- `vercel.json` — cron `engagement-reminders` daily at 02:30 UTC (08:00 IST)

---

## Migration Note

If `npx prisma migrate dev --name m8_session_rhythm` fails (e.g. shadow DB / existing migration issue), run `npx prisma generate` and apply the schema to your database when ready. Migration SQL can be generated with `npx prisma migrate diff`.

---

## Exit Criteria

- [x] All deliverables above implemented
- [x] Build and type-check pass
- [x] No M-6/M-7 dependencies; NO_SHOW not wired (M-9)
- [x] Engagement type default STANDARD at contract creation
- [x] Session 1 Goal Setting milestone + Mid/Final per engagement type
- [x] Zod validation on API inputs; auth on all mentorship APIs
