# ASCEND — Full Project Context Handoff
**For:** Claude (new session)
**Purpose:** Complete context to continue exactly where we left off — no re-explaining needed.
**Last updated:** 2026-03-01 — 10:30 AM

---

## WHO YOU ARE TALKING TO

The user is building **Ascend** — a production-ready, full-stack job & professional networking platform combining Naukri, Glassdoor, Foundit, LinkedIn, and Jooble. They are the developer/product owner, building phase by phase. You help by:

1. **Generating build prompts** — one phase at a time, on request, as a downloadable `.md` file (never pasted inline)
2. **Updating tracking files** — every time a phase completes or a decision is made: update `ascend-progress-tracker.html` AND this `ASCEND_CONTEXT_HANDOFF.md` together, deliver both

---

## THE PRODUCT: ASCEND

**Tagline:** "Your career has a direction. We make it inevitable."
**Company:** Coheron Tech Private Limited
**Brand:** Parchment `#F7F6F1` + Green `#16A34A` + Ink `#0F1A0F`. Syne (display) + DM Sans (body).

### Tech Stack
| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadCN UI |
| State | Zustand + SWR |
| Backend | Next.js API Routes |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js (Email/password, Google, LinkedIn OAuth, 2FA, RBAC) |
| Search | Typesense |
| Cache | Redis (ioredis) |
| File Storage | Cloudinary |
| Email | Resend |
| Payments | Razorpay (INR) + Stripe (USD) |
| AI | OpenAI GPT-4o + text-embedding-3-small |
| Video/Meetings | Daily.co embedded (Mentorship Track) |
| Transcription | Daily.co + Deepgram (Mentorship Track — Ascend Steno) |
| Queues | BullMQ |
| Deployment | Vercel (frontend) + Vultr (PostgreSQL + Redis + Typesense) |
| i18n | next-intl (English + Hindi) |
| Analytics | PostHog + Sentry |

### User Roles
`JOB_SEEKER`, `RECRUITER`, `COMPANY_ADMIN`, `PLATFORM_ADMIN`

---

## CURRENT STATUS — 2026-03-01

**Build is green.** Phase 7, M-1, and M-2 confirmed complete. Phase 8 parsed to Cursor (in progress).

**Total phases: 55 | Done: 29 | Pending: 26 | Overall: ~53%**

### What was just completed (this session):
- ✅ Phase 7 (Reviews & Ratings) — CompanyReview, InterviewReview, SalarySubmission, vote models, admin moderation queue extension, Redis rate limiting, Resend emails, seeker dashboard nudge card
- ✅ M-1 (Mentorship Identity & Verification) — MentorVerification, VerificationDocument, admin verification queue, SLA 48hrs, all decisions immutable
- ✅ M-2 (Mentor Profile & Transition Record) — MentorProfile, AvailabilityWindow, 6-step onboarding form, mentor dashboard, public profile at /mentors/[userId], admin approval wired

### What is in progress:
- ⬡ **Phase 8** (Salary Insights) — parsed to Cursor. Two data sources (SalarySubmission + JDSalarySignal), lib/salary/aggregate.ts, SalaryInsightCache, PremiumGate component, /salary hub + role/company/compare/estimate pages

### What comes next (on completion):
- **Mentorship Track:** M-3 (Mentee Application Layer)
- **Company Launch:** Phase 10B (Candidate Intelligence Dashboard) — after Phase 8 green

---

## OPEN BUGS — 19 total

### UI / Visual
| # | Bug | Location | Priority |
|---|-----|----------|----------|
| 1 | Notice period dropdown — transparent background on profile edit | Profile edit page | High |
| 4 | Skills dialog — transparent background | Profile edit → Skills section | High |
| 5 | Projects dialog — transparent background | Profile edit → Projects section | High |
| 6 | Skills on public profile render as plain text with double spaces — needs pill/chip styling | `/profile/[slug]` | Medium |
| 7 | Profile photo cropped — needs `object-cover` + proper aspect ratio on circular container | `/profile/[slug]` | High |
| 8 | Education section — no visual hierarchy between institution and degree | `/profile/[slug]` | Low |
| 9 | Work experience bullets render as plain paragraphs — needs `<ul>` with proper list styling | `/profile/[slug]` | Medium |
| 10 | Certifications section missing credential ID + verification link | `/profile/[slug]` | Low |

### Logic / Data
| # | Bug | Location | Priority |
|---|-----|----------|----------|
| 11 | Fit Score 404 on job detail page for some jobs — FitScoreCard not rendering | `/jobs/[slug]` | High |
| 12 | Resume Builder "Start New" not responding | `/resume/builder` | High |
| 13 | AI Content step stuck on skeleton loaders — likely OpenAI key missing in `.env.local` | `/resume/builder` | Critical |
| 14 | Industry select — uncontrolled/controlled React warning | Form component | Low |
| 15 | Fit Score 404 | `/api/jobs/[id]/fit-score` | High |
| 16 | Network page — no way to add connections, missing "Find people" CTA | `/network` | Medium |
| 17 | Logged-in user appears in own mentor discovery results | `app/api/mentorship/mentors/route.ts` — missing `userId: { not: session.user.id }` filter | High |
| 18 | Career updates widget shows generic "Career update" label — not human-readable | Seeker dashboard signal feed | Low |

### Architecture / Security
| # | Bug | Location | Priority |
|---|-----|----------|----------|
| 19 | Audit log scope is admin-actions only — does not meet Zero Trust. Missing: auth events, data access, user state changes, direct DB changes | Phase 17 dependency | Critical (pre-public-launch) |

### Pre-Pilot Operations
| # | Action | When |
|---|--------|------|
| — | Clear seeded analytics data before pilot opens | `DELETE FROM "DailyMetricSnapshot"` — run day before pilot |
| — | Shut down Prisma Studio, restrict DB to VPN only | Before pilot |
| — | Set `seeker_pilot_open = true` in Feature Flags | Day of pilot |
| — | Change your role back from PLATFORM_ADMIN to JOB_SEEKER (or create separate admin account) | Before seeding test accounts |

---

## FULL ROADMAP

```
── FOUNDATION ──────────────────────────────────────────────────────────
Phase 1      Auth & Onboarding                               ✅ DONE
Pre-2        Infrastructure & AI Scaffolding                 ✅ DONE
Phase 2      Job Seeker Profile                              ✅ DONE
Phase 2A     Intelligent Resume Builder                      ✅ DONE

── PRE-LAUNCH ──────────────────────────────────────────────────────────
Phase 0      Pre-Launch Data Layer (JD Ingestion)            ✅ DONE
Phase 0B     Free JD Source Scripts                          ✅ DONE
Phase 0C     Company Intelligence Bootstrap                  ✅ DONE

── CORE PLATFORM ───────────────────────────────────────────────────────
Phase 3      Company Profiles                                ✅ DONE
Phase 3B     Company Admin Dashboard Completion              ✅ DONE
Phase 4      Job Post Creation & Listing                     ✅ DONE
Phase 5      Job Search & Filters                            ✅ DONE
Phase 5A     Profile Fit Score (JD Fit Score)                ✅ DONE
Phase 6      Application System                              ✅ DONE
Phase 6A     JD Resume Optimiser                             ✅ DONE
Phase 12     Monetisation (Multi-Gateway)                    ✅ DONE

── SEEKER PILOT TRACK ──────────────────────────────────────────────────
Phase 10     Dashboards (Seeker-first)                       ✅ DONE
Phase 15     Mobile Responsiveness Polish                    ✅ DONE
Phase 14     SEO Optimizations                               ✅ DONE
Phase 13     Admin Panel (lite)                              ✅ DONE

── DESIGN SYSTEM ───────────────────────────────────────────────────────
DS-1         Design System & Homepage Visual Pass            ✅ DONE
DS-2         Nav Restructure — Two States                    ✅ DONE
DS-3         Feature Showcase Pages (5 pages)                ✅ DONE
DS-4         Persona Selection Screen                        ✅ DONE
DS-4B        Persona Deepening — Context Flow                ✅ DONE
DS-5         Legal Pages & Signup Consent                    ✅ DONE

── PRE-PILOT COMPLETION ────────────────────────────────────────────────
Phase 9      Career Graph & Contextual Networking            ✅ DONE
Phase 9B     Mentorship Layer v1 (superseded — see M track)  ✅ DONE
Phase 16     Data & Analytics Platform                       ✅ DONE

── MENTORSHIP TRACK ── Full build before pilot (M-1→M-17) ──────────────
M-1          Identity & Verification Infrastructure          ✅ DONE
M-2          Mentor Profile & Transition Record              ✅ DONE
M-3          Mentee Onboarding & Application Layer           ⬜ Next
M-4          Matching Engine                                 ⬜ Pending
M-5          Contract Generation & Digital Signing           ⬜ Pending
M-6          Escrow & Payment Infrastructure                 ⬜ Pending
M-7          Meeting Room, Ascend Steno & Evidence           ⬜ Pending
M-8          Session Rhythm & Milestone Framework            ⬜ Pending
M-9          Dispute Resolution Engine                       ⬜ Pending

── MENTORSHIP TRACK ── continued ───────────────────────────────────────
M-10         Outcome Verification & Attribution              ⬜ Pending
M-11         Mentor Reputation & Tier System                 ⬜ Pending
M-12         Mentorship Circles (Group Cohorts)              ⬜ Pending
M-13         Mentor Monetisation Unlock                      ⬜ Pending
M-14         Platform Fee & Revenue Layer                    ⬜ Pending
M-15         Legal Framework & Compliance                    ⬜ Pending
M-16         Admin & Ops Layer                               ⬜ Pending
M-17         Mentorship Analytics & Insights                 ⬜ Pending

                    ── PILOT OPENS AFTER M-17 COMPLETE ──────────────────

── COMPANY LAUNCH ── Running in parallel with Mentorship Track ──────────
Phase 7      Reviews & Ratings                               ✅ DONE
Phase 8      Salary Insights                                 ⬡ IN PROGRESS
Phase 10B    Candidate Intelligence Dashboard                ⬜ Next (after Phase 8)
Phase 11     AI Features                                     ⬜ Pending

── GROWTH & PARTNERSHIPS ───────────────────────────────────────────────
Phase 16B    Recruiter Intelligence & Hiring Analytics       ⬜ Pending
Phase 17     Trust, Safety & Compliance (⚠️ Bug-19 dep)     ⬜ Pending
Phase 18     B2B / Enterprise & API Platform                 ⬜ Pending
Phase 18B    Internal Job Board & Employee Mobility          ⬜ Pending
Phase 19     Growth, Virality & Network Effects              ⬜ Pending
Phase 20     Acquisition Readiness & Fundraise               ⬜ Pending

── EXPANSION ───────────────────────────────────────────────────────────
Phase 21     Global Vernacular & Market Expansion            ⬜ Pending
Phase 22     Marketplace & Career Services                   ⬜ Pending
```

---

## MENTORSHIP TRACK — ARCHITECTURE DECISIONS (locked)

Full specification: `ASCEND_MENTORSHIP_ROADMAP.md`

| Decision | Choice | Reason |
|----------|--------|--------|
| Meeting room | Daily.co embedded | Evidence ownership — platform controls the room |
| Transcription | Daily.co + Deepgram | Speaker-attributed, native API |
| Session record | GPT-4o extraction → immutable PDF → S3 + SHA-256 | Ascend Steno — replaces mentor manual summary |
| Video storage | NOT stored | Transcript is evidence. Cost + liability with no gain |
| Payments | Razorpay escrow, tranche-based release | Zero Trust — neither party holds funds |
| Contracts | OTP-signed per engagement (IT Act 2000) | Legally binding Indian e-signature |
| Discovery | Application model — mentees apply, mentors accept | No self-serve booking |
| Matching | System-driven, max 3 matches, plain-language reason | Not a catalogue |
| Messaging | Async only — not the meeting | Clean separation of concerns |
| Off-platform | Zero tolerance — keyword detection in messages | "If it didn't happen on Ascend, it didn't happen" |
| Mentor tiers | RISING / ESTABLISHED / ELITE | Based on verified outcomes only |
| Disputes | Rule-based, evidence only | Platform adjudicates on logs not claims |
| Pilot fee | Waived | Infrastructure runs full fidelity |

**Mentorship is not a booking system. It is trust infrastructure.**

---

## MENTORSHIP TRACK — PHASE SUMMARIES

### M-1 — Identity & Verification
Gov ID + employment verification. Ops review queue. `VerificationStatus` enum: UNVERIFIED/PENDING/VERIFIED/REVERIFICATION_REQUIRED. Mentor not discoverable until VERIFIED. Re-verify every 12 months or on role change. Admin queue SLA 48hrs, all decisions immutable. Prisma: `MentorVerification`, `VerificationDocument`.

### M-2 — Mentor Profile & Transition Record
Structured transition story (from/to role, company type, industry, city, duration, 3 key factors). Verification badge: SELF_REPORTED / PLATFORM_VERIFIED. Capacity declaration (platform-enforced). Focus areas, geography tags, what mentor will NOT help with, mentor statement (200 words max). This is matching input — not a marketing page.

### M-3 — Mentee Application Layer
Readiness gate (profile + DS-4B context + target transition declared). System shows max 3 matched mentors with plain-language reason. Mentee application: why this mentor (100-200 words), goal, commitment, timeline, what already tried. Max 2 simultaneous applications. Mentor response: Accept/Decline/One question. 5-day window or auto-expire.

### M-4 — Matching Engine
`lib/mentorship/match.ts`. Scoring: transition similarity 40pts, geography 20pts, focus area 20pts, availability 10pts, capacity 10pts. Output: ranked list max 3 with plain-language reason per match. Not a score — a reason.

### M-5 — Contract Generation & Digital Signing
Auto-generated on acceptance. Covers: verified details, scope, financial terms, off-platform prohibition, transcription consent, Zero Trust acknowledgement, governing law (Indian Contract Act 1872, IT Act 2000, Consumer Protection Act 2019). OTP signing (mentor first, mentee 48hr window). PDF → SHA-256 → S3 immutable. Prisma: `MentorshipContract`, `ContractSignature`.

### M-6 — Escrow & Payment Infrastructure
Full fee collected at signing, split into tranches in Razorpay escrow. Standard 90d: 33%/33%/34%. Release: mentee confirms → immediate; silence 7 days → auto-release; dispute → freeze + ops 48hrs. Platform fee at release: RISING 20%, ESTABLISHED 15%, ELITE 10%. Pilot: fee waived. All movements immutable. Prisma: `MentorshipEscrow`, `EscrowTranche`, `PaymentMovement`.

### M-7 — Meeting Room, Ascend Steno & Evidence
Daily.co embedded rooms (platform-generated, neither party can substitute). Join logging via webhooks. Min 20 mins or INCOMPLETE_SESSION. **Ascend Steno:** speaker-attributed transcript → GPT-4o extraction (summary, commitments per party, action items, goal progress) → immutable Session Record PDF (SHA-256, S3). Replaces mentor manual summary entirely. Video NOT stored. Consent at contract signing + voice announcement + visible indicator. Off-platform keyword detection in messaging.

### M-8 — Session Rhythm & Milestones
Engagement types: Sprint 30d (4 sessions, 1 milestone), Standard 60d (6 sessions, 2 milestones), Deep 90d (8 sessions, 3 milestones). Session 1: mandatory Goal Setting + Goal Document signed by both. Mid-milestone: both file assessments. Final: Outcome Review + Outcome Document. No-show within 15 mins = absent.

### M-9 — Dispute Resolution Engine
Filing window: 7 days of milestone only. Evidence auto-assembled: join log, duration, Steno record, message flags, contract, Goal Document. Resolution rules (not discretionary — admin cannot override): session didn't happen → check join log; below duration → check log (auto-upheld if <20 mins); commitments → check Steno extraction; off-platform → check message flags. Admin only reviews "Other" category. Strike system: mentee 2 rejected = lose rights; mentor 3 upheld = suspended.

### M-10 — Outcome Verification & Attribution
Outcome claim at engagement end (structured). Mentee acknowledgement 7-day window: confirmed = VERIFIED, disputed = ops review, silent = UNACKNOWLEDGED (shown separately). 6-month check-in optional with badge incentive. Mentor profile shows: verified outcomes, transition types, avg time to outcome.

### M-11 — Mentor Reputation & Tier System
RISING (0-4 outcomes, max 2 mentees, 20% fee), ESTABLISHED (5-9, max 4, 15% fee, priority matching), ELITE (10+, max 6, 10% fee, featured). System-calculated weekly. Demotion: dispute rate threshold, Steno rate <90%, lapsed verification.

### M-12 — Mentorship Circles
4-6 mentees, one mentor, same transition, 90 days. Group Daily.co room, Ascend Steno runs for group. Individual contracts and escrow per mentee. Peer accountability layer.

### M-13 — Mentor Monetisation Unlock
Free tier (all start): can mentor, cannot charge. Paid unlock (ALL): 3+ verified outcomes, 90%+ Steno rate, zero upheld disputes, 6+ months on platform. Floor ₹2,000/session, ceiling ₹25,000/session.

### M-14 — Platform Fee & Revenue Layer
Applied at tranche release. Tier at release determines %. Refunded if dispute upheld or mentor terminates. NOT refunded if mentee terminates (completed sessions) or auto-release.

### M-15 — Legal Framework & Compliance
Three documents: (1) Mentorship Marketplace Addendum (once, at signup), (2) Mentor Conduct Agreement (at mentor onboarding), (3) Engagement Contract (per engagement, M-5). Data retention: transcripts 3yr, contracts + payments 7yr. Post-pilot: Aadhaar eSign, DPDP Act 2023 audit.

### M-16 — Admin & Ops Layer
Verification queue (SLA 48hrs, immutable). Dispute queue (rule-based auto-resolved, ops reviews "Other"). Mentor monitoring (Steno rate, dispute rate, tier eligibility). Audit log (all movements immutable). Admin Zero Trust: cannot manually release escrow without trail, cannot delete logs, cannot override rule-based resolutions.

### M-17 — Mentorship Analytics & Insights
Platform: engagements, outcome rate, avg time to outcome by transition, dispute rate by tier, revenue, Steno success rate. Mentor own: applications, completion, outcome rate, earnings, tier progress. Mentee own: applications, completed engagements, goals achieved, action items pending.

---

## KEY ARCHITECTURAL DECISIONS & CONSTRAINTS

These apply to ALL phases — never violate:

1. **No synchronous AI calls in HTTP handlers** — always via BullMQ queues
2. **All AI prompts in `lib/ai/prompts/`** — no inline strings
3. **All AI interactions logged** via `lib/tracking/outcomes.ts`
4. **No direct Prisma in client components** — all DB writes via `/api` routes
5. **React Hook Form + Zod** for all form validation
6. **Rich text sanitized** with `sanitize-html` before store/render
7. **JD Resume Optimiser is fact-bound** — no fabrication; `fabricationRisk: false` required on every output item
8. **Soft deletes** for jobs (CLOSED status) — hard deletes avoided where applications reference
9. **Mentorship: Zero Trust** — evidence only, no claims; "If it didn't happen on Ascend, it didn't happen"
10. **Mentorship sessions: immutable** — Steno records and contracts cannot be edited by either party

---

## MONETISATION PRICING (locked)

### Job Seeker
| Plan | Price |
|------|-------|
| Free | ₹0 |
| Premium | ₹499/month · ₹3,999/year |

### Recruiter / Company
| Plan | Price |
|------|-------|
| Starter | ₹4,999/month |
| Pro | ₹12,999/month |
| Enterprise | ₹29,999+/month |

### Mentorship Platform Fee
| Tier | Fee |
|------|-----|
| RISING (0-4 outcomes) | 20% |
| ESTABLISHED (5-9 outcomes) | 15% |
| ELITE (10+ outcomes) | 10% |
| Pilot | Waived |

### Pilot Rule
`SEEKER_PILOT_OPEN=true` bypasses all seeker feature gates. Recruiter monetisation live immediately.

---

## INFRASTRUCTURE

| Layer | Choice | Cost/month |
|-------|--------|-----------|
| Frontend + API | Vercel Pro | ~₹1,700 |
| PostgreSQL | Vultr Managed | ~₹1,250 |
| Redis + Typesense | Vultr Cloud Compute | ~₹2,000 |
| File storage | Cloudinary (free tier) | ₹0 |
| Email | Resend | ₹0–1,700 |
| OpenAI | Usage-based | ₹3,000–8,000 |
| Daily.co (Mentorship) | ~$0.004/participant/min | Usage-based |
| **Total baseline** | | **~₹8,000–13,000/month** |

---

## KEY FILES
- `ASCEND_MENTORSHIP_ROADMAP.md` — Complete Mentorship Track specification (M-1 → M-17)
- `ASCEND_BUG_TRACKER.md` — All 19 open bugs with fix instructions
- `ascend-progress-tracker.html` — Interactive phase tracker (55 phases, 26 done)
- `ASCEND_ESLINT_FIX_PROMPT.md` — ✅ Used, build is green
- `ASCEND_HERO_RESPONSIVE_FIX_PROMPT.md` — Skipped for now, hero kept as-is

---

## DECISIONS LOG (this session — 2026-03-01)

- **Hero redesign rejected** — stepped ASCEND logotype mockup reviewed, current flat design preferred. Kept as-is.
- **Hero responsive fix skipped** — deferred, not priority before pilot
- **Group label renamed** — "Acquisition" → "Growth & Partnerships" in all tracking files
- **Audit log scope confirmed as Bug 19** — admin-only logging does not meet Zero Trust; Phase 17 is the resolution
- **Analytics seed data** — confirmed fake, will be cleared before pilot (`DELETE FROM "DailyMetricSnapshot"`)
- **Phase 9B v1** — confirmed superseded by Mentorship Track; v1 build provides Prisma model foundations only
- **Mentorship Track** — 100% build (M-1→M-17) before pilot opens. Pilot gate locked.
- **Parallel build track** — Company Launch phases (7, 8, 10B, 11…) running in parallel with Mentorship Track
- **Phase 7 complete** — Reviews & Ratings: CompanyReview, InterviewReview, SalarySubmission models + full moderation + vote system
- **M-1 complete** — Identity & Verification Infrastructure: MentorVerification, VerificationDocument, admin queue
- **M-2 complete** — Mentor Profile & Transition Record: MentorProfile, 6-step onboarding, mentor dashboard, public profile
- **Phase 8 in progress** — Salary Insights parsed to Cursor: aggregate service, PremiumGate, /salary hub + detail pages

---

## HOW TO RESUME IN A NEW CHAT

> "I'm building Ascend — a full-stack job platform. Here is my context handoff document: [paste this file]. Please confirm you understand the full context and we'll continue."

---

*Last updated: 2026-03-01 | Build green | 19 open bugs | Total: 55 phases, 29 done (53%) | Mentorship Track: M-3 next | Company Launch: Phase 8 in progress, Phase 10B next*
