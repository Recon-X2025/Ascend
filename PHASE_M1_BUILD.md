# M-1: Ascend Mentorship — Identity & Verification Infrastructure

## Overview

M-1 extends the Phase 9B mentorship v1 build with a **verification layer**. Mentors are not discoverable until independently verified. Verification is a permanent, immutable record of what was verified, when, and by whom. No auto-approval; every application is reviewed manually by a PLATFORM_ADMIN.

**Core principle:** Zero Trust. A mentor is not trusted until verified.

---

## Deliverables

| Area | Deliverable |
|------|-------------|
| **Schema** | Enums: `VerificationStatus`, `VerificationDocumentType`, `VerificationDecision`. Models: `MentorVerification`, `VerificationDocument`, `VerificationAuditLog`. `MentorProfile`: `verificationStatus`, `isDiscoverable`, `verification`. Migration: `m1-mentor-verification`. |
| **Lib** | `lib/mentorship/verification-codes.ts` — `VERIFICATION_REASON_CODES`, `isValidReasonCode`. `lib/mentorship/verification-helpers.ts` — `getMentorProfileOrThrow()`. |
| **APIs (mentor)** | POST `/api/mentorship/verification/upload` (multipart, 5MB, PDF/JPG/PNG). POST `/api/mentorship/verification/submit`. PATCH `/api/mentorship/verification/linkedin`. GET `/api/mentorship/verification/status`. |
| **APIs (admin)** | GET `/api/admin/mentorship/verification?status=...` (paginated). POST `/api/admin/mentorship/verification/[id]/decide` (decision, reasonCode, note). |
| **Cron** | GET `/api/cron/mentor-reverification` (CRON_SECRET). Sets REVERIFICATION_REQUIRED when `nextReviewDue <= now()`. |
| **Role change** | Mentor profile update (e.g. `currentRole` / `currentCompany` change) in `app/api/mentorship/become-mentor/route.ts` sets `verificationStatus = REVERIFICATION_REQUIRED`, `isDiscoverable = false`. |
| **Discovery** | GET `/api/mentorship/mentors`: `where.isDiscoverable = true`, `userId: { not: session.user.id }` (Bug 17 fix). |
| **Mentor UI** | `/mentorship/verify` — status banner, document upload (Gov ID, Employment), LinkedIn URL, submit, previous decisions timeline. Components: `VerificationStatusBanner`, `DocumentUploadZone`. |
| **Admin UI** | `/dashboard/admin/mentorship/verification` — tabs Pending, Needs Info, Verified, Rejected; list with SLA (green &lt;24h, amber 24–36h, red &gt;36h); sheet with mentor details, document links, audit log, decision form. Admin nav: Mentorship → Mentor Verification. |
| **Dashboard** | `MentorshipDashboardClient`: verification status card on mentor tab (badge, CTA to `/mentorship/verify` or “Valid until” / “Under review”). |
| **Notifications** | New types: MENTOR_VERIFICATION_SUBMITTED (to admins), MENTOR_VERIFICATION_APPROVED, MENTOR_VERIFICATION_REJECTED, MENTOR_VERIFICATION_MORE_INFO, MENTOR_REVERIFICATION_REQUIRED. |

---

## Key Files

| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | Enums and models; MentorProfile extension; User.verificationAuditLogsAdmin. |
| `prisma/migrations/*_m1_mentor_verification/` | Migration. |
| `lib/mentorship/verification-codes.ts` | Reason codes (mandatory for admin decisions). |
| `lib/mentorship/verification-helpers.ts` | getMentorProfileOrThrow. |
| `app/api/mentorship/verification/upload/route.ts` | Document upload; creates MentorVerification if first upload. |
| `app/api/mentorship/verification/submit/route.ts` | Submit for review; notifies admins. |
| `app/api/mentorship/verification/linkedin/route.ts` | PATCH LinkedIn URL (validated). |
| `app/api/mentorship/verification/status/route.ts` | GET status, documents (no fileUrls), auditLog (human-readable reason). |
| `app/api/admin/mentorship/verification/route.ts` | GET list (with signed fileUrls for admin). |
| `app/api/admin/mentorship/verification/[id]/decide/route.ts` | POST decision; logAdminAction; update status & isDiscoverable; notify mentor. |
| `app/api/cron/mentor-reverification/route.ts` | Daily: set REVERIFICATION_REQUIRED when nextReviewDue passed. |
| `app/api/mentorship/mentors/route.ts` | Discovery: isDiscoverable: true, exclude self. |
| `app/api/mentorship/become-mentor/route.ts` | On role/company change: REVERIFICATION_REQUIRED, isDiscoverable = false. |
| `app/mentorship/verify/page.tsx` | Server guard (has MentorProfile); renders VerifyClient. |
| `app/mentorship/verify/VerifyClient.tsx` | Status, upload zones, LinkedIn, submit, audit timeline. |
| `app/dashboard/admin/mentorship/verification/page.tsx` | Tabs + list + VerificationReviewPanel. |
| `components/mentorship/VerificationStatusBanner.tsx` | Status banner (UNVERIFIED / PENDING / VERIFIED / REVERIFICATION_REQUIRED). |
| `components/mentorship/DocumentUploadZone.tsx` | File upload (Gov ID / Employment). |
| `components/mentorship/VerificationReviewPanel.tsx` | Admin sheet: mentor details, documents, audit, decision form. |
| `components/mentorship/MentorshipDashboardClient.tsx` | Verification status card on mentor tab. |
| `components/dashboard/admin/AdminNav.tsx` | Mentorship section + Mentor Verification link. |
| `components/ui/textarea.tsx` | New (used in VerificationReviewPanel). |

---

## Exit Checklist

- [x] Migration runs: `npx prisma migrate dev --name m1-mentor-verification`
- [x] `MentorProfile.isDiscoverable` defaults to `false`
- [x] Document upload: PDF/JPG/PNG, max 5MB; rejects other types
- [x] Submit API returns 400 with specific message if pre-conditions not met
- [x] LinkedIn URL validation: `https://(www.)linkedin.com/in/[username]`, max 200 chars
- [x] Admin decide API rejects missing or invalid reasonCode
- [x] APPROVED sets `isDiscoverable = true`; REJECTED sets `isDiscoverable = false`
- [x] Every admin decision logged to VerificationAuditLog and AuditLog (logAdminAction)
- [x] Discovery API only returns `isDiscoverable: true` mentors; self excluded (Bug 17)
- [x] Cron sets `isDiscoverable = false` when `nextReviewDue` passes
- [x] Role/company change on MentorProfile triggers REVERIFICATION_REQUIRED and isDiscoverable = false
- [x] Admin verification queue under Mentorship in sidebar; SLA colours (green / amber / red)
- [x] Document fileUrls not exposed in public-facing APIs (only in admin GET)
- [x] `npm run build` passes

---

## Constraints (Summary)

- No mentor discoverable until `isDiscoverable = true` (set only on admin APPROVED).
- All admin decisions immutable (VerificationAuditLog).
- reasonCode required and must be in VERIFICATION_REASON_CODES.
- Document fileUrls only in admin APIs.
- No auto-approval.
- Re-verification hides mentor immediately when nextReviewDue passes.
