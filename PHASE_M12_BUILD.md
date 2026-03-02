# M-12 Mentorship Circles (Group Cohorts)

## Summary

Implements Mentorship Circles for Ascend. One circle = one mentor capacity slot. Individual contracts + escrow per member. Price ceiling 60% of 1:1 DEEP fee.

## Exit Checklist

- [x] Prisma migration: `m12_mentorship_circles` — MentorshipCircle, CircleMember, CircleSession, CircleOneOnOneSlot, CirclePeerCheckIn, CircleStatus, CircleMemberStatus. ContractType extended with CIRCLE
- [x] `CIRCLE_CONFIG` constants (in lib/mentorship/circles.ts or similar)
- [x] `lib/mentorship/circles.ts` — createCircle, applyToCircle, acceptCircleApplication, lockCircle, initialiseCircleEngagement, createCircleSession
- [x] Group Steno: `buildCircleSpeakerMap()` in `lib/sessions/steno.ts`. CircleStenoExtraction schema
- [x] Daily cron: lock circles at start date (engagement-reminders)
- [x] POST /api/mentorship/circles, GET /api/mentorship/circles, GET /api/mentorship/circles/[circleId]
- [x] POST /api/mentorship/circles/[circleId]/apply
- [x] POST /api/mentorship/circles/[circleId]/members/[memberId]/accept, decline
- [x] GET /api/mentorship/circles/[circleId]/members
- [x] POST /api/mentorship/circles/[circleId]/peer-checkin, GET peer-checkins
- [x] GET /api/admin/mentorship/circles
- [x] /mentorship/circles, /mentorship/circles/[circleId], /mentorship/circles/create, /mentorship/circles/[circleId]/manage
- [x] Mentor dashboard "My Circles", Mentee dashboard "My Circle" card
- [x] Peer check-in UI in cohort tab
- [x] Outcome events: M12_CIRCLE_CREATED, M12_CIRCLE_APPLICATION_SUBMITTED, M12_PEER_CHECK_IN
- [x] `tsc --noEmit` passes
- [ ] `npm run build` — may fail with pre-existing `/_document` error (see PROJECT_PLAN §3.1.1)

## Prisma Schema

- **MentorshipCircle**: mentorId, mentorProfileId, title, description, maxMembers, feePaise, startDate, status (DRAFT|OPEN|LOCKED|ACTIVE|COMPLETED|CANCELLED), leadTimeDays
- **CircleMember**: circleId, menteeId, status (APPLIED|ACCEPTED|CONFIRMED|DECLINED|WITHDRAWN), applicationNote, contract (1:1 via contract.circleMemberId)
- **CircleSession**: circleId, sessionNumber, scheduledAt, sessionRoomId, status
- **CircleOneOnOneSlot**: circleMemberId, sessionNumber, scheduledAt, durationMins
- **CirclePeerCheckIn**: circleId, fromMemberId, toMemberId, content
- **MentorshipContract**: contractType (STANDARD|CIRCLE), circleMemberId optional
- **EngagementSession**: circleSessionId optional
- **OutcomeEventType**: M12_PEER_CHECK_IN, M12_CIRCLE_CREATED, M12_CIRCLE_APPLICATION_SUBMITTED

## Lib

- `lib/mentorship/circles.ts`: createCircle, openCircle, applyToCircle, acceptCircleApplication, declineCircleApplication, withdrawCircleApplication, lockCircle, initialiseCircleEngagement, createCircleSessionRoom, createPeerCheckIn
- `lib/mentorship/contract.ts`: createContractForCircle, generateCircleContractContent; verifyOTPAndSign sets CircleMember CONFIRMED for circle contracts
- `lib/sessions/room.ts`: createSessionRoomForCircle, getOrCreateCircleSessionRoom
- `lib/sessions/steno.ts`: buildCircleSpeakerMap, CircleStenoExtraction

## APIs

- `POST/GET /api/mentorship/circles` — create, list
- `GET /api/mentorship/circles/[circleId]` — detail
- `POST /api/mentorship/circles/[circleId]/apply` — mentee apply
- `POST /api/mentorship/circles/[circleId]/members/[memberId]/accept`, decline
- `POST /api/mentorship/circles/[circleId]/open`, lock, initialise
- `GET/POST /api/mentorship/circles/[circleId]/members`
- `GET/POST /api/mentorship/circles/[circleId]/peer-checkin`
- `GET /api/admin/mentorship/circles` — PLATFORM_ADMIN

## Cron

- `engagement-reminders`: lock circles where startDate <= now and status OPEN

## UI

- `/mentorship/circles` — public listing
- `/mentorship/circles/create` — mentor create form (ceiling shown)
- `/mentorship/circles/[circleId]` — detail + apply
- `/mentorship/circles/[circleId]/manage` — mentor management dashboard
- Mentor dashboard: "My Circles" section
- Mentee dashboard: "My Circle" card, peer check-in badge

## Migration

`prisma/migrations/20260313000000_m12_mentorship_circles/migration.sql`

Migration includes `CREATE TABLE IF NOT EXISTS "SessionRoom"` for dev databases where M-7 was not fully applied.

## File List

- `prisma/schema.prisma` — MentorshipCircle, CircleMember, CircleSession, CircleOneOnOneSlot, CirclePeerCheckIn
- `prisma/migrations/20260313000000_m12_mentorship_circles/migration.sql`
- `lib/mentorship/circles.ts`
- `lib/sessions/steno.ts` — buildCircleSpeakerMap, CircleStenoExtraction
- `app/api/mentorship/circles/` — route handlers
- `app/mentorship/circles/` — pages
