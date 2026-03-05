# Ascend Backlog — Autonomous Build Execution Plan

**Version:** 1.0  
**Effective:** March 2026  
**Role:** Lead Software Architect, QA Lead, and Autonomous Build Agent

---

## 1. PURPOSE

Execute backlog development **phase-by-phase** while maintaining system stability, correctness, and build integrity. This document defines the mandatory execution loop, guardrails, and phase order. **No phase may be skipped.**

---

## 2. PLATFORM CONTEXT

Ascend is a full-stack career navigation platform combining:

- Job search
- AI resume optimization
- Mentorship marketplace
- Career analytics
- Company intelligence

The system is **production-grade**. Multiple modules must **never break** during backlog development.

---

## 3. TECH STACK

| Layer      | Stack                        |
|-----------|------------------------------|
| Frontend  | Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadCN UI |
| State     | Zustand, SWR                 |
| Backend   | Next.js API routes           |
| Database  | PostgreSQL                   |
| ORM       | Prisma                       |
| Search    | Typesense                    |
| Queues    | BullMQ                       |
| Cache     | Redis                        |
| Storage   | Cloudinary                   |
| Payments  | Razorpay, Stripe             |
| AI        | OpenAI GPT-4o                |
| Analytics | PostHog, Sentry              |
| Deploy    | Vercel                       |

---

## 4. CORE SYSTEMS (ALREADY BUILT — MUST REMAIN FUNCTIONAL)

| System |
|--------|
| Authentication and RBAC |
| User profiles |
| Resume builder |
| AI resume optimizer |
| Job ingestion pipeline |
| Job search and filtering |
| Fit score engine |
| Application tracking system |
| Company profiles and reviews |
| Mentorship ecosystem |
| Outcome verification |
| Analytics infrastructure |

---

## 5. ENGINEERING GUARDRAILS

| # | Rule |
|---|------|
| 1 | **Never break existing functionality.** |
| 2 | Every phase must **compile successfully.** |
| 3 | All **TypeScript errors** must be fixed immediately. |
| 4 | All **ESLint issues** must be resolved. |
| 5 | **No unfinished code** may be committed. |
| 6 | Every phase must include **automated tests.** |
| 7 | Every phase must produce a **build report.** |
| 8 | **Never skip validation steps.** |

---

## 6. EXTERNAL DEPENDENCY POLICY

External dependencies must **never block** development.

If a feature requires a third-party API:

1. **Build** the entire internal infrastructure
2. **Create** an integration adapter layer
3. **Implement** mock integrations
4. **Document** the dependency
5. **Continue** to the next phase

### Adapter structure

```
lib/integrations/
  linkedinAdapter.ts
  indeedAdapter.ts
  naukriAdapter.ts
  atsAdapter.ts
```

All adapters must expose standardized methods:

- `postJob()`
- `pauseJob()`
- `deleteJob()`
- `fetchApplicants()`
- `fetchAnalytics()`

If external APIs are unavailable, **return mocked responses**. Do not block.

---

## 7. BUILD EXECUTION LOOP (12 STEPS — MANDATORY PER PHASE)

For **every phase**, execute the following process in order. Do not skip steps.

---

### STEP 1 — PHASE ANALYSIS

- Understand required models, APIs, services, UI components, background jobs
- Identify dependencies (previous phases, shared modules)
- Create a build plan for the phase

---

### STEP 2 — BACKEND IMPLEMENTATION

- Create or update Prisma models
- Implement services
- Add API routes
- Add or update queue workers
- Implement data aggregation logic
- Ensure code follows existing architecture patterns

---

### STEP 3 — FRONTEND IMPLEMENTATION

- Create UI using Next.js App Router, Tailwind, ShadCN
- Add pages, components, hooks
- Wire state management (Zustand / SWR)

---

### STEP 4 — BUILD CHECK

```bash
npm run build
```

If build fails:

- Fix ESLint errors
- Fix TypeScript issues
- Fix import paths
- Fix dependency conflicts

**Repeat until build succeeds.** Do not proceed on a failing build.

---

### STEP 5 — DATABASE MIGRATION

If Prisma schema changed:

```bash
npx prisma migrate dev --name <phase_name>
```

Confirm migration success before continuing.

---

### STEP 6 — AUTOMATED TESTING

- Create tests for services, APIs, UI components
- Run:

```bash
npm test
```

Fix all failing tests. Do not proceed with failing tests.

---

### STEP 7 — FUNCTIONAL VALIDATION

Simulate real user flows. Verify:

- API responses
- Database writes
- Queue processing
- UI rendering

Examples:

- User saves search → alert created
- Mentor post created → appears in feed
- Profile view tracked → notification generated

---

### STEP 8 — INTEGRATION VALIDATION

Ensure compatibility with:

- Auth system
- Profiles
- Job search
- Mentorship
- Notifications
- Analytics

**No regressions allowed.**

---

### STEP 9 — PERFORMANCE CHECK

Confirm:

- API response < 500 ms
- Typesense queries work
- Redis caching functions
- Queues process correctly

---

### STEP 10 — PHASE REPORT

Generate a detailed report. Template:

```
═══════════════════════════════════════════════════════════
PHASE REPORT
═══════════════════════════════════════════════════════════

Phase Name:     _____________________
Phase ID:       _____________________
Date Completed: _____________________

FILES CREATED
  • 

FILES MODIFIED
  • 

DATABASE CHANGES
  • 

API ENDPOINTS ADDED
  • 

WORKERS ADDED / MODIFIED
  • 

COMPONENTS ADDED
  • 

TESTS ADDED
  • 

BUILD STATUS:     [ PASS / FAIL ]
TEST STATUS:      [ PASS / FAIL ]

EXTERNAL DEPENDENCIES
  • 

KNOWN ISSUES
  • 

═══════════════════════════════════════════════════════════
```

---

### STEP 11 — REGRESSION TEST

Run full regression on key pages:

- `/jobs`
- `/profile`
- `/resume`
- `/dashboard`
- `/mentors`

Confirm no functionality is broken.

---

### STEP 12 — PHASE COMPLETION

Only after **all checks pass** may the system move to the next phase.

**User commands:**

- `Start Phase N`
- `Proceed to next phase`
- `Run full regression`
- `Generate system health report`

---

## 8. PHASE EXECUTION ORDER

Phases must be executed in the following order. Backlog IDs are provided for traceability.

---

### PHASE 1 — Saved Search Alerts (BL-5)

**Objective:** Verify full pipeline for saved search notifications.

**Scope:**

- Confirm cron workers run
- Confirm email alerts function
- Verify `datePosted` filter in `processAlerts` uses `lastSentAt` correctly
- Improve subject lines (e.g. "5 new jobs matching…")
- Add saved-search limit notice in UI
- QA immediate / daily / weekly cadence

**Infra:** SavedSearch, JobAlert, processAlerts, cron — all built. This is a **verify & polish** sprint.

**Estimated effort:** 1 week

---

### PHASE 2 — Profile View Notifications (BL-1)

**Objective:** Track recruiter profile views and surface insights to users.

**Scope:**

- Create `ProfileViewEvent` model: `(viewerId, viewerCompanyId, profileUserId, viewedAt)`
- Aggregate by company + time window
- Premium-only: show company names + anonymised role
- Free: count only
- In-app notification
- Weekly digest feed (feeds BL-2)

**Infra:** New Prisma model required. No per-viewer storage exists today.

**Estimated effort:** 2–3 weeks

---

### PHASE 3 — Weekly Career Digest (BL-2)

**Objective:** Dormant user re-engagement via curated weekly email.

**Scope:**

- Aggregate: jobs (from SavedSearch/target role), mentor tier upgrades, platform stats
- Dormancy threshold: 14+ days no login
- Use `UserCareerContext`, engagement history
- Respect `marketingConsent` + per-channel preferences
- Resend template + weekly cron

**Depends on:** BL-5 ✅, BL-4 (transition counts), BL-1 (optional)

**Estimated effort:** 2–3 weeks

---

### PHASE 4 — Follow Mentors (BL-7)

**Objective:** Allow seekers to follow mentors without starting an application.

**Scope:**

- Create `MentorFollow` model: `(userId, mentorUserId, followedAt)`
- Mentor profile follow button
- Seeker "Following" list/page
- Follower count on mentor profile
- Discovery ranking signal
- Mentor sees count; individual list opt-in only

**Infra:** New model. Feeds BL-8 (mentor posts).

**Estimated effort:** 2 weeks

---

### PHASE 5 — Mentor Posts (BL-8)

**Objective:** Mentors publish short insights; followers see them in feed.

**Scope:**

- Create `MentorPost` model: `(mentorUserId, content, createdAt)`
- V1: text + optional image, no video, character limits
- Distribution: follower feed (BL-7), topic/transition-tagged feeds
- SEO-indexed post pages

**Depends on:** BL-7 (Follow Mentors)

**Estimated effort:** 3 weeks

---

### PHASE 6 — Transition Success Stories (BL-3)

**Objective:** Turn verified M-10 outcomes into consent-gated, shareable narratives.

**Scope:**

- Source: `MentorshipOutcome` (M-10 ✅)
- Flow: verified outcome → consent prompt → auto-generate story card → share
- Channels: in-app, URL, image export
- Safety: no PII; no employer unless consented; UTM tracking

**Depends on:** M-10 ✅

**Estimated effort:** 2–3 weeks

---

### PHASE 7 — Profile Strength Gamification (BL-6)

**Objective:** Extend completion % into full Profile Strength system.

**Scope:**

- Section-level weights (experience, skills, education, career intent, resume)
- Next-step nudges ("Add 2 skills for your target role")
- Milestones at 25/50/75/100%
- Optional streak for weekly updates
- Tie to FitScore correlation display

**Infra:** Extends existing completion % logic.

**Estimated effort:** 1–2 weeks

---

### PHASE 8 — Transition Community Signals (BL-4)

**Objective:** "142 people are on the same SWE → PM path as you."

**Scope:**

- Aggregate from `UserCareerContext` + `MentorshipOutcome`
- Privacy: aggregate counts only, no individual names
- Round numbers to avoid false precision
- Surfaces: dashboard widget, mentor/cohort discovery pages

**Depends on:** Feeds BL-2, BL-9

**Estimated effort:** 2 weeks

---

### PHASE 9 — Career Milestones (BL-10)

**Objective:** System events → branded cards → consent → external share.

**Scope:**

- Triggers: contract completed, outcome verified, tier achieved, first job in new role
- Output: image card + shareable URL
- Platform branding + UTM tracking
- Channels: in-app share, copy link, export image

**Infra:** Event triggers + card generator.

**Estimated effort:** 2 weeks

---

## 9. PHASE ↔ BACKLOG MAPPING

| Phase | Backlog ID | Feature                     |
|-------|------------|-----------------------------|
| 1     | BL-5       | Saved Search Alerts         |
| 2     | BL-1       | Profile View Notifications  |
| 3     | BL-2       | Weekly Career Digest       |
| 4     | BL-7       | Follow Mentors             |
| 5     | BL-8       | Mentor Posts                |
| 6     | BL-3       | Transition Success Stories  |
| 7     | BL-6       | Profile Strength Gamification |
| 8     | BL-4       | Transition Community Signals |
| 9     | BL-10      | Career Milestones          |

---

## 10. SYSTEM SAFETY CHECK

After **every phase**, verify:

- `/jobs` loads
- `/profile` loads
- `/resume` builder loads
- `/dashboard` loads
- Mentor discovery works

All APIs must respond correctly.

---

## 11. FAILURE POLICY

If an error occurs:

1. **Identify** root cause
2. **Fix** code
3. **Rebuild**
4. **Retest**

**Never bypass errors.** Never move to the next phase until all steps pass.

---

## 12. PRE-WORK (BEFORE PHASE 1)

Resolve these **before** starting Phase 1:

| # | Blocker              | Action                              |
|---|----------------------|-------------------------------------|
| 1 | ESLint errors (4)    | Fix — deployment blocked            |
| 2 | Resume Builder AI    | Fix stuck step — affects BL-6, BL-22 |
| 3 | Fit Score 404        | Fix broken UX                       |

---

## 13. CONTINUATION COMMANDS

When a phase is complete, wait for user instruction:

- **Start Phase N** — Begin the specified phase
- **Proceed to next phase** — Complete current phase report, then start next
- **Run full regression** — Execute system safety check across all key pages
- **Generate system health report** — Summary of build status, tests, known issues

---

## 14. FINAL RULE

**Never move to the next phase until:**

- [ ] Build succeeds
- [ ] Tests pass
- [ ] Functional validation succeeds
- [ ] Phase report generated

---

*Ascend Backlog Build Plan · Coheron Technologies · March 2026*
