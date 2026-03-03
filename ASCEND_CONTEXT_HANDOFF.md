# ASCEND — Full Project Context Handoff
**For:** Claude (new session)
**Purpose:** Complete context to continue exactly where we left off — no re-explaining needed.
**Last updated:** 2026-03-01 — Session 3

---

## WHO YOU ARE TALKING TO

The user is building **Ascend** — a production-ready, full-stack job & professional networking platform combining Naukri, Glassdoor, Foundit, LinkedIn, and Jooble. They are the developer/product owner, building phase by phase. You help by:

1. **Generating build prompts** — one phase at a time, on request, as a downloadable `.md` file (never pasted inline)
2. **Updating tracking files** — every time a phase completes or a decision is made: update `ascend-progress-tracker.html` AND this `ASCEND_CONTEXT_HANDOFF.md` together, deliver both

---

## THE PRODUCT: ASCEND

**Tagline:** "Direction is yours. Structure is ours."
**Company:** Coheron Technologies
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

**Build is green.**

**Total phases: 62 | Done: 62 (ALL PHASES COMPLETE) | Pending: 0 | Overall: 100%**

### Confirmed complete:
- ✅ **Phase 7** — Reviews & Ratings: CompanyReview, InterviewReview, SalarySubmission, vote models. Admin mod queue (all 3 types, reason codes, 48hr SLA). Redis rate limiting. Author identity never exposed. 7 Resend templates.
- ✅ **Phase 8** — Salary Insights: lib/salary/aggregate.ts, SalaryInsightCache, CityMetric, BullMQ worker, 24hr cache, PremiumGate, /salary hub + 4 sub-pages. Individual records never returned.
- ✅ **Phase 10B** — Candidate Intelligence Dashboard: 5 widgets (Market Value / Visibility Score / Skills Gap / Application Performance / Best Time to Apply), single SWR call, BullMQ worker, Monday digest email.
- ✅ **Phase 11** — AI Features: CoverLetter, InterviewPrep, ProfileOptimiserResult, JobDismissal models. BullMQ workers: cover-letter, interview-prep, profile-optimise. Smart recommendations (pgvector + FitScore). Salary prediction extended. Feature flags + rate limits.
- ✅ **Phase 16** — Data & Analytics Platform: AnalyticsEvent, DailyMetricSnapshot, track(), daily-snapshot cron, admin analytics (4 tabs), recharts, seed script. ⚠️ Clear seed data before pilot.
- ✅ **Phase 16B** — Recruiter Intelligence & Hiring Analytics: HiringAnalyticsSnapshot, InterviewScorecard, DIMetricsSnapshot models. 6 API routes (time-to-hire, funnel, benchmark, fit explainer, scorecards, D&I). /dashboard/recruiter/intelligence (6 tabs). Benchmark anonymisation enforced. D&I opt-in gate. 7 outcome events.
- ✅ **M-1** — Mentorship Identity & Verification: MentorVerification, VerificationDocument, VerificationAuditLog. Admin queue, SLA 48hrs, all decisions immutable.
- ✅ **M-2** — Mentor Profile & Transition Record: MentorProfile extended, AvailabilityWindow, 6-step form, mentor dashboard, public /mentors/[userId], admin sets isPublic.
- ✅ **M-3** — Mentee Application Layer: MentorApplication, MenteeReadinessCheck, 3-gate readiness, curated discovery max 3, word-count-enforced applications, mentor inbox, BullMQ expiry worker (6hrs), 7 Resend templates.
- ✅ **M-4** — Matching Engine: lib/mentorship/match.ts — 5-dimension scoring (Transition Similarity 40pts, Geography 20pts, Focus Area 20pts, Availability 10pts, Capacity 10pts). Redis 6hr cache. 4 refresh triggers. matchScore snapshot on apply. Admin visibility only.
- ✅ **Phase 18B** — Internal Job Board & Employee Mobility: JobPost.visibility (PUBLIC/INTERNAL/UNLISTED). CompanyEmployee model (domain-based auto-grant on login). /internal/[company-slug] auth-gated portal (employees only). JobReferral model + referral email + outcome tracking. Anonymous internal apply (name revealed on SHORTLISTED). Internal-first cron (INTERNAL → PUBLIC after N days). HR Mobility analytics tab (fill rate, time-to-fill, referral conversion, top referrers). 5 outcome events. See PHASE_18B_BUILD.md.

- ✅ **M-11** — Mentor Reputation & Tier System: MentorTier enum (RISING/ESTABLISHED/ELITE). MentorTierHistory model. MentorProfile extended (tier, tierUpdatedAt, tierOverriddenByAdmin, tierOverrideNote, disputeRate, stenoRate stub, maxActiveMentees, activeMenteeCount). TIER_CONFIG constants (outcome thresholds, capacity, fee %, priority matching, featured). lib/mentorship/tiers.ts (calculateTier, checkDemotionCriteria — dispute rate + lapsed verification; stenoRate deferred to M-7 with comment, recalculateMentorTier — idempotent, recalculateDisputeRate, enforceCapacity). verifyOutcome() + opsReviewOutcome() wired. Mentor ACCEPT enforces capacity (409 MENTOR_AT_CAPACITY). activeMenteeCount maintained on contract lifecycle. 4 APIs (public tier, tier history, admin override, remove override). Weekly cron (batched 50, skips admin-overridden). Discovery: ELITE featured row (max 3) + internal tier boost to match score. ESTABLISHED/ELITE badges on cards (RISING badge hidden). /dashboard/mentor Tier & Reputation card + /dashboard/mentor/tier-history page. /dashboard/admin/mentorship/tiers. 4 Resend templates. 6 outcome events. See PHASE_M11_BUILD.md.

- ✅ **M-10** — Outcome Verification & Attribution: MentorshipOutcome model (unique per contract). OutcomeStatus enum (PENDING_MENTEE/VERIFIED/DISPUTED/UNACKNOWLEDGED/OPS_REVIEWED). OutcomeCheckInStatus enum. MentorProfile extended (verifiedOutcomeCount, totalEngagements, avgTimeToOutcomeDays, outcomeTypes). lib/mentorship/outcomes.ts (submitOutcomeClaim, verifyOutcome, disputeOutcome, markUnacknowledged, opsReviewOutcome, submitCheckIn, recalculateMentorOutcomeStats — idempotent). 6 APIs incl. public mentor stats endpoint. BullMQ outcome-acknowledgement worker (7-day expiry) + outcome-checkin worker (6-month reminder). Mentor public profile Verified Outcomes section + testimonials (consent-only, no PII). Mentee check-in badge on profile. Engagement dashboard Outcome section. Admin /dashboard/admin/mentorship/outcomes (disputed queue + all outcomes tab). Daily cron: outcome-reminders. 9 Resend templates. 6 outcome events. UNACKNOWLEDGED ≠ VERIFIED enforced everywhere. See PHASE_M10_BUILD.md.

- ✅ **M-8** — Session Rhythm & Milestone Framework: EngagementType enum (SPRINT/STANDARD/DEEP). EngagementSession, EngagementMilestone, EngagementDocument models. MentorshipContract extended (engagementType, engagementStart, engagementEnd). lib/mentorship/engagement.ts (initialiseEngagement, ENGAGEMENT_CONFIG). verifyOTPAndSign() wired → auto-creates sessions + milestones on contract ACTIVE. APIs: GET engagements/[contractId], PATCH sessions/[id] (schedule/complete/cancel), PATCH milestones/[id] (file), POST documents/[contractId]/goal, POST documents/[id]/sign, POST documents/[contractId]/outcome. Daily cron: engagement-reminders. 14 Resend templates. /mentorship/engagements/[contractId] dashboard. /mentorship/dashboard extended with Active Engagement card. 9 outcome events. See PHASE_M8_BUILD.md.

- ✅ **M-5** — Contract Generation & Signing: MentorshipContract, ContractSignature, ContractStatus enum. lib/mentorship/contract.ts (generateContractContent, createContract, requestOTP, verifyOTPAndSign, generateContractPDF, verifyContractIntegrity, expireUnsignedContracts). OTP email-based, Redis TTL 10min. SHA-256 PDF integrity check on every access. S3 private + signed URLs. 8 Resend templates. contract-pdf BullMQ queue. tcVersion locked. 7 outcome events.

- ✅ **Phase 17** — Trust, Safety & Compliance: Resolves Bug 19 (Critical). AuditLog extended (category/severity/actorIp/previousState/newState/success/errorCode). SecurityEvent model. UserReport model + ReportButton wired into job posts/reviews/profiles/mentor profiles. DataRequest model (GDPR + DPDP Act 2023 — EXPORT/DELETE/RECTIFY). logAudit() non-throwing. logAdminAction() backward-compatible. Auth/data access/payment/mentorship events all logged. BullMQ data-export worker. Account deletion: soft delete + PII anonymization + legal record retention (contracts 7yr, transcripts 3yr). /settings/privacy extended with Your Data section. /dashboard/admin/trust 5-tab dashboard. IP blocking via Redis. 6 Resend templates. 6 outcome events.


### What comes next:
- **M-6** — Escrow & Payment Infrastructure

---

## POST-PILOT BACKLOG

These are scoped and intentional — not forgotten. To be prioritised after pilot testing is complete and initial user feedback is gathered.

### Growth & Volume (LinkedIn learnings)

| # | Feature | What it does | Priority |
|---|---------|-------------|----------|
| BL-1 | **Richer profile view notifications** | "3 recruiters from Flipkart viewed your profile this week" — company names for paid users | High |
| BL-2 | **Weekly career digest email** | "3 new jobs matching your target role, 2 mentors in your path went Elite" — dormant user re-engagement | High |
| BL-3 | **Transition success stories** | Verified outcome → auto-generated story "Priya moved SWE → PM in 87 days" — consent-gated, shareable | High |
| BL-4 | **"People in your transition" signal** | "142 people are on the same SWE → PM path as you" — community belonging | High |
| BL-5 | **Saved search alerts** | "5 new jobs matching Product Manager, Bengaluru posted today" — passive re-engagement | High |
| BL-6 | **Profile strength gamification** | Extend existing completion % — specific nudges, milestone rewards | Medium |
| BL-7 | **Follow mentors** | Discovery without applying — browse mentor insights, follow without committing to engagement | Medium |
| BL-8 | **Mentor posts / insights** | Mentors share transition tips → seekers follow → organic acquisition flywheel | Medium |
| BL-9 | **Cohort communities** | "SWE → PM 2025 cohort" group — extends Mentorship Circles (M-12) into broader community | Medium |
| BL-10 | **Career milestones (shareable)** | "I just completed a mentorship with an ELITE mentor" — social sharing drives acquisition | Medium |
| BL-11 | **Skills assessment / peer endorsement** | Peers endorse skills → profile score → better matching | Medium |
| BL-12 | **Company culture ratings (prominent)** | Surface existing reviews more prominently — brings passive seekers back | Medium |
| BL-13 | **Creator mode for mentors** | Long-form content, newsletter — builds mentor audience on Ascend | Low |
| BL-14 | **Verified career certificates** | Ascend-issued completion badges for mentorship engagements | Low |
| BL-15 | **Alumni networks** | "10 people from your company are on Ascend" — enterprise acquisition lever | Low |

### Job Distribution

| # | Feature | What it does | Priority |
|---|---------|-------------|----------|
| BL-24 | **Multi-Board Job Syndication & Centralised Tracking** | Recruiters post a job on Ascend and syndicate in one click to Naukri, LinkedIn, Indeed, Foundit, Glassdoor, Monster, Shine, Internshala, and others. Ascend becomes the single command centre. CENTRALISED TRACKING: post status per board (Live/Failed/Pending/Expired); applicant count per board in real time; views/clicks where APIs expose; cost per board for paid listings with cost-per-applicant and cost-per-hire by source; source attribution on every applicant card ("Applied via Naukri"); best-performing board insights over time; one-click pause/takedown across all boards simultaneously. ARCHITECTURE: unique tracked redirect URL per job per board as apply link — all CVs land in Ascend regardless of source, attribution 100% reliable without depending on each board's reporting API. Boards without APIs become fully trackable. INTEGRATION: direct APIs where available (Indeed, LinkedIn); partner aggregators (Broadbean, Multipost, Jobsoid) as fallback. Prisma: JobBoardSyndication (jobPostId, board, status, postedAt, expiresAt, costPaid, trackingUrl), JobBoardApplicantSource (applicationId, board, clickedAt). Confirm board-by-board feasibility before scoping. | High |

### Platform Intelligence

| # | Feature | What it does | Priority |
|---|---------|-------------|----------|
| BL-17 | **Subscription invoicing** | Wire `createInvoice()` into Razorpay/Stripe subscription webhooks once userId resolution is solved (deferred from GST invoicing build) | High |
| BL-18 | **Aadhaar eSign** | Post-pilot legal signing upgrade — replaces email OTP for contracts | Medium |
| BL-19 | **DPDP Act 2023 compliance audit** | Full audit of data handling against Digital Personal Data Protection Act 2023 | Medium |
| BL-20 | **Live SAML SSO** | Full SAML handshake for enterprise SSO — config collection done in Phase 18, activation deferred | Medium |
| BL-21 | **ATS live API keys** | Greenhouse/Lever/Workday live testing — infrastructure built in Phase 18, keys pending | Medium |
| BL-22 | **Resume builder multilingual + RTL PDF** | Devanagari script, RTL layout for Arabic — deferred from Phase 21 rollback | Low |
| BL-23 | **hreflang / sitemaps** | SEO infrastructure for future market expansion | Low |

---

## OPEN BUGS — 16 total

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
| 19 | ~~Audit log scope is admin-actions only — does not meet Zero Trust. Missing: auth events, data access, user state changes, direct DB changes~~ | ✅ **RESOLVED — Phase 17** | ~~Critical (pre-public-launch)~~ |

### Pre-Pilot Operations
| # | Action | When |
|---|--------|------|
| — | Clear seeded analytics data before pilot opens | `DELETE FROM "DailyMetricSnapshot"` — run day before pilot |
| — | Shut down Prisma Studio, restrict DB to VPN only | Before pilot |
| — | Set `seeker_pilot_open = true` in Feature Flags | ⚠️ PENDING — M-17 build complete but flag not yet set |
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
Phase 3      Company Profiles                                ✅ Done
Phase 3B     Company Admin Dashboard Completion              ✅ Done
Phase 4      Job Post Creation & Listing                     ✅ Done
Phase 5      Job Search & Filters                            ✅ Done
Phase 5A     Profile Fit Score (JD Fit Score)                ✅ Done
Phase 6      Application System                              ✅ Done
Phase 6A     JD Resume Optimiser                             ✅ Done
Phase 12     Monetisation (Multi-Gateway)                    ✅ Done
Phase 12R    Pricing Restructure (₹699/₹1,199 plans)        ✅ Done

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
M-1          Identity & Verification Infrastructure          ✅ Done
M-2          Mentor Profile & Transition Record              ✅ Done
M-3          Mentee Onboarding & Application Layer           ✅ Done
M-4          Matching Engine                                 ✅ Done
M-5          Contract Generation & Digital Signing           ✅ Done
M-6          Escrow & Payment Infrastructure                 ✅ Done
M-7          Meeting Room, Ascend Steno & Evidence           ✅ Done
M-8          Session Rhythm & Milestone Framework            ✅ Done
M-9          Dispute Resolution Engine                       ✅ Done

── MENTORSHIP TRACK ── continued ───────────────────────────────────────
M-10         Outcome Verification & Attribution              ✅ Done
M-11         Mentor Reputation & Tier System                 ✅ Done
M-12         Mentorship Circles (Group Cohorts)              ✅ Done
M-13         Mentor Monetisation Unlock                      ✅ Done
M-14         Platform Fee & Revenue Layer                    ✅ Done
M-15         Legal Framework & Compliance                    ✅ Done
M-16         Admin & Ops Layer                               ✅ Done
M-17         Mentorship Analytics & Insights                 ✅ Done

                    ── PILOT OPENS AFTER M-17 COMPLETE ──────────────────

── COMPANY LAUNCH ── Running in parallel with Mentorship Track ──────────
Phase 7      Reviews & Ratings                               ✅ DONE
Phase 8      Salary Insights                                 ✅ DONE
Phase 10B    Candidate Intelligence Dashboard                ✅ DONE
Phase 11     AI Features                                     ✅ DONE
Phase 16     Data & Analytics Platform                       ✅ DONE

── GROWTH & PARTNERSHIPS ───────────────────────────────────────────────
Phase 16B    Recruiter Intelligence & Hiring Analytics       ✅ DONE
Phase 17     Trust, Safety & Compliance                      ✅ DONE
Phase 18     B2B / Enterprise & API Platform                 ✅ Done
GST          GST Invoicing Layer                                ✅ Done
Phase 18B    Internal Job Board & Employee Mobility          ✅ Done
Phase 19     Growth, Virality & Network Effects              ✅ Done
Phase 20     Platform Intelligence & Investor Metrics        ✅ Done

── EXPANSION ───────────────────────────────────────────────────────────
Phase 21     Global Multilingual & Market Expansion          🔄 Rolled Back
Phase 22     Marketplace & Career Services                   ✅ Done
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
Three documents: (1) Mentorship Marketplace Addendum (once, at signup), (2) Mentor Conduct Agreement (at mentor onboarding), (3) Engagement Contract (per engagement, M-5). Data retention: transcripts 3yr, contracts + payments 7yr. Post-pilot: DPDP Act 2023 audit. (Aadhaar eSign removed — email OTP is globally applicable and legally sufficient under IT Act 2000.)

### M-16 — Admin & Ops Layer
Verification queue (SLA 48hrs, immutable). Dispute queue (rule-based auto-resolved, ops reviews "Other"). Mentor monitoring (Steno rate, dispute rate, tier eligibility). Audit log (all movements immutable). Admin Zero Trust: cannot manually release escrow without trail, cannot delete logs, cannot override rule-based resolutions.

### M-17 — Mentorship Analytics & Insights
Platform: engagements, outcome rate, avg time to outcome by transition, dispute rate by tier, revenue, Steno success rate. Mentor own: applications, completion, outcome rate, earnings, tier progress. Mentee own: applications, completed engagements, goals achieved, action items pending.

---

## PLATFORM LEGAL ENTITY

| Field | Value |
|-------|-------|
| Legal Name | Coheron Tech Private Limited |
| Trade Name | Ascend |
| GSTIN | 29AANCC3402A1Z3 |
| State Code | 29 (Karnataka) |
| Registered Address | No. 5, 21st B Cross, Pragathi Layout, Doddanekkundi, Bengaluru, Karnataka – 560037 |
| GST Type | Regular |
| GST Rate | 18% flat (SAC 998314) |
| Financial Year | April 1 – March 31 (Indian FY) |
| Invoice Format | ASC/YYYY-YY/XXXX (sequential, resets per FY) |

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
- `ascend-progress-tracker.html` — Interactive phase tracker (61 phases, 42 done)
- `ASCEND_ESLINT_FIX_PROMPT.md` — ✅ Used, build is green
- `ASCEND_HERO_RESPONSIVE_FIX_PROMPT.md` — Skipped for now, hero kept as-is

---

## DECISIONS LOG (2026-03-01)

### Session 4 completions:
- **Phase 17 ✅** — Trust, Safety & Compliance complete. Bug 19 resolved.
- **Phase 20 renamed** — "Acquisition Readiness & Fundraise" → "Platform Intelligence & Investor Metrics" (same deliverables, acquisition intent not surfaced in build docs)
- **M-7 architecture decisions** — Whisper + LLM for transcription (multilingual, Hindi/English code-switching); per-participant Daily.co audio tracks (eliminates diarisation problem); 24hr Steno delivery window; GPU on Vultr when scale demands it
- **Next:** Phase 18B (Internal Job Board & Employee Mobility) → M-8 → M-10 → M-11 → M-16 → M-17 → Phase 19 → Phase 20 → Phase 21 → Phase 22

### Session 3 completions:
- **M-4 ✅** — Matching Engine complete
- **Phase 11 ✅** — AI Features complete
- **Phase 16B ✅** — Recruiter Intelligence & Hiring Analytics complete
- **M-5 ✅** — Contract Generation & Signing complete
- **Next:** Phase 18B (Internal Job Board & Employee Mobility) — M-6 skipped (Razorpay escrow external dependency); Phase 18 skipped (ATS/SSO external dependencies)

### Session 2 completions:
- **Phase 7 ✅** — Reviews & Ratings complete
- **Phase 8 ✅** — Salary Insights complete
- **Phase 10B ✅** — Candidate Intelligence Dashboard complete
- **Phase 16 ✅** — Data & Analytics Platform complete
- **M-1 ✅** — Mentorship Identity & Verification complete
- **M-2 ✅** — Mentor Profile & Transition Record complete
- **M-3 ✅** — Mentee Application Layer complete

### Session 1 decisions:

- **Hero redesign rejected** — stepped ASCEND logotype mockup reviewed, current flat design preferred. Kept as-is.
- **Hero responsive fix skipped** — deferred, not priority before pilot
- **Group label renamed** — "Acquisition" → "Growth & Partnerships" in all tracking files
- **Audit log scope confirmed as Bug 19** — admin-only logging does not meet Zero Trust; Phase 17 is the resolution
- **Analytics seed data** — confirmed fake, will be cleared before pilot (`DELETE FROM "DailyMetricSnapshot"`)
- **Phase 9B v1** — confirmed superseded by Mentorship Track; v1 build provides Prisma model foundations only
- **Mentorship Track** — 100% build (M-1→M-17) before pilot opens. Pilot gate moved: was after M-9, now after M-17.

---

## HOW TO RESUME IN A NEW CHAT

> "I'm building Ascend — a full-stack job platform. Here is my context handoff document: [paste this file]. Please confirm you understand the full context and we'll continue from Phase 18 (B2B / Enterprise & API Platform)."

---

- ✅ **Phase 19** — Growth, Virality & Network Effects: ReferralCode, Referral, ShareEvent, ProfileEndorsement models. lib/growth/referral.ts (generateReferralCode, trackReferralClick, attributeReferral, convertReferral). Referral attribution via Redis + cookie. /join?ref= landing page. ShareButton on job/company/profile/salary/mentor pages (Web Share API + dropdown fallback). Skill endorsements (1st-degree connections only, 5/week Redis rate limit, in-app notification). Invite Teammates card on recruiter dashboard. Registration wired (generateReferralCode + attributeReferral); career-context completion wired (convertReferral). Admin Growth dashboard (referral funnel, share events by channel, top referrers by conversions, viral coefficient). Reward: 30-day feature flag bypass (no monetary reward yet). 6 outcome events. 3 Resend templates (referral-converted, referral-reward-granted, recruiter-invite). See PHASE_19_BUILD.md.
- ✅ **Phase 20** — Platform Intelligence & Investor Metrics: InvestorSnapshot (daily cron, idempotent), MetricAlert models. lib/intelligence/platform.ts (computeInvestorSnapshot, getRetentionCohorts, getNorthStarMetric — active mentorship engagements this week, getRevenueWaterfall, checkMetricAlerts). 8 APIs (snapshot, snapshots?days=, retention, revenue, north-star, alerts CRUD). Daily cron (00:30 IST, after daily-snapshot). /dashboard/admin/investor (PLATFORM_ADMIN only, unlisted from nav): north star card, 2×3 key metrics grid, 4 recharts (user growth, MRR trend, revenue waterfall, AI usage), retention cohort heatmap, metric alerts panel, CSV export. Exchange rates static env vars, LTV labelled as estimate. 4 outcome events. See PHASE_20_BUILD.md.
- ✅ **Phase 21** — English-Only Simplification (multilingual rolled back): next-intl removed; /messages/ directory deleted; RTL support removed; LanguageSwitcher removed from Navbar; SupportedLanguage + ParsedJDTranslation models dropped; User.preferredLanguage + preferredRegion removed; jd-translate BullMQ worker deleted; /dashboard/admin/languages removed; /settings/language simplified to /settings/currency (currency selector only). KEPT: User.preferredCurrency, lib/i18n/currency.ts (formatCurrency, convertFromInr, SUPPORTED_CURRENCIES), salary display in preferredCurrency on job cards, PWA manifest + /offline page (lang hardcoded to en). See PHASE21_ROLLBACK_BUILD.md.
- ✅ **Phase 22** — Marketplace & Career Services: MarketplaceProvider, ResumeReviewOrder, MockInterviewBooking, CoachingSession, ProviderReview, CourseRecommendation, CourseClick, ProfileBadge models; ProviderStatus, ProviderType, OrderStatus, BadgeStatus enums. lib/marketplace/fees.ts (20% platform fee stored at order creation, never recalculated). Provider onboarding multi-step (/marketplace/become-provider) + admin approval queue (mirrors M-1 pattern). Resume review: discovery, provider detail, booking (Razorpay/Stripe), delivery, dispute. Mock interview: discovery, booking, post-session scorecard (4 dimensions), seeker scorecard view. Career coaching: discovery, booking, post-session notes. Course recommendations wired to Phase 10B skills gap card. /marketplace/courses browse + affiliate click tracking. /settings/badges (manual add, admin revoke). Badge display on /profile/[username] + recruiter pipeline badge filter. /dashboard/provider (orders, earnings, reviews, profile — payout manual monthly). /dashboard/admin/marketplace (5 tabs: providers, orders, revenue, courses, badges; dispute resolution + refund). No automated payouts. No OAuth with assessment providers. 7 Resend templates. 8 outcome events. See PHASE_22_BUILD.md.

- ✅ **M-16** — Admin & Ops Layer: MentorshipAuditLog (append-only, all mentorship lifecycle events), OpsAlert models; MentorshipAuditCategory, OpsAlertType enums; ContractStatus extended with PAUSED. lib/mentorship/audit.ts (logMentorshipAction — wraps MentorshipAuditLog + AuditLog, never throws). Audit wired into: verifyOTPAndSign, createContract, expireUnsignedContracts, submitOutcomeClaim, verifyOutcome, disputeOutcome, opsReviewOutcome, recalculateMentorTier, admin tier override. lib/mentorship/ops-alerts.ts (createOpsAlert — idempotent, resolveOpsAlert, checkAndCreateAlerts — 7 checks: verification SLA, contract unsigned, dispute SLA, outcome unacknowledged, high dispute rate, lapsed reverification, stalled engagement). GET /api/admin/mentorship/overview; GET /api/admin/mentorship/audit-log (paginated, filterable); GET/PATCH alerts; GET/detail engagements; POST intervene (WARN_MENTOR, WARN_MENTEE, PAUSE_ENGAGEMENT — cannot release escrow, override disputes, or delete records); GET/detail mentor monitoring. Daily cron (08:00 IST): checkAndCreateAlerts + ops digest email if critical/high. /dashboard/admin/mentorship unified ops centre (5 tabs: Overview, Engagements, Mentor Monitoring, Audit Log, Alerts); "Mentorship Ops" admin nav with unread alert badge. PAUSED contract: engagement banner shown, capacity unchanged, tier cron skips. Zero Trust enforced on all intervention paths. 4 Resend templates. 5 outcome events. See PHASE_M16_BUILD.md.

- ✅ **M-15** — Legal Framework & Compliance: `LegalDocument`, `LegalDocumentSignature` models; `LegalDocumentType` enum (MENTORSHIP_MARKETPLACE_ADDENDUM, MENTOR_CONDUCT_AGREEMENT). `lib/mentorship/legal/documents.ts` (full legal text for both documents as typed constants). `lib/mentorship/legal/signatures.ts` (hasSignedDocument, getActiveDocument, recordSignature, checkMarketplaceAccess). `scripts/seed-legal-documents.ts` (idempotent). 5 APIs (GET doc + signed status, request-otp, sign, user signatures, admin audit). `/mentorship/legal/sign/[type]` signing page (scroll-to-bottom gate, OTP modal — reuses M-5 ContractOTPModal). Mentorship Hub banner for unsigned Addendum. Server-side 403 gate on `POST /api/mentorship/applications` and `POST /api/mentorship/become-mentor`. Step 0 gate in `/mentorship/become-a-mentor`. Signatures exempt from Phase 17 account deletion anonymisation (7yr retention). `/dashboard/admin/mentorship/legal` 7th tab (active docs, signature stats, publish new version, audit). 3 Resend templates. 4 outcome events. See PHASE_M15_BUILD.md.
- ✅ **M-17** — Mentorship Analytics & Insights: `MentorshipAnalyticsSnapshot`, `MentorAnalyticsSnapshot` models (daily cron, idempotent upsert). `lib/mentorship/analytics.ts` (7 functions: computePlatformSnapshot, computeMentorSnapshot, computeAllMentorSnapshots — batched 50/100ms, getTransitionOutcomeBreakdown, getDisputeRateByTier, getMentorProgressToNextTier, getMenteeEngagementSummary). 5 platform APIs (PLATFORM_ADMIN), 4 mentor own APIs, 2 mentee own APIs. Daily cron 01:00 IST. "Analytics" 6th tab in `/dashboard/admin/mentorship` (6 metric cards, 4 recharts, transition table, dispute-by-tier table). `/dashboard/mentor/analytics` (performance card, tier progress with blockers, engagements table, conditional trend charts, earnings stub). `/dashboard/mentee/engagements` (5-card strip, engagements list — no PII beyond first name + transition). `/mentorship` hub "My Progress" card. Steno rate and earnings both stubbed (M-7/M-6 pending). 5 outcome events. ⚠️ `seeker_pilot_open = true` NOT YET SET — manual step pending. See PHASE_M17_BUILD.md.

- ✅ **Phase 18** — B2B / Enterprise & API Platform: `ApiKey` (SHA-256 hashed, scoped, `asc_live_`/`asc_test_` prefixed), `ApiUsageLog`, `AtsWebhookEvent`, `CompanyWebhook`, `AtsIntegration`, `SsoConfig`, `CareersPageConfig`, `BulkImportJob` models; `AtsProvider`, `BulkImportType`, `BulkJobStatus` enums. `lib/api/keys.ts` (generateApiKey, validateApiKey, hasScope, revokeApiKey). `lib/api/middleware.ts` (`withApiAuth()` + Redis sliding window rate limit 1,000 req/hr). `lib/api/usage.ts` (getUsageSummary). Public REST API v1: Jobs (CRUD), Applications (read/update), Candidates (read), Outbound webhooks — all company-scoped, Enterprise-gated. Inbound ATS webhooks: `/api/webhooks/ats/greenhouse|lever|workday|generic/[companyId]` — async via BullMQ `ats-webhook-processor`. BullMQ: `bulk-import` + `webhook-delivery` (retry 3x exponential). `PLAN_LIMITS` updated (apiAccess, whiteLabel, ssoEnabled, bulkImport, atsWebhooks). `/careers/[companySlug]` white-label public page + custom domain middleware (Redis-cached). Bulk import (CSV/JSON, max 500 rows) + application export (CSV stream). `/developers` portal (overview, API reference, webhook docs, changelog — public/static). `/dashboard/company/api` (4 tabs: API Keys, Usage, Webhooks, ATS Integration). `/dashboard/company/careers` config UI. `/dashboard/company/sso` config form (collection only — PLATFORM_ADMIN activates). `/dashboard/admin/enterprise` (enterprise companies, SSO activation, ATS events log). 8 outcome events. See PHASE_18_BUILD.md.

- ✅ **GST Invoicing** — Tax-compliant invoicing layer: `Invoice`, `InvoiceLineItem`, `InvoiceSequence`, `BillingProfile` models; `GstType` (CGST_SGST / IGST), `InvoiceStatus`, `InvoicePaymentType` enums. `lib/invoice/config.ts` (PLATFORM_ENTITY — Coheron Tech, GSTIN 29AANCC3402A1Z3, SAC 998314, `getFinancialYear()`). `lib/invoice/generate.ts` (generateInvoiceNumber atomic sequence ASC/YYYY-YY/XXXX, determineGstType, calculateGst, createInvoice, finaliseInvoice, voidInvoice). `lib/invoice/pdf.ts` (generateInvoicePdf via pdf-lib, uploadInvoicePdf to S3). BullMQ `invoice-pdf` worker. Legal pages updated with Coheron Tech address. `/dashboard/billing` Invoices + Billing Details tabs. `/dashboard/admin/invoices` (GST summary cards, CSV export for CA). 2 Resend templates. 5 outcome events. **Deferred:** Subscription invoicing — Razorpay/Stripe webhook lacks reliable userId, to be wired when subscription payment flow resolves user. M-6 mentorship tranche `createInvoice()` — integration pending M-6 escrow models (wired in M-6). See PHASE_GST_INVOICING_BUILD.md.

- ✅ **M-12** — Mentorship Circles (Group Cohorts): 4–6 mentees, one mentor, same transition goal. Mentor creates circle (focus, max mentees, fixed start, price per mentee). Platform matches eligible mentees. Circle locks when full or at start date. Daily.co group room + Ascend Steno (speaker attribution per member). Individual Goal Documents per mentee. Optional 1:1 slot 15 mins/mentee/session. One contract + individual escrow per mentee. Peer layer: Goal Documents visible to cohort (consent-gated), async peer check-ins via platform messaging. Pricing: mentor sets within band, ceiling = 60% of 1:1 price. Capacity: one circle = 1 mentor slot. See PHASE_M12_BUILD.md.

- ✅ **M-14** — Platform Fee & Revenue Layer: `TrancheFeeRecord` (immutable per-tranche fee audit — tier at release, rate applied, amounts), `MentorshipRevenueSnapshot` (daily cron). `lib/escrow/fees.ts` (getLiveFeeRate — live tier at release not signing snapshot, calculateFeeAmounts, hasTierChanged, formatFeeRate). `lib/escrow/revenue.ts` (computeDailyRevenueSnapshot, getRevenueSummary, getMentorPayoutSummary, getPlatformFeeSummary). `releaseTranche()` updated — recalculates fee at release using live tier, creates `TrancheFeeRecord`, logs tier change if detected. Daily cron 02:00 IST. M-17 earnings stubs resolved — `computeMentorSnapshot()` + `computePlatformSnapshot()` now use real payout data. `/dashboard/mentor/analytics` real figures. `/dashboard/mentor` fee info card (current rate + tier-up nudge). "Revenue" 9th tab in `/dashboard/admin/mentorship` (cards, 3 recharts, tier change log). 4 APIs. 4 outcome events. See PHASE_M14_BUILD.md.

- ✅ **M-7** — Meeting Room, Ascend Steno & Session Evidence: SessionRoom, SessionJoinLog, StenoConsentLog, SessionTranscript, StenoExtraction, SessionRecord, SessionExceptionNote, MessageFlag models. Real-time Deepgram transcription (audio never stored). Pop-up consent gate — decline logs waiver, session proceeds, dispute rights waived per session. 60% slot duration minimum threshold. Exception flow (non-initiating party files note → 48hr acknowledge → remainder carries to next session). lib/storage/ abstraction (local dev, Vultr Object Storage prod — S3-compatible). GPT-4o Mini extraction. 3 BullMQ workers. Daily.co webhook (idempotent). Off-platform keyword detection 3-strike system. 7 APIs. 10 Resend templates. 15 outcome events. See PHASE_M7_BUILD.md.

- ✅ **M-13** — Mentor Monetisation Unlock: MentorMonetisationStatus + MentorSeoBoost models. Unlock criteria (3+ verified outcomes, 90%+ Steno rate, 0 upheld disputes, 6+ months, re-verification current) — automatic weekly check, never manual. canChargeMentees requires both unlock + MENTOR_MARKETPLACE plan. Session fee floor ₹2,000 / ceiling ₹25,000. lib/mentorship/monetisation.ts + lib/mentorship/seo-boost.ts. SEO boost pricing (₹999/14d, ₹1,999/30d, ₹2,999/mo recurring) — 1.3x discovery score multiplier same-tier only. Monthly payout PDF + annual FY summary. 9 Resend templates. 8 outcome events. See PHASE_M13_BUILD.md.

- ✅ **M-12** — Mentorship Circles (Group Cohorts): MentorshipCircle, CircleMember, CircleSession, CircleOneOnOneSlot, CirclePeerCheckIn models. CIRCLE_CONFIG (4–6 mentees, 90-day DEEP, 90-min sessions, 15-min optional 1:1s, 60% price ceiling, 1 mentor slot). lib/mentorship/circles.ts (createCircle, applyToCircle, acceptCircleApplication, lockCircle, initialiseCircleEngagement, createCircleSession). Group Steno: Deepgram diarization → buildCircleSpeakerMap() → GPT-4o Mini multi-mentee extraction (per-mentee commitments, action items, goal progress signals). Individual contracts + escrow per member. Peer layer: Goal Document sharing (opt-in at signing), async peer check-ins (500 chars). Daily cron: lock circles at startDate. /mentorship/circles public listing. /mentorship/circles/[circleId] detail. /mentorship/circles/create. /mentorship/circles/[circleId]/manage. 10 APIs. 10 Resend templates. 8 outcome events. See PHASE_M12_BUILD.md.

- ✅ **M-9** — Dispute Resolution Engine: MentorshipDispute, DisputeEvidence (immutable), DisputeStrike models. 6 dispute categories with deterministic DISPUTE_RULES — platform reads evidence, never adjudicates stories. Auto-resolved: SESSION_DID_NOT_HAPPEN, BELOW_MINIMUM_DURATION, STENO_NOT_GENERATED, OFF_PLATFORM_SOLICITATION. OPS_REVIEW: COMMITMENTS_NOT_MET (partial), OTHER. freezeTranche() on filing, unfreezeTranche() on outcome. recalculateDisputeRate() + runMonetisationUnlockCheck() on upheld. M-13 upheldDisputeCount stub resolved. Strike system enforced. 3 BullMQ workers. 6 APIs. 10 Resend templates. 10 outcome events. See PHASE_M9_BUILD.md.

*Last updated: 2026-03-02 — Session 8 | 🎉 ALL 62 PHASES COMPLETE | Build green | Total: 62/62 done (100%) | ⚠️ ACTION REQUIRED: Set seeker_pilot_open = true → Pilot opens | Entity: Coheron Tech Pvt Ltd | GSTIN: 29AANCC3402A1Z3*
