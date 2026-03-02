# Ascend — Bug Tracker & Fix List
**Last updated:** 2026-03-01 — 11:00 AM
**Status:** Active testing session — pre-pilot | 19 open bugs | Pilot gate updated: M-1→M-17 all complete before pilot opens

---

## Open Bugs

### UI / Visual

| # | Bug | Location | Priority |
|---|-----|----------|----------|
| 1 | Notice period dropdown — transparent background on profile edit | Profile edit page | High |
| 4 | Skills dialog — transparent background | Profile edit → Skills section | High |
| 5 | Projects dialog — transparent background | Profile edit → Projects section | High |
| 6 | Skills on public profile — rendering as plain inline text with double spaces, needs pill/chip styling | `/profile/[slug]` | Medium |
| 7 | Profile photo cropped — avatar not displaying correctly on public profile, needs `object-cover` + proper aspect ratio on circular container | `/profile/[slug]` | High |
| 8 | Education section — no visual hierarchy between institution name and degree | `/profile/[slug]` | Low |
| 10 | Logo click when logged in → goes to public marketing homepage instead of `/dashboard`. Fix: logo should be session-aware — logged in → `/dashboard`, logged out → `/` | `Navbar.tsx` | High |

---

### API / Backend

| # | Bug | Location | Priority |
|---|-----|----------|----------|
| 2 | `/api/profile/me/certifications` — 400 Bad Request firing repeatedly on profile edit page load | `app/api/profile/me/certifications/route.ts` | High |
| 3 | `DialogContent` missing `Description` or `aria-describedby` — ShadCN accessibility warning | `CertificationsSection.tsx` line 36 | Medium |

---

### Feature / Navigation

| # | Bug | Location | Priority |
|---|-----|----------|----------|
| 12 | Resume Builder — "Start New" button not responding to click | `/resume/build` — Resume Versions panel | High |
| 13 | Resume Builder Step 3 (AI Content) — stuck on "Generating AI content for your experience…", skeleton loaders never resolve. Queue job completes (`GET /api/queues/jobs/1`) but UI state never updates | `/resume/build` — `AIContentStep.tsx` line 92 | Critical |
| 14 | `Select` component switching from uncontrolled to controlled — industry select has no default value | `/resume/build` — `CareerIntentStep.tsx` line 44 | Medium |
| 15 | Fit Score — 404 Page not found. Nav links to `/fit-score` but route doesn't exist or is at a different path | `My Career` nav → Fit Score | High |
| 16 | Network page — no way to add connections. Empty state with no CTA to find or add people. Discovery/search flow not wired into the page | `/network` — My Network tab | High |

---

## Backlog (Not Bugs — Feature Gaps)

| # | Item | Phase |
|---|------|-------|
| 9 | Resume upload → auto-populate profile fields (name, headline, experience, skills, location) | Phase 2A |
| 11 | Logo → `/` when logged in, with `/` rendering differently based on session (LinkedIn pattern). Full implementation post-pilot — for now logo → `/dashboard` when logged in | Post-pilot |

---

## Fix Notes for Cursor

### Bug 10 — Logo session-aware routing
**File:** `components/layout/Navbar.tsx`
**Fix:**
```ts
// Use session to determine logo destination
// If session exists → href="/dashboard"
// If no session → href="/"
```

### Bugs 1, 4, 5 — Transparent dropdown backgrounds
**Rule:** All inline popover-style dropdowns must have solid `var(--surface)` background.
**Exception:** Right side panel dialogs (Projects, Skills, Certifications, Awards etc.) — keep exactly as is.
**Files:** Any component using ShadCN `SelectContent` or `DropdownMenuContent`
**Fix:**
```css
/* In globals.css */
[data-radix-select-content],
[data-radix-dropdown-menu-content],
[data-radix-popper-content-wrapper] {
  background-color: var(--surface) !important;
}
```
Or add `className="bg-[var(--surface)]"` directly to each `SelectContent` and `DropdownMenuContent` component.

### Bug 6 — Skills pill styling
**File:** Component rendering skills on public profile
**Fix:**
```tsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--surface-2)] border border-[var(--border)] text-ink-2">
  {skill.name}
</span>
```

### Bug 7 — Profile photo cropping
**File:** Profile avatar component on public profile
**Fix:**
```tsx
<div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white">
  <img src={photo} className="w-full h-full object-cover object-center" />
</div>
```

### Bug 13 — AI Content step stuck
**Likely cause:** OpenAI API key not set in `.env.local`, or queue job result not being polled correctly.
**Check:** Is `OPENAI_API_KEY` set in `.env.local`?
**File:** `AIContentStep.tsx` — check polling logic after queue job completes

### Bug 15 — Fit Score 404
**Check:** Search codebase for where Fit Score page lives — likely `/dashboard/fit-score` or `/jobs/fit-score`
**Fix:** Either create `app/fit-score/page.tsx` as a redirect, or update the nav link in `Navbar.tsx` to point to the correct path

### Bug 16 — Network discovery missing
**File:** `app/network/page.tsx`
**Fix:** Add a "Find people" CTA that links to a people search/discovery page. Phase 9 built the data model but the entry point UI is missing.

---

### Bug 17 — Logged-in user appears in own mentor discovery results
**Status:** 🔴 Open
**Priority:** High
**Found during:** Phase 9B testing — `/mentorship` discovery page
**File:** `app/api/mentorship/mentors/route.ts`
**Description:** The mentor discovery page shows the currently logged-in user's own mentor profile in the results. A user should never see themselves as a match in their own discovery.
**Root cause:** The Prisma query fetching mentor profiles is missing a filter to exclude the requesting user's own userId.
**Fix:**
```ts
where: {
  userId: { not: session.user.id }, // exclude logged-in user
  isActive: true,
  // ... rest of existing filters
}
```
**Notes:** The rest of the discovery page looks correct — filters render, mentor card layout is clean, "Request session →" CTA present. This is the only logic error on the page.

---

### Bug 18 — Career updates widget shows generic label
**Status:** 🔴 Open
**Priority:** Low
**Found during:** Seeker dashboard testing — `/dashboard/seeker`
**File:** `components/dashboard/seeker` — career signal feed rendering
**Description:** The Career updates widget displays "Career update" as the label for all signal types with no human-readable description of what the event was. A signal fired when the user became a mentor shows identically to any other career signal.
**Fix:** Map `CareerSignal.type` enum values to human-readable labels in the signal feed renderer. Examples:
- `MENTOR_PROFILE_CREATED` → "You became a mentor"
- `JOB_APPLICATION_SUBMITTED` → "Applied to [role] at [company]"
- `CONNECTION_MADE` → "Connected with [name]"
- `PROFILE_UPDATED` → "Updated your profile"
**Notes:** Low priority — cosmetic only. Signal data is correct, only the display label is generic.

---

### Bug 19 — Audit log scope is admin-actions only — does not meet Zero Trust
**Status:** 🔴 Open
**Priority:** Critical (pre-public-launch blocker — acceptable for closed pilot)
**Found during:** Admin panel testing — `/dashboard/admin/audit`
**Phase dependency:** Phase 17 — Trust, Safety & Compliance
**Description:** The current audit log only captures admin panel actions (ban user, verify company, toggle feature flag, approve review). This is compliance logging, not Zero Trust. A Zero Trust audit trail must log every significant action by any actor on the platform.

**What is currently missing:**

*Authentication events:*
- Every login (user, timestamp, IP, device/user-agent)
- Every logout
- Every failed login attempt
- Every session created and expired
- Every role change — including direct DB changes via Prisma Studio (currently completely invisible)

*Data access events:*
- Every time a recruiter views a candidate profile
- Every time a user views another user's profile
- Every sensitive data access (salary data, contact info, resume download)

*User state change events:*
- Every application submitted, withdrawn, status changed
- Every profile field updated
- Every mentor session requested, accepted, completed, disputed
- Every document uploaded or deleted
- Every payment initiated or released

*Platform integrity events:*
- Every feature flag evaluation for gated features
- Every API call touching PII
- Every export or data download request
- Every admin action (already exists — keep)

**The Prisma Studio gap:** Role changes, record deletions, and data modifications made directly in the database bypass the application entirely and leave zero trace in the audit log. This is a real vulnerability — anyone with DB access can elevate privileges or delete records invisibly.

**Fix scope:** This is a Phase 17 build item, not a quick fix. Requires:
1. `AuditEvent` model extension — actor, action, target, metadata, IP, timestamp, immutable
2. Middleware layer to capture auth events (NextAuth callbacks)
3. Service layer hooks on all state-changing operations
4. DB-level triggers or Prisma middleware for direct-access detection (post-pilot)
5. Audit log UI extension — filter by actor type, action category, date range

**For pilot:** Current admin-only audit log is acceptable for a closed, small-group pilot where all participants are known. Must be resolved before any public launch.

**Immediate mitigation:** Restrict Prisma Studio access — do not leave it running in production. Direct DB access should require VPN + MFA post-pilot.

---

## Resolved

| # | Bug | Fixed |
|---|-----|-------|
| - | Greeting shows "there" instead of first name | ✅ |
| - | 👋 emoji in dashboard greeting | ✅ |
| - | Dashboard subheading not persona-aware | ✅ |
| - | "How are you using Ascend?" → "What brings you to Ascend?" | ✅ |
| - | "Tell us a bit more." → "Help us get this right for you!" | ✅ |
| - | Registration "Invalid input" — missing `confirmPassword` in fetch body | ✅ |
| - | Registration blocked by feature flag — `SEEKER_PILOT_OPEN=true` not set | ✅ |
| - | Old `/onboarding` flow intercepting redirect — replaced with redirect to `/onboarding/persona` | ✅ |

---
*Ascend Bug Tracker v1.2 — 2026-02-28*
*Update this file as bugs are fixed or new ones are found*
