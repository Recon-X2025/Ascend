# M-2: Ascend Mentorship — Mentor Profile & Transition Record

## Overview

M-2 builds the mentor's **structured profile and transition record** — the verified career story that powers matching. It is not a bio page; it is the input for mentor–mentee matching. Depends on M-1 (Identity & Verification); mentor is not discoverable until verified, and `isPublic` is set only when admin approves and a full M-2 profile exists.

**Core principle:** Structured, validated data. Statements and key factors have character limits; capacity and availability are platform-enforced.

---

## Deliverables

| Area | Deliverable |
|------|-------------|
| **Schema** | Enums: `MentorCompanyType`, `TransitionBadge`, `EngagementLength`, `SessionFrequency`, `M2FocusArea`, `GeographyScope`, `DayOfWeek`. Extended `MentorProfile` (transition record, key factors, statements, capacity, focus, geography). `AvailabilityWindow` model. Migration: `m2_mentor_profile`. |
| **Lib** | `lib/mentorship/profile.ts` — Zod create/update and availability schemas (statements 50–400 chars, key factors 20–200, geography refinement). `lib/mentorship/m2-labels.ts` — human-readable labels for enums. |
| **APIs** | GET/POST/PATCH `/api/mentorship/profile` (own profile). PUT `/api/mentorship/profile/availability`. GET `/api/mentorship/profile/[userId]` (public, 404 if not public/verified). GET `/api/mentorship/profile/complete` (completeness for "Submit for discovery" gate). |
| **Become-a-mentor** | `/mentorship/become-a-mentor` — 6-step flow: Transition, Key Factors, Statement, Availability & Capacity, Focus & Geography, Review & Submit. Step indicator; POST on create, PATCH on update; submit sets `isActive: false`, `isPublic: false` and sends "profile received" email; redirect to `/dashboard/mentor`. |
| **Mentor dashboard** | `/dashboard/mentor` — Verification status widget; profile completeness widget (calls `/complete`); mentor profile card; capacity overview; upcoming sessions placeholder. Gate: verified users see full dashboard; unverified see verification widget only. |
| **Public profile** | `/mentors/[userId]` — Only if `isPublic` and `verificationStatus === VERIFIED`. Transition record, key factors, statements, focus areas, geography, availability summary, capacity. No "Apply" CTA yet (M-3). |
| **Admin** | On verification approve: if mentor has M-2 profile, set `MentorProfile.isPublic = true` and send "You're verified — profile is live" email. Verification queue: "View mentor profile" link to `/mentors/[userId]`. Emails for approved/rejected/more-info. |
| **Email** | `lib/email/mentor.ts`: profile received, approved, more-info, rejected. `lib/email/templates/review-rejected.ts`: company/interview/salary review rejected. |
| **Nav** | Seeker "My Career" dropdown: "Become a Mentor" → `/mentorship/become-a-mentor` or "Mentor Dashboard" → `/dashboard/mentor` based on whether user has MentorProfile. |

---

## Key Files

| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | M-2 enums; MentorProfile extension; AvailabilityWindow. |
| `prisma/migrations/*_m2_mentor_profile/` | Migration. |
| `lib/mentorship/profile.ts` | mentorProfileBaseSchema, mentorProfileCreateSchema (with refinement), mentorProfileUpdateSchema (partial), availabilityWindowsPutSchema. |
| `lib/mentorship/m2-labels.ts` | Labels for company type, focus area, engagement, frequency, geography, day. |
| `app/api/mentorship/profile/route.ts` | GET/POST/PATCH own profile; validation; no `isPublic`/`transitionBadge` in PATCH. |
| `app/api/mentorship/profile/availability/route.ts` | PUT replace availability windows. |
| `app/api/mentorship/profile/complete/route.ts` | GET completeness (missingFields). |
| `app/api/mentorship/profile/[userId]/route.ts` | GET public profile; 404 if not public or not verified. |
| `app/api/admin/mentorship/verification/[id]/decide/route.ts` | On APPROVED: set isPublic when has M-2 profile; Resend emails. |
| `app/mentorship/become-a-mentor/page.tsx` | Session guard; BecomeAMentorFlowClient. |
| `components/mentorship/become-a-mentor/BecomeAMentorFlowClient.tsx` | 6-step form; StepIndicator; POST/PATCH on submit. |
| `app/dashboard/mentor/page.tsx` | Redirect if no profile; MentorDashboardClient. |
| `components/mentorship/mentor-dashboard/*` | VerificationStatusWidget, ProfileCompletenessWidget, MentorProfileCard, CapacityOverview, UpcomingSessionsPlaceholder. |
| `app/mentors/[userId]/page.tsx` | Public mentor profile (guard: public + verified). |
| `components/mentorship/PublicMentorProfile.tsx` | Layout: transition, factors, statements, focus, geography, availability, capacity. |
| `lib/email/mentor.ts` | sendMentorProfileReceivedEmail, sendMentorApprovedEmail, sendMentorMoreInfoEmail, sendMentorRejectedEmail. |

---

## Exit Checklist

- [x] Migration runs: `npx prisma migrate dev --name m2_mentor_profile`
- [x] Mentor can complete 6-step profile form; profile stored with all fields and availability windows
- [x] GET `/api/mentorship/profile/complete` returns `complete` and `missingFields`
- [x] Mentor dashboard shows correct widget by verification status; profile card and capacity after profile submitted
- [x] Public `/mentors/[userId]` renders only when `isPublic` and verified; 404 otherwise
- [x] Admin approval sets `isPublic = true` only when mentor has M-2 profile; sends Resend email
- [x] `TransitionBadge` and `isPublic` cannot be set by mentor via API (validated in route)
- [x] Statement fields 50–400 chars; key factors 20–200 chars; character counters in UI
- [x] Seeker nav: "Become a Mentor" / "Mentor Dashboard" entry point
- [x] `npm run build` passes

---

## Constraints (Summary)

- No direct Prisma in client components; all data via API routes.
- `isPublic` only set to `true` by admin on verification approve when M-2 profile exists.
- `TransitionBadge.PLATFORM_VERIFIED` only set by admin.
- Zod: create schema uses refinement; update schema is base.partial() (no refinement) to avoid `.partial()` on refined schema.
- At least one focus area, engagement preference, and availability window required.

---

*Next: M-3 (Mentee Application Layer) after M-2 is confirmed green.*
