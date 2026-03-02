# M-3: Mentee Onboarding & Application Layer — Build Summary

## Overview

M-3 builds the mentee side of the mentorship marketplace: readiness gates, curated discovery (max 3 matches with plain-language reasons), and the structured application flow. Mentees earn access to mentors; max 2 simultaneous applications; one question per application from mentor; 5-day response SLA with BullMQ expiry worker.

## Delivered

### 1. Prisma schema & migration

- **Enum:** `MentorApplicationStatus` (PENDING, QUESTION_ASKED, ACCEPTED, DECLINED, EXPIRED, WITHDRAWN).
- **MentorApplication:** menteeId, mentorProfileId, 5 content fields (whyThisMentor, goalStatement, commitment, timeline, whatAlreadyTried), mentorQuestion, menteeAnswer, declineReason, matchReason, matchScore, status, submittedAt, mentorRespondedAt, expiresAt, questionAskedAt, answerSubmittedAt. Unique (menteeId, mentorProfileId).
- **MenteeReadinessCheck:** userId (unique), profileComplete, careerContextComplete, transitionDeclared, allGatesPassed, target transition fields (targetFromRole, targetFromIndustry, targetToRole, targetToIndustry, targetCity, targetTimelineMonths), lastCheckedAt.
- **Relations:** User.menteeApplications, User.menteeReadiness; MentorProfile.applications.
- **Migration:** `prisma/migrations/20260301180000_m3_mentee_application/migration.sql`. Run `npx prisma migrate deploy` (or `migrate dev`) when ready.

### 2. Services

- **lib/mentorship/readiness.ts:** `computeReadiness(userId)` — Gate 1 (profile: headline, location, role, experience, ≥1 skill, ≥1 experience), Gate 2 (UserCareerContext.completionScore ≥ 80), Gate 3 (target transition on MenteeReadinessCheck or CareerIntent). Upserts MenteeReadinessCheck, returns check + targetTransition.
- **lib/mentorship/discover.ts:** `discoverMentors(menteeId)` — Verified, public, active mentors with capacity; excludes self and already-applied; placeholder scoring (toRole, toIndustry, fromRole, geography, capacity); top 3 with `matchReason` (plain language). M-4 will replace scoring.
- **lib/mentorship/validate.ts:** Zod word-range helpers, `MentorApplicationSchema` (no matchScore in client), `TargetTransitionSchema`, `MenteeAnswerSchema`, `MentorRespondSchema`.

### 3. API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/mentorship/readiness` | GET | Own readiness check (allGatesPassed, profileComplete, careerContextComplete, transitionDeclared, targetTransition). |
| `/api/mentorship/readiness` | PATCH | Update target transition; re-runs computeReadiness; returns updated check. |
| `/api/mentorship/discover` | GET | Curated matches (max 3). 403 with gateBlocked + check if !allGatesPassed. Never returns matchScore. |
| `/api/mentorship/applications` | GET | List own applications (mentee); status, mentor summary, matchReason; includes mentorQuestion, menteeAnswer. |
| `/api/mentorship/applications` | POST | Submit application (gates, max 2 active, no duplicate); matchScore from server-side discover; expiresAt +5 days; email to mentor. |
| `/api/mentorship/applications/[id]` | GET | Single application (mentee or mentor); declineReason only for mentor. |
| `/api/mentorship/applications/[id]` | PATCH | Mentee: WITHDRAW or ANSWER (question); email on answer. |
| `/api/mentorship/applications/[id]/respond` | POST | Mentor: ACCEPT, DECLINE (with declineReason), ASK (one question, 409 if already asked); emails. |
| `/api/mentorship/applications/expire` | POST | System: Bearer CRON_SECRET; expires PENDING/QUESTION_ASKED where expiresAt < now; email mentee. |
| `/api/mentorship/applications/inbox` | GET | Mentor inbox: list applications to current user’s mentor profile with full content. |

### 4. BullMQ expiry worker

- **workers/mentorship-expiry.ts:** Worker for queue `mentorship-expiry`; job calls `POST /api/mentorship/applications/expire` with CRON_SECRET. `registerMentorshipExpiryRepeatable()` adds repeatable job every 6 hours. Call `registerMentorshipExpiryRepeatable()` once on startup (e.g. in queue/worker runner).
- **lib/queues/index.ts:** `mentorshipExpiryQueue` added.

### 5. Pages

- **/mentorship:** Hub — State A: ReadinessGate (3 gates + target transition form). State B: up to 3 MentorMatchCardM3 or “at limit” message or empty state. Replaces previous catalogue discovery.
- **/mentorship/apply/[mentorUserId]:** Application form; server redirects if not logged in; client gates (readiness, max 2, no duplicate); mentor context card + ApplicationForm (5 fields, word counters); success → redirect to /mentorship/applications after 3s.
- **/mentorship/applications:** List own applications; status badges; expiry countdown; answer to mentor question inline; withdraw; links to /mentorship.

### 6. Components

- **ReadinessGate:** Gate checklist + target transition inline form (PATCH readiness).
- **MentorMatchCardM3:** Discovery card — mentor name, verified badge, transition, match reason (italic), focus areas, availability/capacity, “Apply to [Name]”.
- **ApplicationForm:** 5 WordCountTextarea fields (100–200, 50–150, 50–150, 30–100, 50–150 words); submit → POST applications (matchScore set server-side).
- **ApplicationCard:** Mentee list card — status, dates, expiry countdown, mentor question + answer input or display, withdraw, status copy (accepted/declined/expired).
- **MentorApplicationInbox:** Mentor dashboard section — full application content, Accept / Decline (with reason) / Ask one question; badge count.
- **WordCountTextarea:** Shared textarea with live word count and min/max hint.

### 7. Email templates (Resend)

- **lib/email/templates/mentorship/application-received.ts:** To mentor — new application, why excerpt, dashboard link.
- **mentor-question.ts:** To mentee — mentor’s question, applications link.
- **mentee-answer.ts:** To mentor — mentee’s answer, dashboard link.
- **application-accepted.ts:** To mentee — congratulations, contract coming soon.
- **application-declined.ts:** To mentee — “Not the right fit”; link to /mentorship.
- **application-expired.ts:** To mentee — no response, new match.
- **application-withdrawn.ts:** To mentor — mentee withdrew.

### 8. Dashboard integration

- **Seeker dashboard:** MentorshipWidget — gates not passed → “Unlock mentor matching”; gates passed no apps → “Your matches are ready”; active apps → count + “View applications”; accepted → “Mentorship with [Name] starting”.
- **Mentor dashboard:** Applications section (MentorApplicationInbox) with pending count badge; full application text, Accept / Decline / Ask one question.

## Architectural notes

- `matchScore` stored on application but never returned to mentee-facing APIs.
- `declineReason` stored but never returned to mentee; mentee sees generic “Not the right fit”.
- Max 2 simultaneous PENDING/QUESTION_ASKED enforced server-side on POST applications.
- One question per application enforced (409 if mentor asks again).
- Word counts enforced server-side with Zod; client counters for UX only.
- All gates checked server-side on application submit.

## File checklist

- prisma/schema.prisma (MentorApplication, MenteeReadinessCheck, MentorApplicationStatus; relations)
- prisma/migrations/20260301180000_m3_mentee_application/migration.sql
- lib/mentorship/readiness.ts, discover.ts, validate.ts
- workers/mentorship-expiry.ts
- lib/queues/index.ts (mentorshipExpiryQueue)
- app/api/mentorship/readiness/route.ts, discover/route.ts
- app/api/mentorship/applications/route.ts, applications/[applicationId]/route.ts, applications/[applicationId]/respond/route.ts, applications/expire/route.ts, applications/inbox/route.ts
- app/mentorship/page.tsx (MentorshipHubClient), apply/[mentorUserId]/page.tsx + ApplyPageClient.tsx, applications/page.tsx + ApplicationsListClient.tsx
- components/mentorship/ReadinessGate.tsx, MentorMatchCardM3.tsx, ApplicationForm.tsx, ApplicationCard.tsx, MentorApplicationInbox.tsx, WordCountTextarea.tsx
- components/dashboard/seeker/MentorshipWidget.tsx
- components/mentorship/mentor-dashboard/MentorDashboardClient.tsx (MentorApplicationInbox)
- lib/email/templates/mentorship/*.ts (7 templates)

## Next

M-4 (Matching Engine) will replace the placeholder scoring in `lib/mentorship/discover.ts` with the full algorithm. M-5 will wire the contract flow after ACCEPTED.
