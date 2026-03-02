# Phase 13: Admin Panel (Lite) — Build Summary

## Overview

Phase 13 delivers the minimum admin controls needed to run the platform safely before the seeker pilot: user management (ban/unban, session invalidation), company verification and suspension, a content moderation queue for pending company reviews, feature flags (with toggles and audit), and a read-only audit log. All admin actions are logged; all admin routes require `PLATFORM_ADMIN`; no Prisma in client components.

## Deliverables

### 1. Schema & migration

- **prisma/schema.prisma**
  - **AuditLog:** `id`, `adminId`, `action`, `targetType`, `targetId`, `targetLabel`, `metadata`, `createdAt`; relation to `User`.
  - **FeatureFlag:** `id`, `key` (unique), `enabled`, `description`, `updatedAt`, `updatedById` → User.
  - **User:** `bannedAt`, `banReason`.
  - **Company:** `suspendedAt`, `suspensionReason`.
  - **CompanyReview:** `rejectionReason` (for reject reason).
- **Migration:** `phase-13-admin-lite` (e.g. `20260227182854_phase_13_admin_lite`).

### 2. Helpers

- **lib/admin/audit.ts:** `logAdminAction({ adminId, action, targetType, targetId, targetLabel?, metadata? })`.
- **lib/feature-flags.ts:** `isEnabled(key)`, `getFlags(keys)` (server-side).

### 3. Auth & middleware

- **NextAuth session callback:** If `user.bannedAt` is set, return session with no user (banned users are effectively signed out on next request).
- **middleware.ts:** All `/dashboard/admin/*` routes require `PLATFORM_ADMIN`; non-admins are redirected to their role dashboard.

### 4. Admin layout & nav

- **app/dashboard/admin/layout.tsx:** Server-side `PLATFORM_ADMIN` check; sidebar + main content.
- **components/dashboard/admin/AdminNav.tsx:** Sidebar with Overview, Users, Companies, Moderation (badge = pending review count from `/api/admin/moderation/stats`), Feature Flags, Audit Log.

### 5. User management

- **GET /api/admin/users:** Paginated (cursor, 50), query: `search`, `role`, `status` (ACTIVE|BANNED). Returns `users`, `nextCursor`, `hasMore`; each user includes `profileComplete` from JobSeekerProfile.
- **PATCH /api/admin/users/[id]/ban:** Body `{ reason }` (min 10 chars). Sets `bannedAt`, `banReason`; deletes all sessions for user; `logAdminAction(USER_BANNED)`.
- **PATCH /api/admin/users/[id]/unban:** Clears ban; `logAdminAction(USER_UNBANNED)`.
- **GET /api/admin/users/[id]:** Full user + profile snippet, last 5 applications, last 5 audit entries where targetId = userId.
- **UI:** `app/dashboard/admin/users/page.tsx` + `AdminUsersClient`: search (debounced), role/status filters, table with View/Ban/Unban; ban modal (reason required); unban AlertDialog; link to user detail.
- **app/dashboard/admin/users/[id]/page.tsx:** Server-rendered user detail (profile, recent applications, recent activity).

### 6. Company management

- **GET /api/admin/companies:** Paginated, query: `search`, `verified`, `suspended`, `cursor`.
- **PATCH /api/admin/companies/[id]/verify** / **unverify:** Toggle `Company.verified`; audit logged.
- **PATCH /api/admin/companies/[id]/suspend:** Body `{ reason }`. Sets `suspendedAt`, `suspensionReason`; sets all ACTIVE jobs for company to PAUSED; audit logged.
- **PATCH /api/admin/companies/[id]/unsuspend:** Clears suspension; audit logged (jobs not auto-restored).
- **UI:** `AdminCompaniesClient`: search, filters (All/Verified/Unverified/Suspended), table; verify/unverify AlertDialog; suspend modal (reason); company name links to `/companies/[slug]` in new tab.

### 7. Moderation queue

- **GET /api/admin/moderation:** `filter=PENDING|ALL`, cursor, 20 per page. Returns `CompanyReview` with status PENDING (or all); includes company name/slug, author (Anonymous or name), content (pros, cons, advice).
- **GET /api/admin/moderation/stats:** `{ pending, approvedToday, rejectedToday }`.
- **PATCH /api/admin/moderation/reviews/[id]/approve:** Sets status APPROVED; audit logged.
- **PATCH /api/admin/moderation/reviews/[id]/reject:** Body `{ reason }` (min 5 chars). Sets status REJECTED and `rejectionReason`; audit logged.
- **UI:** `AdminModerationClient`: stats bar; Pending/All tabs; review cards with Approve / Reject (reject reason textarea); empty state when no pending reviews.

### 8. Feature flags

- **prisma/seed.ts:** Seeds 7 flags: `fit_score_enabled`, `resume_optimiser_enabled`, `job_alerts_enabled`, `notifications_enabled`, `profile_views_enabled`, `easy_apply_enabled`, `seeker_pilot_open` (false).
- **GET /api/admin/feature-flags:** All flags with `updatedByName`.
- **PATCH /api/admin/feature-flags/[key]:** Body `{ enabled }`; sets `updatedById`; `logAdminAction(FEATURE_FLAG_TOGGLED)` with metadata `{ key, previousValue, newValue }`.
- **UI:** `AdminFeatureFlagsClient`: table with key (monospace), description, Switch, last updated; warning banner; dangerous key (`seeker_pilot_open`) with amber icon.

### 9. Audit log

- **GET /api/admin/audit:** Paginated, query: `adminId`, `action`, `targetType`, `cursor`. Returns entries with admin name/email, action, target, metadata.
- **UI:** `AdminAuditClient`: filters; table (timestamp, admin, action badge, target); metadata expandable JSON.

### 10. Feature flag wiring (server-enforced)

- **fit_score_enabled:** `GET /api/jobs/[id]/fit-score` → 503 if disabled.
- **resume_optimiser_enabled:** `POST /api/resume/optimise` → 503 if disabled.
- **job_alerts_enabled:** `POST /api/alerts` → 503 if disabled.
- **easy_apply_enabled:** `POST /api/jobs/[id]/apply` → 503 if disabled.
- **seeker_pilot_open:** `POST /api/auth/register` → 403 “Ascend is currently in private beta. Check back soon.” if disabled.

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | AuditLog, FeatureFlag; User.bannedAt/banReason; Company.suspendedAt/suspensionReason; CompanyReview.rejectionReason |
| `prisma/seed.ts` | Feature flag seed (7 flags) |
| `lib/admin/audit.ts` | logAdminAction() |
| `lib/feature-flags.ts` | isEnabled(), getFlags() |
| `middleware.ts` | PLATFORM_ADMIN guard for /dashboard/admin/* |
| `app/dashboard/admin/layout.tsx` | Admin layout + sidebar |
| `components/dashboard/admin/AdminNav.tsx` | Sidebar nav + moderation badge |
| `app/dashboard/admin/users/page.tsx` | User list + ban/unban |
| `app/dashboard/admin/users/[id]/page.tsx` | User detail |
| `app/dashboard/admin/companies/page.tsx` | Company list + verify/suspend |
| `app/dashboard/admin/moderation/page.tsx` | Moderation queue |
| `app/dashboard/admin/feature-flags/page.tsx` | Feature flag toggles |
| `app/dashboard/admin/audit/page.tsx` | Audit log viewer |
| `app/api/admin/users/route.ts` | GET users |
| `app/api/admin/users/[id]/ban|unban/route.ts` | Ban/unban |
| `app/api/admin/companies/route.ts` | GET companies |
| `app/api/admin/companies/[id]/verify|unverify|suspend|unsuspend/route.ts` | Company actions |
| `app/api/admin/moderation/route.ts` | GET queue |
| `app/api/admin/moderation/stats/route.ts` | GET stats |
| `app/api/admin/moderation/reviews/[id]/approve|reject/route.ts` | Approve/reject |
| `app/api/admin/feature-flags/route.ts` | GET flags |
| `app/api/admin/feature-flags/[key]/route.ts` | PATCH flag |
| `app/api/admin/audit/route.ts` | GET audit |

## Exit Checklist

- [ ] Migration `phase-13-admin-lite` applied.
- [ ] Feature flags seeded via `npx prisma db seed`.
- [ ] Middleware blocks non-PLATFORM_ADMIN from all `/dashboard/admin/*` routes.
- [ ] Admin layout with 6-item sidebar (Overview, Users, Companies, Moderation, Feature Flags, Audit Log); Moderation shows pending count badge.
- [ ] `logAdminAction()` used for every destructive/state-changing admin action (Tasks 3–6).
- [ ] User management: list, search, filter, ban (reason + session invalidation), unban; user detail page; NextAuth session callback invalidates banned users.
- [ ] Company management: list, search, verify/unverify, suspend (reason + jobs paused), unsuspend.
- [ ] Moderation: PENDING queue; approve; reject with reason; stats bar (pending, approved today, rejected today).
- [ ] Feature flags: list, toggle; changes logged to audit; dangerous flag (`seeker_pilot_open`) visually highlighted.
- [ ] `seeker_pilot_open` wired into registration (403 when disabled).
- [ ] `fit_score_enabled`, `resume_optimiser_enabled`, `job_alerts_enabled`, `easy_apply_enabled` wired into respective APIs.
- [ ] Audit log page: paginated, filterable, read-only.
- [ ] No admin UI uses Prisma directly; all admin API routes return 403 when caller is not PLATFORM_ADMIN.

## Deferred (full pass post-pilot)

- User impersonation; user reports; email template management; rate limit config; DAU/MAU/revenue analytics; job flagging in moderation; platform-wide announcement banner.

## After This Phase

Seeker pilot is ready to open. Set `seeker_pilot_open` to `true` in Feature Flags when ready.
