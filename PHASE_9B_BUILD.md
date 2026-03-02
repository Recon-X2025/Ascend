# Phase 9B: Mentorship Layer — Build Summary

## Overview

Phase 9B builds the **mentorship layer** on top of the existing Career Graph (Phase 9). Mentors are existing Ascend users who opt in; seekers with `EARLY_CAREER` persona or `isSwitchingField: true` in `UserCareerContext` can discover mentors who made the same transition, request sessions, and track outcomes. The layer uses the existing `ConnectionType.MENTOR` and adds dedicated mentor profiles, availability, session lifecycle, notifications, and career signals.

## Delivered

### 1. Prisma (migration `add-mentorship-layer`)

- **Enums:** `MentorTransition` (IC_TO_MANAGER, MANAGER_TO_IC, STARTUP_TO_LARGE, LARGE_TO_STARTUP, INDIA_TO_GLOBAL, DOMAIN_SWITCH, INDUSTRY_SWITCH, FIRST_JOB, LEVEL_UP, RETURN_TO_WORK), `MentorStyle` (STRUCTURED, ASYNC, AD_HOC), `SessionFormat` (VIDEO_CALL, VOICE_CALL, ASYNC_CHAT, IN_PERSON), `SessionStatus` (REQUESTED, ACCEPTED, SCHEDULED, COMPLETED, CANCELLED, DECLINED), `MentorFocusArea` (RESUME_REVIEW, INTERVIEW_PREP, CAREER_PLANNING, SALARY_NEGOTIATION, LEADERSHIP, TECHNICAL_GROWTH, WORK_LIFE_BALANCE, NETWORKING, ENTREPRENEURSHIP).
- **Models:** `MentorProfile` (userId, transition story, availability, focus areas, ratings, verification), `MentorAvailability` (dayOfWeek, startTime, endTime, timezone), `MentorSession` (mentorProfileId, menteeId, status, sessionGoal, sessionFormat, scheduledAt, meetingLink, menteeRating, menteeFeedback, outcomeAchieved, careerSignalFired).
- **User relations:** `mentorProfile`, `menteeSessions` (MenteeSession).
- **NotificationType:** MENTOR_SESSION_REQUESTED, MENTOR_SESSION_ACCEPTED, MENTOR_SESSION_DECLINED, MENTOR_SESSION_COMPLETED.
- **SignalType:** MENTOR_PROFILE_CREATED, MENTOR_SESSION_COMPLETED.

### 2. Mentor opt-in flow

- **Page:** `/mentorship/become-mentor` — 3 steps: (1) Transition story (dropdown + currentRole, previousRole, yearsOfExperience), (2) What you offer (mentoringStyles, sessionFormats, focusAreas, maxMenteesPerMonth), (3) Availability (day + time slots, timezone).
- **API:** `POST /api/mentorship/become-mentor` — Creates/updates MentorProfile + MentorAvailability; on create emits `MENTOR_PROFILE_CREATED`; redirects to `/mentorship/dashboard`.

### 3. Mentor discovery

- **Page:** `/mentorship` — Header “Find your mentor”; filter sidebar (transition, focus area, format, style, cross-border, city); mentor card grid (2 cols desktop); pagination.
- **API:** `GET /api/mentorship/mentors` — Query params: transition, focusArea, format, style, crossBorder, city, page, limit. Returns paginated mentor cards with **match score** from `lib/mentorship/match.ts` (transition, geography, focus area, style, experience). Pre-filtering uses `UserCareerContext` (e.g. isSwitchingField, targetGeography, primaryNeed).
- **Featured (public):** `GET /api/mentorship/mentors/featured` — Top 3 mentors by rating; used by `/features/mentorship`.

### 4. Mentor profile & request session

- **Page:** `/mentorship/[mentorId]` — Full mentor profile (avatar, name, role, transition badge, focus areas, formats, testimonial); “Request a session” CTA opens side panel.
- **Request panel:** Session goal (50–500 chars), preferred format (video/voice/async); submit → `POST /api/mentorship/sessions` (status REQUESTED); notifies mentor via `notifyMentorSessionRequested`.
- **API:** `GET /api/mentorship/mentors/[mentorId]` — Full profile + availability slots.

### 5. Session lifecycle & review

- **APIs:**
  - `POST /api/mentorship/sessions` — Create session (mentorProfileId, sessionGoal, sessionFormat, scheduledAt?).
  - `PATCH /api/mentorship/sessions/[sessionId]` — Actions: accept, decline, schedule, complete, cancel. On accept/decline notifies mentee; on complete notifies mentee to review and emits `MENTOR_SESSION_COMPLETED`, increments mentor totalSessions.
  - `POST /api/mentorship/sessions/[sessionId]/review` — Body: rating (1–5), feedback; updates session and recalculates mentor `averageRating`.
  - `GET /api/mentorship/sessions?role=mentee|mentor` — Current user’s sessions as mentee or mentor.

### 6. Notifications & signals

- **lib/notifications/create.ts:** `notifyMentorSessionRequested`, `notifyMentorSessionAccepted`, `notifyMentorSessionDeclined`, `notifyMentorSessionCompleted` (with linkUrl to dashboard or review).
- **Signals:** Emit `MENTOR_PROFILE_CREATED` when profile created; `MENTOR_SESSION_COMPLETED` when session completed (audience: mentee; metadata: mentorName, focusArea). `careerSignalFired` on MentorSession prevents duplicate emit.

### 7. Matching algorithm

- **lib/mentorship/match.ts:** `scoreMentorMatch(mentor, context)` — Transition match (40 pts), geography (20), focus area (20), style (10), experience relevance (10); max 100. Used to sort discovery results.

### 8. Mentorship dashboard

- **Page:** `/mentorship/dashboard` — If user has MentorProfile: two tabs “As a mentor” / “As a mentee”. Mentor tab: pending requests with Accept/Decline; upcoming and past sessions; capacity not shown in UI but model supports it. Mentee tab: sessions requested/scheduled/completed. If no MentorProfile: CTA “Become a mentor” + link to find mentors.

### 9. Nav & seeker dashboard

- **Discover dropdown:** “Mentorship” → `/mentorship`.
- **My Career dropdown:** “Mentor Dashboard” → `/mentorship/dashboard` (only when `GET /api/mentorship/me` returns `isMentor: true`; Navbar uses useSWR to conditionally add item).
- **Seeker dashboard:** `MentorMatchCard` shown when `hasMentorMatch` (from GET dashboard/seeker: `persona === EARLY_CAREER` or `careerContext.isSwitchingField`). Card fetches top 2 mentors via `/api/mentorship/mentors?limit=2` and links to discovery and mentor profile.

### 10. Feature page

- **/features/mentorship:** `MentorshipDemo` fetches `GET /api/mentorship/mentors/featured` and renders up to 3 real mentor cards (name, role, transition, rating); fallback “Be the first mentor” CTA when none.

### 11. Labels & constants

- **lib/mentorship/labels.ts:** Human-readable labels for MentorTransition, MentorStyle, SessionFormat, MentorFocusArea; used in become-mentor form and discovery filters.

## Key files

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma` (MentorProfile, MentorAvailability, MentorSession, enums; User.mentorProfile, menteeSessions; NotificationType/SignalType additions) |
| Match | `lib/mentorship/match.ts`, `lib/mentorship/labels.ts` |
| APIs | `app/api/mentorship/me`, `app/api/mentorship/mentors`, `app/api/mentorship/mentors/[mentorId]`, `app/api/mentorship/mentors/featured`, `app/api/mentorship/become-mentor`, `app/api/mentorship/sessions`, `app/api/mentorship/sessions/[sessionId]`, `app/api/mentorship/sessions/[sessionId]/review` |
| Notifications | `lib/notifications/create.ts` (MENTOR_SESSION_* helpers) |
| UI | `app/mentorship/page.tsx`, `app/mentorship/layout.tsx`, `app/mentorship/become-mentor/page.tsx`, `app/mentorship/[mentorId]/page.tsx`, `app/mentorship/dashboard/page.tsx` |
| Components | `components/mentorship/BecomeMentorClient.tsx`, `MentorshipDiscoveryClient.tsx`, `MentorProfileClient.tsx`, `MentorshipDashboardClient.tsx`; `components/dashboard/seeker/MentorMatchCard.tsx`; `components/features/MentorshipDemo.tsx` (updated) |
| Nav | `components/layout/Navbar.tsx` (DISCOVER + Mentorship; MY_CAREER + Mentor Dashboard when isMentor) |
| Dashboard data | `app/api/dashboard/seeker/route.ts` (hasMentorMatch from persona + careerContext.isSwitchingField) |

## Constraints respected

- Phase 9 Connection/Conversation/Message models unchanged; ConnectionType.MENTOR already existed.
- globals.css and tailwind.config.ts not modified.
- Existing notification and signal helpers extended only; no breaking changes.
- Mentors are opt-in users (MentorProfile); no separate user type.

## Exit checklist

- [x] Migration `add-mentorship-layer` applied — MentorProfile, MentorAvailability, MentorSession and enums created.
- [x] POST `/api/mentorship/become-mentor` creates MentorProfile + MentorAvailability; MENTOR_PROFILE_CREATED emitted.
- [x] `/mentorship` loads with filter sidebar and mentor card grid; match score used for sorting.
- [x] Pre-filtering from UserCareerContext (isSwitchingField, targetGeography, primaryNeed) reflected in match score.
- [x] `/mentorship/[mentorId]` loads full mentor profile; request-session side panel submits to POST sessions.
- [x] Session status transitions: REQUESTED → ACCEPTED/DECLINED; accept/schedule/complete/cancel via PATCH; Accept/Decline on dashboard.
- [x] Mentor notified on session request; mentee notified on accept/decline/complete.
- [x] POST review updates menteeRating/menteeFeedback and mentor averageRating.
- [x] `/mentorship/dashboard` shows mentor and mentee tabs; MentorMatchCard on seeker dashboard when hasMentorMatch.
- [x] Discover nav includes Mentorship; My Career includes Mentor Dashboard when isMentor.
- [x] `/features/mentorship` uses GET `/api/mentorship/mentors/featured` for top 3 mentors.
