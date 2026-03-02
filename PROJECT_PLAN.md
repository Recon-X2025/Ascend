# Ascend — Unified Job & Professional Networking Platform

## Project Plan

A production-ready, scalable full-stack application combining core features of Naukri, Glassdoor, Foundit, LinkedIn, and Jooble.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack & Infrastructure](#2-tech-stack--infrastructure)
3. [Phased Development Roadmap](#3-phased-development-roadmap)
4. [Phase Details & Deliverables](#4-phase-details--deliverables)
   - [Phase 0: Pre-Launch Data Layer (JD Ingestion)](#phase-0-pre-launch-data-layer-jd-ingestion)
   - [Phase 0B: Free JD Source Scripts](#phase-0b-free-jd-source-scripts)
   - [Phase 1–15](#phase-1-auth--onboarding) (Auth through Mobile Polish)
   - [Design System (DS) Phases DS-1–DS-5](#design-system-ds-phases-ds-1ds-5)
   - [Phase 3B: Company Admin Dashboard Completion](#phase-3b-company-admin-dashboard-completion)
   - [Phase 10: Dashboards (Seeker-First)](#phase-10-dashboards-seeker-first--complete)
   - [Phase 10B: Candidate Intelligence Dashboard](#phase-10b-candidate-intelligence-dashboard)
   - [Phase 16B: Recruiter Intelligence & Hiring Analytics](#phase-16b-recruiter-intelligence--hiring-analytics)
   - [Phase 17: Trust, Safety & Compliance](#phase-17-trust-safety--compliance)
   - [Phase 18B: Internal Job Board & Employee Mobility](#phase-18b-internal-job-board--employee-mobility)
   - [Phase 19: Growth, Virality & Network Effects](#phase-19-growth-virality--network-effects)
   - [Phase 21: Global Multilingual & Market Expansion](#phase-21-global-multilingual--market-expansion)
   - [Phase 22: Marketplace & Career Services](#phase-22-marketplace--career-services)
4.1. [How Resume Builder, Fit Score & JD Optimiser Connect](#41-how-the-resume-builder-fit-score--jd-optimiser-connect)
5. [Database & API Strategy](#5-database--api-strategy)
6. [Quality, Security & Compliance](#6-quality-security--compliance)
7. [Timeline Overview](#7-timeline-overview)

---

## 1. Executive Summary

| Item | Description |
|------|-------------|
| **Product** | Single unified platform for job search, company reviews, salary insights, professional networking, and recruitment |
| **Users** | Job Seekers, Recruiters/Employers, Company Admins, Platform Admins |
| **Stack** | Next.js 14 (App Router), TypeScript, Tailwind, ShadCN, Prisma, PostgreSQL, NextAuth, Redis, Stripe |
| **Search** | Elasticsearch or Typesense |
| **Deployment** | Vercel (frontend) + Vultr (DB, Redis, optional backend services) |

**Build order:** Auth → Job Seeker Profile → **Intelligent Resume Builder** → Company Profiles → Company Admin Dashboard → Jobs (create & list) → Search & Filters → **Pre-Launch Data Layer (JD Ingestion)** → **Profile Fit Score (JD)** → Applications → **JD Resume Optimiser** → Reviews → Salary Insights → Networking & Feed → Dashboards → **Candidate Intelligence Dashboard** → AI → Monetization → Admin → SEO → Mobile Polish → Data & Analytics → **Recruiter Intelligence** → Trust & Compliance → B2B / Enterprise → **Internal Job Board** → Growth & Virality → Acquisition Readiness → **Vernacular Expansion** → **Marketplace & Career Services**.

---

## 2. Tech Stack & Infrastructure

### 2.1 Core

| Layer | Choice | Notes |
|-------|--------|-------|
| **Frontend** | Next.js 14 (App Router), TypeScript | SSR/SSG/ISR for SEO and performance |
| **UI** | Tailwind CSS, ShadCN UI | Consistent, accessible components |
| **State** | Zustand (or Redux) | Global state; React Query/SWR for server state |
| **Backend** | Next.js API Routes (+ optional Express for heavy workers) | Start with API routes; extract if needed |
| **Database** | PostgreSQL | Primary data store |
| **ORM** | Prisma | Migrations, type-safe client |
| **Auth** | NextAuth.js | Email/password, Google, LinkedIn OAuth, 2FA, sessions |

### 2.2 Supporting Services

| Service | Choice | Purpose |
|---------|--------|---------|
| **Search** | Typesense or Elasticsearch | Full-text job/company/profile search |
| **Cache** | Redis (ioredis — local or Vultr Managed Redis) | Sessions, search results, job feeds |
| **File Storage** | lib/storage abstraction (local dev, Vultr Object Storage prod) | Resumes, profile photos, session records, contracts, invoices |
| **Email** | Resend or Nodemailer | Verification, alerts, application confirmations |
| **Payments** | Stripe | Subscriptions, job boosts, credits |
| **i18n** | next-intl or next-i18next | English + Hindi (extensible) |
| **Resume/JD AI** | OpenAI GPT-4o | Resume content generation, JD parsing (structured JSON), summary/bullet rewrites, diff copy |
| **Similarity (Fit Score)** | OpenAI text-embedding-3-small | Skills/experience/keyword similarity; store in pgvector (PostgreSQL) or Pinecone |
| **JD analysis cache** | Redis | Cache JD analysis results TTL 24h; fit score cache TTL ~1h |

### 2.3 Deployment

| Component | Target | Notes |
|-----------|--------|------|
| Frontend + API | Vercel | Edge/Serverless |
| PostgreSQL | Vultr | Managed DB |
| Redis | Local (dev) / Vultr Managed Redis (prod) | ioredis client |
| Search | Typesense Cloud or Elastic Cloud | Managed preferred |
| Workers (aggregation, emails) | Vercel Cron / Vultr workers | As needed |

### 2.4 Pre–Phase 2A Infrastructure (Outcome & AI Scaffolding)

Scaffolding added before Phase 2A to support acquirer-ready outcome data and AI at scale:

| Component | Purpose |
|-----------|---------|
| **Outcome tracking** | `OutcomeEvent`, `AIInteraction`, `UserJourney` (Prisma); `lib/tracking/outcomes.ts`; `POST /api/track`, `POST /api/track/rate` |
| **AI prompt registry** | `lib/ai/prompts/` — versioned Claude prompts; no inline prompt strings (see PROMPTS.md) |
| **Async AI workers** | BullMQ queues (`resume`, `fit-score`, `optimiser`, `email`); worker stubs in `lib/queues/workers/`; `GET /api/jobs/[jobId]` for status |
| **B2B API keys** | `APIKey` model; `lib/api-keys/` (generate, hash, validate) for Phase 18 |
| **Docs** | PROMPTS.md, ARCHITECTURE.md, OUTCOMES.md, PERSONA_ARCHITECTURE.md — living docs for prompts, stack, pilot metrics, and user intelligence model |

All AI features from Phase 2A onwards use the job queue (never synchronous in HTTP handlers) and record every interaction for outcome analysis.

---

## 3. Phased Development Roadmap

### 3.1 Status (as of 2026-03-02)

**Status key:** ✅ Complete | 🟡 Partial | 🔜 Next | ⬜ Pending

| Phase / Milestone | Status | Notes |
|-------------------|--------|-------|
| **Phase 1** — Auth & Onboarding | ✅ Complete | Email/password, Google & LinkedIn OAuth, verification, onboarding, RBAC |
| **Pre-Phase 2** — Infrastructure | ✅ Complete | Outcome tracking, AI prompt registry, BullMQ workers, B2B API keys, docs |
| **Phase 2** — Job Seeker Profile | ✅ Complete | Full profile sections, skills, resumes, completion score, public profile |
| **Phase 1 & 2 fixes** | ✅ Complete | Build and runtime fixes; pre-Phase 2A test suite (Jest, manual checklist, db-check, REGRESSION_REPORT.md) |
| **Phase 2A** — Intelligent Resume Builder | ✅ Complete | Career intent, profile mapping, BullMQ AI content gen, ATS engine, 6 templates, PDF/DOCX export |
| **Phase 3** — Company Profiles | ✅ Complete | Prisma models, CRUD & claim, overview page, discovery, slug uniqueness, CompanyAdmin permissions, rich text sanitized. See PHASE_3_BUILD.md. |
| **Phase 3B** — Company Admin Dashboard Completion | 🔜 Next | Reviews, interview reviews, Q&A, benefits admin UI, salary stub, company admin dashboard (6 tabs), rate limiting. |
| **Phase 4** — Job Post Creation & Listing | ✅ Complete | Job post form, listing, detail, lifecycle, cron, recruiter dashboard |
| **Phase 5** — Job Search & Filters | ✅ Complete | Typesense full-text search (replaces ILIKE); faceted filters with counts; URL-synced filter state; autocomplete suggestions (Redis TTL 10min); saved searches; job alerts (immediate/daily/weekly email); search history; Redis cache 5min TTL + invalidation on index/remove. |
| **Phase 0 — Pre-Launch Data Layer** | ✅ Complete | JD ingestion pipeline built (RawJD, ParsedJD, JDEmbedding, JDSalarySignal; load-csv, parser, embed, taxonomy scripts; GET /api/ingestion/stats). Data population runs in parallel / pre-launch (see PHASE_0_BUILD.md). |
| **Phase 0B** — Free JD Source Scripts | ✅ Complete | RawJD.source field; upsertRawJD helper; Kaggle, Adzuna, Naukri RSS, careers-page (Playwright), RemoteOK scripts; ingest:kaggle|adzuna|rss|careers|remoteok|sources|all; docs/SOURCES.md. See PHASE_0B_BUILD.md. |
| **Phase 5A** — Profile Fit Score (JD Fit Score) | ✅ Complete | FitScore/FitScoreHistory, extractors, scorer, explainer, service; GET fit-score + batch + user; FitScoreCard/Badge/Breakdown; job detail sidebar + Fit tab; JobCard badge; seeker dashboard widget. See PHASE_5A_BUILD.md. |
| **Phase 6** — Application System | ✅ Complete | Easy Apply, screening questions, application tracking, withdraw, emails, recruiter inbox, outcome events. See PHASE_6_BUILD.md. |
| **Phase 6A** — JD Resume Optimiser | ✅ Complete | OptimisationSession, JD-specific ResumeVersion, BullMQ worker, prompts (no fabrication), optimise API + poll + optimised-versions, OptimiseResumeButton, session page, rate limit, outcome tracking. See PHASE_6A_BUILD.md. |
| **Phase 10** — Dashboards (Seeker-First) | ✅ Complete | Notification model + API + NotificationCentre; GET dashboard/seeker|recruiter|admin; seeker dashboard (profile completion, application stats, recent applications, saved jobs, alerts, optimised resumes); recruiter + admin dashboards; profile views + notifications wired (application status, resume optimised, profile view). See PHASE_10_BUILD.md. |
| **Phase 10B** — Candidate Intelligence Dashboard | ✅ Complete | CandidateInsightSnapshot; lib/intelligence (candidate, visibility, heatmap); GET/POST intelligence/candidate + refresh; BullMQ compute + weekly-digest workers; five intelligence cards; premium gating; Monday digest email; cron routes. See PHASE_10B_BUILD.md. |
| **Phase 13** — Admin Panel (Lite) | ✅ Complete | AuditLog, FeatureFlag; user ban/unban + session invalidation; company verify/suspend; moderation queue (approve/reject CompanyReview); feature flags + audit; flag wiring (fit score, optimiser, alerts, easy apply, seeker_pilot_open). See PHASE_13_BUILD.md. |
| **Phase 14** — SEO Optimizations | ✅ Complete | buildMetadata, JobPosting/Organization/BreadcrumbList/WebSite JSON-LD, sitemap, robots, generateMetadata on job/company/salary, dynamic OG image for jobs, JD Library pages, slug audit, docs/SEO_SETUP. See PHASE_14_BUILD.md. |
| **Phase 15** — Mobile Responsiveness Polish | ✅ Complete | Container, BottomNav, TopNav mobile, job filters sheet, JobCard/JobDetail mobile, sticky apply CTA, touch targets, dark default, skeletons, ErrorBoundary, next-intl + EN/Hi stub, LanguageSwitcher, image config. See PHASE_15_BUILD.md. |
| **Phase 16** — Data & Analytics Platform | ✅ Complete | PLATFORM_ADMIN analytics dashboard: AnalyticsEvent, DailyMetricSnapshot; lib/analytics/track.ts; daily-snapshot cron; GET admin/analytics/overview|funnel|personas|features|retention; /dashboard/admin/analytics (Overview, Funnel, Personas, Platform Health); recharts components; seed script. See PHASE_16_BUILD.md. |
| **Phase 16B** — Recruiter Intelligence & Hiring Analytics | ✅ Complete | HiringAnalyticsSnapshot, InterviewScorecard, DIMetricsSnapshot; Company.diMetricsEnabled; GET time-to-hire, funnel, benchmark, fit-explanation, scorecards, di-metrics; PATCH di-metrics (enable); /dashboard/recruiter/intelligence (Time to Hire, Funnel, Benchmarking, D&I); fit explainer & scorecard Sheets on applicant pipeline; RecruiterNav; 7 outcome events. See PHASE_16B_BUILD.md. |
| **Phase 17** — Trust, Safety & Compliance | ✅ Complete | Bug 19 audit scope; SecurityEvent/UserReport/DataRequest; logAudit/logSecurityEvent; content reporting (ReportButton). Parts 4–9: GDPR data-request API + BullMQ workers + Your Data section; admin Trust & Safety dashboard (5 tabs); rate limit → SecurityEvent + IP blocklist; Resend templates; outcome events; nav. Pilot gate complete. See PHASE_17_BUILD.md. |
| **Phase 19** — Growth, Virality & Network Effects | ✅ Complete | ReferralCode/Referral/ShareEvent/ProfileEndorsement; referral funnel (generate, track click, attribute signup, convert onboarding); /join?ref= landing; ShareButton on job/company/profile/salary/mentor; skill endorsements (1st-degree, 5/week); Invite Teammates (recruiter); admin growth dashboard; registration & career-context wired; 6 outcome events, 3 Resend templates. See PHASE_19_BUILD.md. |
| **Phase 11** — AI Features | ✅ Complete | Cover letter generator, interview prep, profile optimiser, smart job recommendations, salary prediction (profile-based); BullMQ cover-letter/interview-prep/profile-optimise workers; feature flags; rate limits. See PHASE_11_BUILD.md. |
| **Phase 12** — Monetisation (Multi-Gateway) | ✅ Complete | Razorpay (INR) + Stripe (USD); UserSubscription, CompanySubscription, PaymentEvent, JobBoost, ResumeUnlock; lib/payments abstraction; create-order, verify, subscribe, webhooks; billing UI, job boost flow; plan gates (optimiser, job limit, fit-score breakdown). **Pricing Restructure:** New PLAN_LIMITS (SEEKER_FREE/PAID, MENTOR_FREE/PAID/MARKETPLACE, RECRUITER_*); resume pay-per-use ₹99; mentor marketplace subscription ₹1,199/mo; migrate-legacy-plans script. See PHASE_12_PRICING_RESTRUCTURE_BUILD.md. |
| **Phase 9** — Career Graph & Contextual Networking | ✅ Complete | Connection (with ConnectionType), CompanyFollow, Conversation, Message (job/company/session context), CareerSignal; connection request/respond/list/suggestions/status; company follow; messaging (recruiter must attach job for cold outreach); career signal feed (no posts); circles (derived); nav badges; /network, /messages, /feed; profile Connect CTA; seeker NetworkCard & FeedPreview. See PHASE_9_BUILD.md. |
| **Phase 9B** — Mentorship Layer | ✅ Complete | MentorProfile, MentorAvailability, MentorSession; become-mentor flow; /mentorship discovery + filters; mentor profile + request-session panel; session lifecycle (REQUESTED→ACCEPTED→SCHEDULED→COMPLETED); notifications + MENTOR_* signals; MentorMatchCard on seeker dashboard (EARLY_CAREER/isSwitchingField); nav Mentorship + Mentor Dashboard. See PHASE_9B_BUILD.md. |
| **M-1** — Ascend Mentorship: Identity & Verification | ✅ Complete | MentorVerification, VerificationDocument, VerificationAuditLog; verification status (UNVERIFIED/PENDING/VERIFIED/REVERIFICATION_REQUIRED); document upload (Gov ID, Employment, LinkedIn URL); submit → admin review; admin decide (APPROVED/REJECTED/MORE_INFO_REQUESTED) with reason codes; isDiscoverable gate on discovery; cron reverification; mentor verify page + admin queue UI; dashboard verification widget. See PHASE_M1_BUILD.md. |
| **M-2** — Mentor Profile & Transition Record | ✅ Complete | MentorProfile M-2 fields (transition record, key factors, statements, capacity, focus, geography); AvailabilityWindow; 6-step become-a-mentor flow; GET/POST/PATCH profile, availability PUT, complete, public [userId]; mentor dashboard widgets; public /mentors/[userId]; admin sets isPublic on approve when profile exists; Resend emails; seeker nav entry. See PHASE_M2_BUILD.md. |
| **M-3** — Mentee Onboarding & Application Layer | ✅ Complete | MenteeReadinessCheck, MentorApplication; readiness gates (profile, career context, target transition); curated discovery (max 3 matches); application form (5 fields, word counts); max 2 active applications; mentor accept/decline/ask one question; BullMQ expiry worker; 7 Resend templates; MentorshipWidget, MentorApplicationInbox. See PHASE_M3_BUILD.md. |
| **M-4** — Matching Engine | ✅ Complete | lib/mentorship/match.ts (5 dimensions, reason-only to mentee); discover uses scoreMentors + Redis 6hr cache; queueMatchRefresh + worker; snapshot on apply; admin GET applications with match fields. See PHASE_M4_BUILD.md. |
| **M-5** — Contract Generation & Digital Signing | ✅ Complete | MentorshipContract, ContractSignature, ContractStatus; createContract on mentor accept; OTP sign (rate-limited, Redis 10min); PDF via BullMQ + Playwright; integrity check; expiry cron; contract page + OTP modal; dashboard widgets; 8 Resend templates. See PHASE_M5_BUILD.md. |
| **M-6 through M-17** — Mentorship (Sessions, Payments, etc.) | 🟡 Partial | **M-6**, **M-7**, M-8, M-9, M-10, M-11, **M-12**, **M-13**, **M-14**, **M-15**, **M-16**, **M-17** complete. Mentorship Track complete; pilot-ready. See PHASE_M9_BUILD.md, PHASE_M7_BUILD.md, PHASE_M12_BUILD.md, PHASE_M13_BUILD.md. |
| **M-15** — Legal Framework & Compliance | ✅ Complete | LegalDocument, LegalDocumentSignature; Mentorship Marketplace Addendum + Mentor Conduct Agreement; OTP signing at /mentorship/legal/sign/[type]; gates on applications and become-mentor; Step 0 conduct agreement; admin Legal tab; 3 Resend templates; 4 outcome events. See PHASE_M15_BUILD.md. |
| **M-16** — Admin & Ops Layer | ✅ Complete | MentorshipAuditLog, OpsAlert; logMentorshipAction wired; ops hub at /dashboard/admin/mentorship (Overview, Engagements, Mentor Monitoring, Audit Log, Alerts); intervene (warn/pause); PAUSED contract; cron mentorship-ops-check; 4 Resend templates; 5 outcome events. See PHASE_M16_BUILD.md. |
| **M-17** — Mentorship Analytics & Insights | ✅ Complete | MentorshipAnalyticsSnapshot, MentorAnalyticsSnapshot; lib/mentorship/analytics.ts (7 functions); platform analytics (6th tab in admin mentorship), mentor /dashboard/mentor/analytics, mentee /dashboard/mentee/engagements; cron mentorship-analytics-snapshot (01:00 IST); 5 M17_* outcome events. Final milestone before pilot; set seeker_pilot_open = true after build. See PHASE_M17_BUILD.md. |
| **M-14** — Platform Fee & Revenue Layer | ✅ Complete | MentorshipEscrow (pilotFeeWaived, mentorTierAtSigning, feeRate); EscrowTranche (platformFeePaise, mentorNetPaise); TrancheFeeRecord; MentorshipRevenueSnapshot; lib/escrow/fees.ts, revenue.ts; fee rate at release = live tier; transferToMentor gets mentorNetPaise; cron mentorship-revenue-snapshot (20:30 UTC); Revenue tab in admin; MentorFeeInfoCard; 4 M14_* outcome events. See PHASE_M14_BUILD.md. |
| **DS-1** — Design System & Homepage Visual Pass | ✅ Complete | Ascend design identity: warm parchment (#F7F6F1), grounded green (#16A34A), ink (#0F1A0F); Syne + DM Sans; grain texture; homepage (Hero, AscendLogotype, SearchBar, TickerStrip, Features, WhyAscend, Stats, CTA, Footer); shared UI (Button, Input, Card, Badge, SectionLabel, PageHeader, EmptyState); Navbar, AuthCard, 404, toasts. See DESIGN_SYSTEM_BUILD.md. |
| **DS-2** — Nav Restructure (Two States) | ✅ Complete | Navbar and layout for logged-in vs logged-out; link states and mobile behaviour. |
| **DS-3** — Feature Showcase Pages | ✅ Complete | Five feature pages (e.g. fit-score, resume-optimiser, salary-intelligence, career-graph, mentorship) with consistent layout and CTAs. |
| **DS-4** — Persona Selection Screen | ✅ Complete | One-time post-registration screen: UserPersona enum (ACTIVE_SEEKER, PASSIVE_SEEKER, EARLY_CAREER, RECRUITER); `/onboarding/persona` with 4 cards, Continue → dashboard; verify-email → persona redirect; dashboard guard when persona null; session includes persona. |
| **DS-5** — Legal Pages & Signup Consent | ✅ Complete | Legal pages (terms, privacy, cookies, etc.) and signup consent flows. |
| **DS-4B** — Persona Deepening | ✅ Complete | Post-persona context flow: `/onboarding/context` (Step 2 of 2) with persona-specific 3-question sets (ACTIVE_SEEKER, PASSIVE_SEEKER, EARLY_CAREER, RECRUITER); option cards & multi-select chips; GET/POST/PATCH `/api/user/career-context` (upsert, `completionScore`); Continue → dashboard, Skip for now → dashboard; dashboard guard only on missing persona (context optional). See PERSONA_ARCHITECTURE.md. |
| **Phase 21** — Global Multilingual & Market Expansion | 🔄 Rolled Back | Multilingual removed. Platform is English-only. Kept: User.preferredCurrency, lib/i18n/currency.ts (salary in preferred currency), /settings/currency, PWA manifest + /offline. Removed: next-intl, 7 locales, LanguageSwitcher, JD translation pipeline, SupportedLanguage, ParsedJDTranslation, preferredLanguage, preferredRegion. See PHASE21_ROLLBACK_BUILD.md. |
| **Phase 22** — Marketplace & Career Services | ✅ Complete | MarketplaceProvider, ResumeReviewOrder, MockInterviewBooking, CoachingSession, ProviderReview, CourseRecommendation, CourseClick, ProfileBadge; provider onboarding + admin queue; resume review / mock interview / coaching discovery, booking, payment (Razorpay), delivery, rate, dispute; course recommendations + skills gap links + affiliate click; certification badges (settings + profile); provider dashboard; admin marketplace (providers, orders, revenue, courses, badges) + refund; 7 Resend templates; 8 outcome events. See PHASE_22_BUILD.md. |
| **Phase 18** — B2B / Enterprise & API Platform | ✅ Complete | REST API v1 (jobs, applications, candidates, webhooks, bulk); ATS webhook ingestion; Enterprise plan; white-label careers; bulk import/export; developer portal; admin enterprise dashboard; 8 outcome events. See PHASE_18_BUILD.md. |
| **Phase 7, 8, 16B, 18, 20, 21, 22** | 🟡 Partial | Phase 7, 8, 16B, 18, 19, 20, **22** complete. Phase 21 rolled back (English-only). M-6, M-7, M-9, M-12, M-13, M-14, M-17 complete. Mentorship Track complete. |
| **Build (npm run build)** | ✅ Passes | M-7 complete. See PHASE_M7_BUILD.md, [Latest build status](#311-latest-build-status) below. |

#### 3.1.1 Latest build status

Build: `tsc --noEmit` passes. M-12 (Mentorship Circles) delivered; migration applied. If `npm run build` fails with `/_document` error, run `npm run rebuild`. M-14 (Platform Fee & Revenue Layer): live-tier fee at release, TrancheFeeRecord, MentorshipRevenueSnapshot, Revenue tab in admin, MentorFeeInfoCard. Phase 12 Pricing Restructure, M-17, M-6 Edit complete. See PHASE_M14_BUILD.md, PHASE_12_PRICING_RESTRUCTURE_BUILD.md.

**If build fails** with webpack/prerender errors (e.g. "Cannot read properties of undefined (reading 'call')", or "Cannot find module for page: /_document"), run `npm run rebuild` to clear stale `.next` cache and rebuild.

**Warnings (non-blocking):** `@next/next/no-img-element` and `react-hooks/exhaustive-deps` in several components (company, dashboard, profile sections).

### 3.2 Roadmap

```
Phase 0      Pre-Launch Data Layer (JD Ingestion)            ✅ Done
Phase 0B     Free JD Source Scripts (Kaggle, Adzuna, etc.)   ✅ Done
Phase 1      Auth & Onboarding                               ✅ Done
Pre-2        Infrastructure & AI Scaffolding                 ✅ Done
Phase 2      Job Seeker Profile                              ✅ Done
Phase 2A     Intelligent Resume Builder                      ✅ Done
Phase 3      Company Profiles                                ✅ Done
Phase 3B     Company Admin Dashboard Completion              ✅ Done
Phase 4      Job Post Creation & Listing                     ✅ Done
Phase 5      Job Search & Filters                            ✅ Done
Phase 5A     Profile Fit Score (JD Fit Score)                ✅ Done
Phase 6      Application System                              ✅ Done
Phase 6A     JD Resume Optimiser                             ✅ Done
Phase 7      Reviews & Ratings                               ✅ Done
Phase 8      Salary Insights                                 ✅ Done
Phase 9      Career Graph & Contextual Networking            ✅ Done
Phase 9B     Mentorship Layer                                ✅ Done
Phase 10     Dashboards (Seeker-First)                       ✅ Done
Phase 10B    Candidate Intelligence Dashboard                ✅ Done
M-1          Ascend Mentorship: Identity & Verification      ✅ Done
M-2          Mentor Profile & Transition Record              ✅ Done
M-3          Mentee Onboarding & Application Layer           ✅ Done
M-4          Matching Engine                                 ✅ Done
M-5          Contract Generation & Digital Signing           ✅ Done
M-6          Escrow & Payment Infrastructure                 ✅ Done
M-7          Meeting Room, Ascend Steno & Session Evidence   ✅ Done
M-8          Session Rhythm & Milestone Framework            ✅ Done
M-9          Dispute Resolution Engine                       ✅ Done
M-10         Outcome Verification & Attribution              ✅ Done
M-11         Mentor Reputation & Tier System                 ✅ Done
M-12         Mentorship Circles                              ✅ Done
M-13         Mentor Monetisation Unlock                      ✅ Done
M-14         Platform Fee & Revenue Layer                    ✅ Done
M-15         Legal Framework & Compliance                    ✅ Done
M-16         Admin & Ops Layer                               ✅ Done
M-17         Mentorship Analytics & Insights                 ✅ Done
Phase 11     AI Features                                     ✅ Done
Phase 12     Monetisation + Pricing Restructure              ✅ Done
Phase 13     Admin Panel (Lite)                              ✅ Done
Phase 14     SEO Optimizations                               ✅ Done
Phase 15     Mobile Responsiveness Polish                    ✅ Done
DS-1         Design System & Homepage Visual Pass            ✅ Done
DS-2         Nav Restructure (Two States)                    ✅ Done
DS-3         Feature Showcase Pages (5 pages)                ✅ Done
DS-4         Persona Selection Screen                        ✅ Done
DS-5         Legal Pages & Signup Consent                    ✅ Done
DS-4B        Persona Deepening (context questions)           ✅ Done
Phase 16     Data & Analytics Platform                       ✅ Done
Phase 16B    Recruiter Intelligence & Hiring Analytics       ✅ Done
Phase 17     Trust, Safety & Compliance                      ✅ Done
Phase 18     B2B / Enterprise & API Platform                 ✅ Done
Phase 18B    Internal Job Board & Employee Mobility          ✅ Done
Phase 19     Growth, Virality & Network Effects              ✅ Done
Phase 20     Platform Intelligence & Investor Metrics        ✅ Done
Phase 21     Global Multilingual & Market Expansion          🔄 Rolled Back
Phase 22     Marketplace & Career Services                   ✅ Done
```

---

## 4. Phase Details & Deliverables

### Phase 1: Auth & Onboarding

**Goal:** Secure sign-up/sign-in, role selection, and guided onboarding for Job Seekers and Recruiters.

| # | Task | Deliverables |
|---|------|--------------|
| 1.1 | Next.js 14 scaffold | App Router, TypeScript, Tailwind, ESLint, base layout |
| 1.2 | Prisma + PostgreSQL | `schema.prisma` with `User`, `Account`, `Session`, `VerificationToken`; migrations |
| 1.3 | NextAuth.js setup | Credentials + Google + LinkedIn providers; JWT/database session adapter |
| 1.4 | Email/password auth | Register, login, email verification (Resend/Nodemailer), password reset |
| 1.5 | OAuth | Google and LinkedIn sign-in; account linking |
| 1.6 | Role & profile stubs | `User.role` (JOB_SEEKER, RECRUITER, COMPANY_ADMIN, PLATFORM_ADMIN); `JobSeekerProfile`, `RecruiterProfile` minimal |
| 1.7 | Onboarding flows | Role selection → Job Seeker vs Recruiter onboarding (multi-step); profile completion % |
| 1.8 | 2FA (optional) | TOTP (e.g. speakeasy); backup codes; enable/disable in settings |
| 1.9 | Remember me / sessions | Persistent session config; logout everywhere |
| 1.10 | RBAC middleware | Protect routes by role; redirect unauthenticated/low-completion users |

**Routes:** `/auth/login`, `/auth/register`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`, `/onboarding`, `/api/auth/[...nextauth]`.

**Exit criteria:** User can register, verify email, log in (email + OAuth), complete onboarding, and land on role-specific home.

---

### Phase 2: Job Seeker Profile

**Goal:** Rich LinkedIn-style profile with all sections and resume handling.

| # | Task | Deliverables |
|---|------|--------------|
| 2.1 | Prisma schema | `JobSeekerProfile` and related: Experience, Education, Certification, Project, Award, Language, Volunteer, Publication; `Resume` (multiple); `UserSkill`, `Skill` |
| 2.2 | Profile UI sections | Personal info, headline, location, notice period, CTC, work mode, languages; About (rich text); Work Experience; Education; Certifications; Projects; Awards; Languages; Volunteer; Publications |
| 2.3 | Skills | Skill input with proficiency; endorsements (basic: store endorser IDs) |
| 2.4 | Resume upload | S3/Cloudinary; PDF/DOC ≤5MB; visibility (Public / Recruiters only / Private); last updated |
| 2.5 | Multiple resumes | CRUD; label (e.g. "Tech", "Management"); default resume for applications |
| 2.6 | AI resume builder | Generate PDF from profile data (e.g. react-pdf or server-side PDF) |
| 2.7 | Profile completion % | Calculated field; checklist UI; nudges and tooltips |
| 2.8 | Public profile page | `/profile/[username]`; visibility rules (Public / Connections / Recruiters / Private) |

**Routes:** `/profile/[username]`, `/profile/edit`, `/settings/privacy` (visibility toggles).

**Exit criteria:** Job seeker can complete all profile sections, upload/manage resumes, see completion %, and have a public profile that respects visibility.

---

### Phase 2A: Intelligent Resume Builder

**Goal:** Forward-focused, ATS-optimised resume builder driven by career intent. Build after Phase 2 (Job Seeker Profile).

**Philosophy:** The resume is built around where the candidate *wants* to go, not just where they have been. Every section supports the target role, industry, and career trajectory.

| # | Task | Deliverables |
|---|------|--------------|
| 2A.1 | Career Intent (Step 1) | "What role are you targeting?" (job title with autocomplete); "What industry?" (dropdown + custom); "What level?" (IC / Team Lead / Manager / Director / VP / C-Suite); "Primary career goal?" (short text); "Switching industries?" (Yes/No, from/to if Yes). Store as `CareerIntent` linked to user/profile. All resume generation filtered through this lens. |
| 2A.2 | Profile data mapping (Step 2) | Pull Work Experience, Education, Skills, Certifications, Projects, Awards; intelligently select/reframe what is RELEVANT to target role. Experience &gt;10 years: 1–2 lines unless highly relevant. Recent/relevant: achievement-focused bullets. |
| 2A.3 | AI content generation (Step 3) | Per work experience: reframe bullets for TARGET role; convert responsibility → achievement; strong action verbs; quantify (prompt user for numbers if missing); surface transferable skills for industry/role switches. |
| 2A.4 | Professional summary (AI) | Forward-focused: open with TARGET role, not current/past. 3–5 sentences; career goal + value prop. Regenerate (3 alternatives); manual edit. |
| 2A.5 | Skills section (AI-assisted) | Prioritise skills from job postings for target role (skills taxonomy); group: Core / Technical / Soft / Tools & Platforms. De-emphasise irrelevant; suggest missing: "Candidates for [Role] often list: X, Y, Z — do you have these?" |
| 2A.6 | ATS compliance engine | No tables, columns, text boxes, headers/footers; standard headings only; no images/graphs/icons; fonts Arial/Calibri/Times New Roman; output PDF + DOCX; date format Month Year – Month Year; contact in plain text at top; plain bullets. |
| 2A.7 | Keyword optimisation | Keyword bank from top 50 job postings for target role; present vs missing in resume; suggest natural integration; keyword coverage score: "Your resume contains X% of commonly required keywords for [Target Role]". |
| 2A.8 | ATS score panel | Live ATS score (0–100). Breakdown: Format & Parsability, Keyword Match, Completeness, Impact (achievement vs responsibility). Red (0–40) / Amber (41–70) / Green (71–100); actionable fix suggestions. |
| 2A.9 | Resume templates | 6 ATS-safe templates: Classic, Modern, Executive, Tech, Creative Professional, International. Section order by career level (e.g. entry: Education first; senior: Experience first). Export PDF + DOCX. |
| 2A.10 | Multiple resume versions | Up to 5 versions (Premium: unlimited). Each can have different CareerIntent; name (e.g. "Product Manager - SaaS"); last used / last updated; duplicate & edit. |
| 2A.11 | Prisma & API | `CareerIntent` (targetRole, targetIndustry, targetLevel, careerGoal, switchingIndustry, fromIndustry?, toIndustry?); `ResumeVersion` (name, careerIntentId, templateId, contentSnapshot, atsScore, lastUsed, lastUpdated). Link to `User`/`JobSeekerProfile`. |

**Routes:** `/resume`, `/resume/build`, `/resume/build/[versionId]`, `/resume/versions`, `/api/resume/generate`, `/api/resume/ats-score`, `/api/resume/export`.

**AI:** GPT-4o for content generation and summary variants; keyword bank from job postings (batch or cached). Store resume content/blobs for export.

**Exit criteria:** Candidate can set career intent, generate a forward-focused resume from profile, see ATS score and fixes, choose template, save multiple versions, and export PDF/DOCX.

---

### Phase 3: Company Profiles

**Goal:** Claimable company pages with overview, media, ratings, Q&A, and benefits.

| # | Task | Deliverables |
|---|------|--------------|
| 3.1 | Prisma schema | `Company`, `CompanyAdmin`, company media, benefits; `CompanyReview`, `CompanyQ&A`, `CompanyBenefit` |
| 3.2 | Company CRUD | Create/claim company; company admin assignment; verified badge (admin-set) |
| 3.3 | Overview | Name, logo, banner, industry, type, size, founded, HQ, website, social links, mission, about (rich text), specialties (tags) |
| 3.4 | Media | Office photos; culture video (YouTube embed); virtual tour link |
| 3.5 | Ratings & reviews | Overall + sub-ratings (Work-Life, Salary, Culture, Career, Management); "Recommend" %; CEO approval; trending badges (logic TBD) |
| 3.6 | Q&A | Questions and answers; upvote/downvote; company/employee can answer |
| 3.7 | Benefits | List benefits; optional user rating per benefit |
| 3.8 | Company discovery | Browse companies; filters (industry, size, rating); company card and detail page |

**Routes:** `/companies`, `/companies/[slug]`, `/companies/[slug]/reviews`, `/companies/[slug]/salaries`, `/companies/claim`, `/dashboard/company` (admin).

**Exit criteria:** Companies can be created/claimed, fully edited, and displayed with ratings, Q&A, and benefits; seekers can browse and view company pages.

---

### Phase 4: Job Post Creation & Listing

**Goal:** Recruiters can create full job posts; job listing and detail pages work.

| # | Task | Deliverables |
|---|------|--------------|
| 4.1 | Prisma schema | `JobPost` (title, description, type, work mode, locations[], salary, experience, education, skills, openings, deadline, easy apply, application URL, screening questions, tags, status); `JobPostSkill` (must-have vs nice-to-have) |
| 4.2 | Job post form | Rich text description; multi-location; salary range + visibility; skills (must/nice); screening questions; tags (Urgent, Featured, etc.) |
| 4.3 | Job listing page | List jobs (from DB); filters (phase 5); job cards (title, company, location, type, mode, salary/“Not disclosed”, date, applicants count, save button) |
| 4.4 | Job detail page | Full description; company snippet; apply CTA; share; report; “Similar jobs” (same company or same title/skills) |
| 4.5 | Recruiter permissions | Only recruiter/company admin can create/edit jobs for their company |
| 4.6 | Job lifecycle | Draft / Active / Paused / Closed; application deadline handling |

**Routes:** `/jobs`, `/jobs/[id]` (or slug), `/jobs/post-a-job`, `/dashboard/recruiter/jobs`.

**Exit criteria:** Recruiters can create and manage job posts; job list and detail pages render correctly.

---

### Phase 5: Job Search & Filters

**Goal:** Full-text and faceted search with saved searches and alerts.

| # | Task | Deliverables |
|---|------|--------------|
| 5.1 | Search backend | Typesense/Elasticsearch index for jobs (title, company, description, location, skills); sync on job create/update |
| 5.2 | Search API | Query + filters (location, radius, experience, salary, job type, work mode, date posted, company size, industry, department, easy apply, min rating); sort (relevance, date, salary, rating) |
| 5.3 | Search UI | Debounced search (300ms); filter panel; sort dropdown; pagination or infinite scroll |
| 5.4 | Saved searches | Save search + filters; list and delete |
| 5.5 | Job alerts | Create alert from saved search; frequency (immediate, daily, weekly); email job digest (Resend) |
| 5.6 | Search history | Store last N searches per user; “Jobs you may like” (simple: same keywords/skills) |
| 5.7 | Redis cache | Cache popular/search result sets (e.g. 5–15 min TTL) |

**Routes:** `/jobs` (search), `/jobs/saved-searches`, `/settings/job-alerts`; APIs: `GET /api/jobs/search`, `GET /api/jobs/suggestions`.

**Exit criteria:** Users can search jobs with full filters, save searches, and receive email alerts.

---

### Phase 5A: Profile Fit Score Mapped to JD (Fit Score)

**Goal:** Real-time "Your Fit Score" for the logged-in candidate on every job listing; multi-dimensional breakdown and improvement suggestions. Build after Phase 5 (Job Search & Filters).

**Philosophy:** Transparent, multi-dimensional score showing how well the profile matches a specific JD — and what to do to improve it.

| # | Task | Deliverables |
|---|------|--------------|
| 5A.1 | Fit score model (100 pts) | **Skills Match (30):** exact/adjacent/missing; "X/30 — You match N of M required skills". **Experience Match (25):** years, role relevance, industry. **Education Match (10):** degree level, field. **Location & Availability (10):** location, notice period, work mode. **Keyword & Language (15):** profile vs JD terminology. **Profile Completeness for role (10):** sections relevant to this JD. |
| 5A.2 | Scoring backend | Compute score per (user, jobPost); use profile + resume version (or default) vs JD. Embeddings (text-embedding-3-small) for skills/experience similarity; pgvector or Pinecone for storage. Cache score in Redis (e.g. 1h TTL) keyed by userId + jobId. |
| 5A.3 | Job card display | Compact: circular badge "X% Match"; colour Green (75–100) / Amber (50–74) / Red (&lt;50). "Top Match" badge for 85+; "Reach Role" for 40–60 (aspirational). |
| 5A.4 | Job detail page (expanded) | Full breakdown by category with bar charts; "What's working" (top 3 strengths); "What's holding you back" (top 3 gaps + fix suggestions); "Optimise Resume for this Job" CTA → JD Optimiser. |
| 5A.5 | Search & sort | Default sort by Fit Score (toggle to date/salary); filter "Show only jobs where I'm 70%+ match". "Dream Role" tag (manual, regardless of score). |
| 5A.6 | Fit score over time | Track score for saved jobs; notify when score changes after profile updates: "Your score for [Job at Company] went from 61% to 74% after you added AWS certification." Weekly digest: "You now match N more jobs at 75%+". |
| 5A.7 | Recruiter mirror view | Same logic in reverse: each applicant gets AI Match Score vs that JD; breakdown (strong/weak match); sort/filter applicants by score; "Best matches" at top. Score calculated per JD, not generic. |

**Routes:** Score computed via API used by job list and job detail; `/api/jobs/[id]/fit-score`; recruiter applicant list uses same scoring API.

**AI:** text-embedding-3-small for skills/experience/keyword similarity; optional GPT for "why" explanations. Store job + profile embeddings (pgvector/Pinecone); Redis cache for computed scores.

**Exit criteria:** Candidate sees fit score on job cards and detail, can sort/filter by fit, see breakdown and "Optimise for this job"; recruiters see applicant match score per JD; score updates as profile changes.

---

### Phase 6: Application System

**Goal:** Easy Apply, application tracking, and recruiter pipeline.

| # | Task | Deliverables |
|---|------|--------------|
| 6.1 | Prisma schema | `JobApplication` (job, seeker, status, answers to screening questions, resume snapshot, applied_at, timeline); application status enum |
| 6.2 | Easy Apply | One-click apply using profile + default resume; optional cover letter; submit screening answers |
| 6.3 | External apply | “Apply on company website” with redirect URL |
| 6.4 | Application confirmation | Email to candidate; optional in-app confirmation |
| 6.5 | Candidate dashboard | List applications; status (Applied → Viewed → Shortlisted → Interview → Offered → Rejected); notes; withdraw |
| 6.6 | Recruiter pipeline | Kanban: Applied → Screening → Interview → Offer → Hired/Rejected; bulk move; filters (experience, skills, location) |
| 6.7 | Match score | Algorithm or later AI: score applicant vs job (skills, experience, education); show % on card |
| 6.8 | Recruiter actions | View resume (PDF), add internal notes, send message (link to messaging), schedule interview (placeholder or calendar link) |
| 6.9 | Email templates | Status update emails (configurable templates) |

**Routes:** `/jobs/[id]/apply`, `/dashboard/applications`, `/dashboard/recruiter/jobs/[id]/applicants`; APIs for applications and pipeline.

**Exit criteria:** Candidates can apply (easy apply + external), track status, and withdraw; recruiters can manage pipeline and applicants.

---

### Phase 6A: Job Description Resume Optimiser

**Goal:** Reposition and reframe existing experience to align with a specific JD; no fabrication. Build after Phase 6 (Application System) and Phase 2A (Resume Builder).

**Philosophy:** Surface what's already there but buried or in the wrong language; never add skills/experience the candidate doesn't have.

| # | Task | Deliverables |
|---|------|--------------|
| 6A.1 | Input (Step 1) | Paste JD text OR job URL (scrape JD); select saved resume version to optimise; "Analyse & Optimise" action. |
| 6A.2 | JD analysis (Step 2) | Extract and show: role title & seniority; must-have vs good-to-have skills; key responsibilities; industry/domain keywords; JD tone (formal/startup/technical/creative); red flags (requirements candidate clearly doesn't meet — shown honestly). Cache in Redis TTL 24h (same JD not re-analysed). |
| 6A.3 | Gap analysis (Step 3) | Three columns: **JD requires** | **Your resume shows** | **Match** (✅ Strong / ⚠️ Partial / ❌ Not present). For ❌: if candidate has it but didn't list — "Do you have experience with [X]? If yes, tell us and we'll add it." If genuine gap — "Address in interview; don't overstate on resume." Never suggest adding what they don't have. |
| 6A.4 | Optimised resume (Step 4) | AI rewrites (candidate approves each): (a) **Summary:** open with JD terminology; 2–3 most relevant aspects; company/role name if appropriate. (b) **Work bullets:** reorder for JD relevance; rewrite with JD vocabulary; surface buried relevant achievements. (c) **Skills:** lead with JD-required; add only skills candidate confirmed. (d) **Section order:** reorder by what JD prioritises. |
| 6A.5 | Change review (Step 5) | Diff view (original vs optimised) per change; Accept / Reject / Edit per change; "Accept All" / "Reject All". Save approved version as new resume: "Product Manager - Nexara - Applied Jan 2026". |
| 6A.6 | Export & apply (Step 6) | Download optimised resume PDF/DOCX; option to attach this version when applying to that job; reminder: "This version was optimised for [Job] at [Company] — use only for this application." |
| 6A.7 | API & AI | JD parsing: GPT-4o structured JSON (skills, responsibilities, tone). Diff generation: text diff + GPT rewrites. Reuse embeddings for gap analysis. `OptimisedResume` or link ResumeVersion to JobApplication when optimised for that job. |

**Routes:** `/resume/optimise`, `/resume/optimise?jobId=…` (from Fit Score CTA); `/api/resume/optimise/analyse`, `/api/resume/optimise/generate`, `/api/resume/optimise/export`.

**AI:** GPT-4o for JD parsing (structured JSON), summary/bullet rewrites, and diff copy; cache JD analysis in Redis 24h.

**Exit criteria:** Candidate can paste JD or URL, see analysis and gap view, get optimised resume with diff review, save as new version, export, and attach to application for that job.

---

### Phase 7: Reviews & Ratings

**Goal:** Company and interview reviews, salary submissions, moderation.

| # | Task | Deliverables |
|---|------|--------------|
| 7.1 | Company reviews | Employment status, job title, location, dates; overall + sub-ratings; pros/cons; advice; recommend Y/N; CEO approval; anonymous flag |
| 7.2 | Interview reviews | Experience (pos/neut/neg), difficulty, offer Y/N; process description; sample questions; timeline |
| 7.3 | Salary data | Job title, experience, location; base + bonus + stock; employment type; anonymous; display ranges (median, 25th, 75th) by company/role/location |
| 7.4 | Review UIs | Submit review forms; company page review tab; interview review tab; salary tab with charts |
| 7.5 | Moderation | Admin queue for flagged reviews; company can flag (no delete); helpful upvotes |
| 7.6 | Rate limiting | Limit review submissions per user per company/time window |

**Routes:** `/companies/[slug]/reviews`, `/companies/[slug]/interviews`, `/companies/[slug]/salaries`; submit flows and mod queue in admin.

**Exit criteria:** Users can submit and view company and interview reviews and salary data; admins can moderate.

---

### Phase 8: Salary Insights

**Goal:** Browse and compare salaries; estimator and trends.

| # | Task | Deliverables |
|---|------|--------------|
| 8.1 | Salary browse | By job title, company, city, industry; filters and simple charts (median, percentiles) |
| 8.2 | Comparison tool | “Your salary vs market” (input role, exp, location vs aggregated data) |
| 8.3 | Salary estimator | Estimate pay from title, experience, location, skills (rule-based or model later) |
| 8.4 | Top payers | List top paying companies for a role |
| 8.5 | Cost of living | Optional: same role across cities (e.g. Mumbai vs Bangalore) with simple multipliers or external data |
| 8.6 | Premium gating | Basic insights free; advanced (e.g. percentiles, comparison) behind paywall (phase 12) |

**Routes:** `/salary`, `/salary/compare`, `/salary/estimator`, `/salary/by-company`, `/salary/by-role`.

**Exit criteria:** Users can browse salaries, compare, and use a basic estimator; premium tiers prepared.

---

### Phase 9: Career Graph & Contextual Networking (Done)

**Goal:** Career trajectory graph — connections (with type), company follow, context-anchored messaging, career signal feed (events only, no user posts). Recruiter cold outreach requires job attachment. See PHASE_9_BUILD.md.

| # | Task | Deliverables |
|---|------|--------------|
| 9.1 | Prisma schema | `Connection` (requester, recipient, status); `Follow` (company / user); `Post`, `PostReaction`, `Comment`; `Message`, `Conversation`, `MessageRequest` |
| 9.2 | Connections | Send/accept/decline/withdraw; 1st/2nd/3rd degree; “People you may know”; block/remove |
| 9.3 | Follow | Follow companies (notifications for jobs/updates); follow users (one-way); follower counts |
| 9.4 | Feed | Create post (text, image, doc, poll); like, comment, repost; tag people/companies; hashtags; feed API (connections + followed companies, paginated) |
| 9.5 | Feed algorithm | Initial: chronological by connection/follow; later: trending hashtags, “promoted” slot |
| 9.6 | Messaging | 1:1 chat (connections); message requests from non-connections (accept/decline); read receipts, typing; file/resume share |
| 9.7 | InMail-style | Recruiters message non-connections (limit by plan; phase 12) |
| 9.8 | Real-time | WebSockets or Pusher/Ably for typing and new messages; fallback polling if needed |

**Routes:** `/network`, `/network/connections`, `/network/feed`, `/messages`, `/messages/requests`; APIs for connections, feed, and messaging.

**Exit criteria:** Users can connect, follow, post, and message with basic real-time UX.

*Phase 9 was implemented as Career Graph & Contextual Networking (no posts; signals-only feed; connection types; recruiter job-attached messaging). See PHASE_9_BUILD.md.*

---

### Phase 9B: Mentorship Layer (Done)

**Goal:** Activate the mentorship layer on top of the Career Graph: mentor profiles, discovery, session booking, and outcome tracking. Seekers with EARLY_CAREER persona or `isSwitchingField` can find mentors who made the same transition. Mentors are existing users who opt in.

| # | Task | Deliverables |
|---|------|--------------|
| 9B.1 | Prisma schema | `MentorProfile`, `MentorAvailability`, `MentorSession`; enums `MentorTransition`, `MentorStyle`, `SessionFormat`, `SessionStatus`, `MentorFocusArea`; NotificationType + SignalType for mentor session events. |
| 9B.2 | Become mentor | `/mentorship/become-mentor` 3-step flow (transition story, what you offer, availability); POST `/api/mentorship/become-mentor`; MENTOR_PROFILE_CREATED signal. |
| 9B.3 | Discovery | `/mentorship` with filter sidebar and mentor card grid; GET `/api/mentorship/mentors` with match score (lib/mentorship/match.ts); pre-filtering from UserCareerContext. |
| 9B.4 | Mentor profile & request | `/mentorship/[mentorId]`; request-session side panel (sessionGoal, format); POST `/api/mentorship/sessions`; notifications to mentor/mentee. |
| 9B.5 | Session lifecycle | PATCH sessions (accept, decline, schedule, complete, cancel); POST review; MENTOR_SESSION_COMPLETED signal; recalc mentor averageRating. |
| 9B.6 | Dashboard & nav | `/mentorship/dashboard` (mentor + mentee tabs); MentorMatchCard on seeker dashboard when EARLY_CAREER or isSwitchingField; Discover → Mentorship; My Career → Mentor Dashboard (if mentor). |
| 9B.7 | Feature page | `/features/mentorship` uses GET `/api/mentorship/mentors/featured` for top 3 mentors. |

**Routes:** `/mentorship`, `/mentorship/become-mentor`, `/mentorship/[mentorId]`, `/mentorship/dashboard`; APIs under `/api/mentorship/*`.

**Exit criteria:** Migration applied; become-mentor creates profile + availability; discovery loads with filters and match score; request session and status transitions work; notifications and signals fire; MentorMatchCard and nav links in place. See PHASE_9B_BUILD.md.

### M-1: Ascend Mentorship — Identity & Verification (Done)

**Goal:** Zero-trust verification for mentors. No mentor is discoverable until independently verified. Verification is a permanent, auditable record.

**Deliverables:** Prisma enums `VerificationStatus`, `VerificationDocumentType`, `VerificationDecision`; models `MentorVerification`, `VerificationDocument`, `VerificationAuditLog`; `MentorProfile.verificationStatus`, `isDiscoverable`, `verification`; `lib/mentorship/verification-codes.ts`. APIs: POST `/api/mentorship/verification/upload` (multipart, 5MB, PDF/JPG/PNG), POST submit, PATCH linkedin, GET status; GET/POST admin verification queue and decide; cron `GET /api/cron/mentor-reverification`. Mentor page `/mentorship/verify` (status banner, document upload, LinkedIn URL, submit, audit timeline); admin `/dashboard/admin/mentorship/verification` (tabs Pending / Needs Info / Verified / Rejected, SLA indicator, review sheet with decision form). Discovery gate: `isDiscoverable: true` and exclude self in GET `/api/mentorship/mentors`. Dashboard verification widget on mentor tab. Role change on mentor profile sets REVERIFICATION_REQUIRED. All admin decisions logged to VerificationAuditLog and AuditLog.

**Exit checklist:** See PHASE_M1_BUILD.md.

### M-2: Ascend Mentorship — Mentor Profile & Transition Record (Done)

**Goal:** Structured mentor profile and transition record for matching. Verified career story (from/to role, company type, industry, city; duration; key factors; mentor statements); capacity (max mentees, engagement length, frequency, availability windows); focus areas and geography. Not discoverable until admin verifies and, if M-2 profile exists, sets `isPublic`.

**Deliverables:** Prisma enums and extended `MentorProfile`; `AvailabilityWindow`; `lib/mentorship/profile.ts` (Zod); GET/POST/PATCH profile, PUT availability, GET complete, GET public by userId. Six-step become-a-mentor flow at `/mentorship/become-a-mentor`; mentor dashboard at `/dashboard/mentor` (verification widget, completeness widget, profile card, capacity, upcoming sessions placeholder); public profile `/mentors/[userId]` (only if public + verified). Admin: on verification approve, set `isPublic` when mentor has full M-2 profile; Resend emails (profile received, approved, more-info, rejected). Seeker nav: "Become a Mentor" / "Mentor Dashboard".

**Exit checklist:** See PHASE_M2_BUILD.md.

---

### M-3: Ascend Mentorship — Mentee Onboarding & Application Layer (Done)

**Goal:** Mentees earn access to mentors via readiness gates; curated discovery (max 3 matches with plain-language reasons); structured application flow; max 2 simultaneous applications; mentor accept/decline/ask one question; 5-day response SLA with BullMQ expiry.

**Deliverables:** Prisma `MentorApplication`, `MenteeReadinessCheck`, `MentorApplicationStatus`; `lib/mentorship/readiness.ts`, `discover.ts`, `validate.ts`; APIs: readiness GET/PATCH, discover GET, applications GET/POST, applications/[id] GET/PATCH, respond POST, expire POST, inbox GET; BullMQ mentorship-expiry worker; pages `/mentorship` (hub with ReadinessGate + match cards), `/mentorship/apply/[mentorUserId]`, `/mentorship/applications`; components ReadinessGate, MentorMatchCardM3, ApplicationForm, ApplicationCard, MentorApplicationInbox, WordCountTextarea; 7 Resend email templates; MentorshipWidget on seeker dashboard; MentorApplicationInbox on mentor dashboard. See PHASE_M3_BUILD.md.

**Exit checklist:** See PHASE_M3_BUILD.md.

---

### M-5: Ascend Mentorship — Contract Generation & Digital Signing (Done)

**Goal:** Every accepted mentorship engagement becomes a legally binding document before any session. No engagement is active without both parties' OTP signatures. No money moves until the contract is ACTIVE.

**Deliverables:** Prisma `ContractStatus` enum, `MentorshipContract`, `ContractSignature`; `MentorApplication.contract` relation; `lib/mentorship/contract.ts` (generateContractContent, createContract, requestOTP, verifyOTPAndSign, generateContractPDF, verifyContractIntegrity, expireUnsignedContracts); `lib/mentorship/contract-types.ts` and clause text; contract PDF template + Playwright/pdf-lib fallback; BullMQ `contract-pdf` queue and worker; APIs: POST contracts/generate (internal), GET/POST contracts/[id], request-otp, sign, download; GET /api/cron/expire-unsigned-contracts (hourly); integration in applications respond ACCEPT → createContract; page `/mentorship/contracts/[contractId]` (all states, scroll gate, OTP modal); ContractOTPModal; ContractsAwaitingSignatureWidget on mentor dashboard; contract status banner on mentee hub; 8 Resend email templates; 7 analytics events. See PHASE_M5_BUILD.md.

**Exit checklist:** See PHASE_M5_BUILD.md.

---

### Phase 10: Dashboards (Seeker-First) — ✅ Complete

**Goal:** Role-specific dashboards with key metrics and actions.

**Implemented:** Notification model + API + NotificationCentre; GET dashboard/seeker | recruiter | admin; seeker dashboard (profile completion, application stats, recent applications, saved jobs, alerts, optimised resumes); recruiter + admin dashboards; profile views + notifications wired (application status, resume optimised, profile view). See **PHASE_10_BUILD.md**.

| # | Task | Deliverables |
|---|------|--------------|
| 10.1 | Job Seeker dashboard | Profile completion; recommended jobs; recent applications; profile views; recruiter search appearances; saved jobs; job alerts; connection requests; notifications |
| 10.2 | Recruiter dashboard | Active jobs + applicant counts; pipeline summary; shortlist; interview calendar; job performance (views, applications, conversion); credits (for talent search); plan usage |
| 10.3 | Company admin dashboard | All company jobs; team (recruiters); company profile edit; reviews overview; analytics (views, followers, job clicks) |
| 10.4 | Platform admin dashboard | Users, companies, jobs counts; revenue/subscription metrics; review mod queue; flagged content; user reports/bans; platform analytics (DAU, MAU, top searches) |
| 10.5 | Notification center | Bell icon; in-app list; mark read; link to relevant page |
| 10.6 | Push (optional) | Browser push for key events (e.g. new message, application update) |

**Routes:** `/dashboard` (redirect by role), `/dashboard/seeker`, `/dashboard/recruiter`, `/dashboard/company`, `/dashboard/admin`; notification API and UI.

**Exit criteria:** All four roles have a dashboard with relevant KPIs and quick actions; notifications work in-app.

---

### Phase 11: AI Features — ✅ Complete

**Goal:** Cover letter generator, interview question generator, profile strength analyser, smart job recommendations, profile-based salary prediction. Match score and skill gap already in Phase 5A and 10B.

| # | Task | Deliverables |
|---|------|--------------|
| 11.1 | AI Job Match Score | Score job vs profile (skills, experience, location); show on job cards and detail (0–100%) |
| 11.2 | Resume Analyzer | Upload JD + resume; gap analysis and improvement tips (e.g. OpenAI/Claude) |
| 11.3 | Cover Letter Generator | Per-application cover letter from profile + JD |
| 11.4 | Profile Optimizer | Suggestions for headline, summary, skills (AI or rules) |
| 11.5 | Smart recommendations | “Jobs you may like” and “Recommended for you” using match score + behavior |
| 11.6 | Interview questions | Generate likely questions from JD |
| 11.7 | Salary prediction | Predict salary from profile (optional model or rules) |
| 11.8 | Skill gap | Compare profile skills to trending job requirements |

**Implemented:** Cover letter (BullMQ `cover-letter`, `CoverLetter` model, apply flow + attach); interview prep (BullMQ `interview-prep`, `InterviewPrep` model, `/jobs/[slug]/interview-prep` status-gated); profile optimiser (BullMQ `profile-optimise`, `ProfileOptimiserResult`, dashboard card, premium gate); smart recommendations (`GET /api/jobs/recommended`, `JobDismissal`, 6h cache); salary prediction (extended `computeMarketValue` in lib/intelligence/candidate.ts). Feature flags, rate limits, outcome events. See **PHASE_11_BUILD.md**.

---

### Phase 12: Monetisation (Multi-Gateway) — ✅ Complete

**Goal:** Subscriptions and one-time purchases; enforce limits via payment abstraction (Razorpay for INR, Stripe for USD).

**Implemented:** See **PHASE_12_PLAN.md** for full build summary.

| # | Task | Deliverables |
|---|------|--------------|
| 12.1 | Multi-gateway setup | Razorpay (INR): orders, subscriptions, webhooks. Stripe (USD): PaymentIntent, subscriptions, webhooks. Plan/price IDs in env. |
| 12.2 | Payment abstraction | `lib/payments`: types, razorpay, stripe, index; createOrder, createSubscription, verify, refund by currency. |
| 12.3 | Subscription & limits | UserSubscription, CompanySubscription; PLAN_LIMITS (all 6 plans); getLimits, canUseFeature, checkJobPostLimit; subscribe/cancel-subscription APIs. |
| 12.4 | Recruiter limits | activeJobPosts, resumeDbViewsPerMonth, featuredListingsPerMonth, teamSeats, candidateFitScores by plan; job post creation gated (402). |
| 12.5 | Job boosts | JobBoost model; POST /api/jobs/[id]/boost; standard/featured/urgent pricing; Razorpay checkout; verify → create PaymentEvent + JobBoost; cron deactivate-expired-boosts. |
| 12.6 | Resume unlocks | ResumeUnlock model; create-order + verify for pay-per-unlock (Starter); ₹999 per 10 unlocks. |
| 12.7 | Billing UI | /dashboard/billing (plan, history), /dashboard/billing/upgrade, /dashboard/recruiter/jobs/[id]/boost; RazorpayCheckout, StripeCheckout, BoostPurchaseForm. |
| 12.8 | Gates wired | Resume optimiser (optimiserSessionsPerMonth, 402); fit-score (fitScoreBreakdown — free gets score only); job post limit (402). SEEKER_PILOT_OPEN bypass. |

**Routes:** `/dashboard/billing`, `/dashboard/billing/upgrade`, `/dashboard/recruiter/jobs/[id]/boost`; `/api/payments/*`, `/api/webhooks/razorpay`, `/api/webhooks/stripe`, `/api/jobs/[id]/boost`, `/api/cron/deactivate-expired-boosts`.

**Exit criteria:** Users can subscribe and purchase boosts; limits enforced server-side; billing page and webhooks idempotent; Enterprise → contact sales.

---

### Phase 13: Admin Panel

**Goal:** Platform admin can manage users, content, and platform config.

| # | Task | Deliverables |
|---|------|--------------|
| 13.1 | Admin auth | Only `PLATFORM_ADMIN`; middleware and layout guard |
| 13.2 | User management | List users; filter by role; ban/unban; impersonate (optional); audit log for admin actions |
| 13.3 | Company management | Verify company; suspend; edit if needed |
| 13.4 | Content moderation | Review queue (reviews, interviews); flagged jobs and posts; take-down or warn |
| 13.5 | Reports | User reports (jobs, companies, profiles, messages); resolve or dismiss |
| 13.6 | Platform config | Feature flags; email templates; rate limits (config values) |
| 13.7 | Analytics | DAU/MAU; top searches; top companies; revenue; subscription stats |

**Routes:** `/dashboard/admin/*` (users, companies, moderation, reports, settings, analytics).

**Exit criteria:** Admins can perform all critical moderation and config actions safely.

---

### Phase 14: SEO Optimizations

**Goal:** Discoverability and rich results for jobs and companies.

| # | Task | Deliverables |
|---|------|--------------|
| 14.1 | Job URLs | Slug: `/jobs/[slug]-[company]-[id]`; canonical for aggregated vs platform jobs |
| 14.2 | SSG/ISR | Static or ISR for job list, job detail, company pages where appropriate |
| 14.3 | JSON-LD | Job posting structured data (Google for Jobs); Organization for companies |
| 14.4 | Meta tags | Dynamic title/description per job, company, salary page; Open Graph and Twitter Cards |
| 14.5 | Sitemap | Auto-generated sitemap.xml (jobs, companies, static pages) |
| 14.6 | Robots | Allow/disallow for admin and private areas |

**Exit criteria:** Key pages have correct meta, JSON-LD, and sitemap; Google Search Console ready.

---

### Phase 15: Mobile Responsiveness Polish

**Goal:** Excellent mobile UX and accessibility.

| # | Task | Deliverables |
|---|------|--------------|
| 15.1 | Breakpoints | All main flows work on mobile/tablet/desktop; sticky bottom nav: Home, Jobs, Network, Messages, Profile |
| 15.2 | Job browse mobile | Cards optimized; swipe save/skip (optional); filters as sheet/drawer |
| 15.3 | Apply flow | Apply in under ~60 seconds on mobile; minimal steps |
| 15.4 | Touch targets | Buttons and links ≥44px; spacing and tap areas |
| 15.5 | Accessibility | ARIA labels; keyboard nav; focus order; screen reader testing; WCAG 2.1 AA where feasible |
| 15.6 | Dark mode | Toggle; system preference default; persisted |
| 15.7 | Loading & errors | Skeleton loaders; error boundaries; retry and friendly messages |
| 15.8 | i18n | English + Hindi; language switcher; RTL-ready if needed later |

**Exit criteria:** Core flows are mobile-first, accessible, and support dark mode and i18n.

---

### Design System (DS) Phases DS-1–DS-5

Design System work runs alongside the main phase roadmap. All five DS phases are complete.

| Phase | Goal | Deliverables |
|-------|------|---------------|
| **DS-1** | Design System & Homepage Visual Pass | Ascend identity (parchment, green, ink); Syne + DM Sans; grain; homepage sections (Hero, AscendLogotype, SearchBar, TickerStrip, Features, WhyAscend, Stats, CTA, Footer); shared UI (Button, Input, Card, Badge, SectionLabel, PageHeader, EmptyState); Navbar, AuthCard, 404, toasts. See DESIGN_SYSTEM_BUILD.md. |
| **DS-2** | Nav Restructure (Two States) | Navbar and layout behaviour for logged-in vs logged-out; link states and mobile. |
| **DS-3** | Feature Showcase Pages | Five feature pages (fit-score, resume-optimiser, salary-intelligence, career-graph, mentorship) with consistent layout and CTAs. |
| **DS-4** | Persona Selection Screen | One-time post-registration screen: `UserPersona` enum; `/onboarding/persona` (4 cards, 2×2 grid); PATCH `/api/user/persona`; verify-email → persona redirect; dashboard guard when `user.persona` null; session includes persona; `?from=` preselect. |
| **DS-5** | Legal Pages & Signup Consent | Legal pages (terms, privacy, cookies, etc.) and signup consent flows. |
| **DS-4B** | Persona Deepening | ✅ Complete. `/onboarding/context` (Step 2 of 2) with persona-specific 3-question sets; option cards and multi-select chips (locations, recruiter roles); GET/POST/PATCH `/api/user/career-context` (upsert, returns `completionScore`); Continue → dashboard, Skip for now → dashboard; dashboard blocks only when `user.persona` null. Full model: **PERSONA_ARCHITECTURE.md**. |

**Routes:** `/onboarding/persona`, `/onboarding/context`, `/api/user/persona`, `/api/user/career-context` (GET, POST, PATCH); legal under `/legal/*`. After persona save, redirect to `/onboarding/context`; after context submit or skip, redirect to `/dashboard`.

---

### Phase 0: Pre-Launch Data Layer (JD Ingestion)

**Goal:** Eliminate the AI cold-start problem by building and running a JD ingestion pipeline before go-to-market. Every AI feature — resume builder keyword banks, fit score vector store, JD optimiser prompt quality, salary estimator — is pre-trained on real job market data before the first user signs up.

**Philosophy:** You don't need users to train the AI layer — you need data. JDs are publicly available at scale. Pre-populating keyword banks, skill taxonomies, embeddings, and salary corpus means day-one users get a genuinely intelligent experience. The ingested corpus also powers the JD Library — a user-facing, SEO-indexed feature that turns training data into a product.

**Target before launch:** 50,000+ JDs · 200+ distinct role titles · 15+ Indian cities · 10+ industries.

| # | Task | Deliverables |
|---|------|--------------|
| 0.1 | Scraper | `scripts/ingestion/scraper.ts` — fetch raw JD HTML/text from public job boards (Naukri, LinkedIn, Indeed, Foundit, company careers pages); rate-limit-safe; configurable source list |
| 0.2 | Deduplication | SHA-256 hash of raw JD text; skip if already in `RawJD` table; store: raw text, source URL, scraped_at |
| 0.3 | GPT-4o parser | `scripts/ingestion/parser.ts` — structured JSON extraction per JD: `{ title, seniority, industry, skills: { mustHave[], niceToHave[] }, responsibilities[], keywords[], salaryMin?, salaryMax?, tone, companySize?, location, workMode }`; prompt in `lib/ai/prompts/jd-parse.ts` |
| 0.4 | Normaliser | `scripts/ingestion/normalizer.ts` — standardise role titles (e.g. "Sr. PM" → "Senior Product Manager"), skill names, location strings, seniority levels; output to `ParsedJD` table |
| 0.5 | Keyword bank generation | Aggregate `ParsedJD.keywords` by role + seniority + industry; compute frequency weights; output to `lib/data/keywords-by-role.ts` (auto-generated, committed to repo); replaces manual seed |
| 0.6 | Skills taxonomy generation | Aggregate `ParsedJD.skills` by role; compute co-occurrence; output to `lib/data/skills-taxonomy.ts`; replaces manual seed in Phase 2A |
| 0.7 | Vector store pre-population | Generate `text-embedding-3-small` embeddings for each `ParsedJD`; store in pgvector (`JDEmbedding` table) or Pinecone; enables fit score cold start on day one |
| 0.8 | Salary corpus | Extract salary ranges from JDs that disclose compensation; store in `JDSalarySignal` table (role, seniority, location, min, max, currency); feeds Phase 8 salary estimator baseline |
| 0.9 | Reprocessing pipeline | `scripts/ingestion/reprocess.ts` — re-parse all stored `RawJD` records against latest prompt version without re-scraping; run when prompts improve |
| 0.10 | JD Library (user-facing) | `/insights/jd-library` — browsable, SEO-indexed page: "What do companies typically ask for in a [Role]?"; aggregated skills, responsibilities, keywords per role; updates nightly from `ParsedJD`; drives organic SEO traffic |
| 0.11 | Admin ingestion dashboard | `/dashboard/admin/ingestion` — total JDs ingested, by source, by role, by date; reprocess trigger; gap report ("roles with < 100 JDs") |

**Prisma models:**
- `RawJD` — id, sourceUrl (unique), rawText, hash (unique), scrapedAt, parsedAt?
- `ParsedJD` — id, rawJdId (FK), title, seniority, industry, location, workMode, skills (Json), keywords (String[]), responsibilities (String[]), salaryMin?, salaryMax?, tone, parsedAt, promptVersion
- `JDEmbedding` — id, parsedJdId (FK), embedding (vector/Json), model, createdAt
- `JDSalarySignal` — id, parsedJdId (FK), role, seniority, location, salaryMin, salaryMax, currency

**Scripts (package.json):**
- `"ingest:scrape"` — run scraper for all configured sources
- `"ingest:parse"` — parse all unparsed RawJDs
- `"ingest:embed"` — generate embeddings for all unembedded ParsedJDs
- `"ingest:reprocess"` — reprocess all RawJDs with latest prompt
- `"ingest:all"` — scrape → parse → embed in sequence

**Routes:**
- `/insights/jd-library` — public, SEO-indexed JD insights
- `/insights/jd-library/[role-slug]` — per-role breakdown
- `/dashboard/admin/ingestion` — admin ingestion stats

**Key constraints:**
- All scraping must be rate-limited and respectful of robots.txt
- GPT-4o calls go through BullMQ queue (`jd-parse` queue); never synchronous
- All prompt strings in `lib/ai/prompts/jd-parse.ts`; no inline strings
- Reprocessing never re-scrapes; only re-parses stored raw text
- Voice-to-profile deferred to a future phase

**Exit criteria:**
- [ ] 50,000+ JDs ingested and parsed
- [ ] `keywords-by-role.ts` and `skills-taxonomy.ts` auto-generated and committed
- [ ] Vector store populated; fit score returns non-null on day one
- [ ] Salary corpus covers 20+ roles across 10+ cities
- [ ] JD Library live and indexed by Google Search Console
- [ ] Reprocess pipeline tested end-to-end

### Phase 0B: Free JD Source Scripts

**Goal:** Feed the Phase 0 pipeline with 50,000+ Indian JDs at zero cost via five free sources: Kaggle datasets, Adzuna India API, Naukri RSS, company careers pages (Playwright), and RemoteOK API. All output goes into `RawJD` with the same deduplication (SHA-256 hash); downstream parse/embed/taxonomy unchanged.

**Deliverables:** `RawJD.source` field (default `manual`); shared `upsertRawJD()` helper in `scripts/ingestion/lib/upsert-raw-jd.ts`; source scripts: `ingest:kaggle` (CSV with naukri/linkedin/indeed/generic formats), `ingest:adzuna`, `ingest:rss`, `ingest:careers`, `ingest:remoteok`; `ingest:sources` and `ingest:all`; `docs/SOURCES.md` (registry, ToS, rate limits). See **PHASE_0B_BUILD.md**.

---

### Phase 3B: Company Admin Dashboard Completion

**Goal:** Complete all pending Phase 3 items. Phase 3 shipped the company overview, discovery, CRUD, and claim flow. This phase completes the interactive layer: reviews, interview reviews, Q&A, benefits admin UI, salary stub, company admin dashboard, and rate limiting.

| # | Task | Deliverables |
|---|------|--------------|
| 3B.1 | Reviews (submit + list) | Submit review form (`/companies/[slug]/reviews/new`); list APPROVED reviews publicly (sort: recent/helpful/rating); one review per user per company enforced |
| 3B.2 | Review interactions | Helpful vote (thumbs up/down); flag review; company admin approve/flag in dashboard |
| 3B.3 | Interview reviews | Submit form (`/companies/[slug]/interviews/new`): job title, experience (pos/neut/neg), difficulty, got offer, process description, sample questions (up to 10), duration, anonymous; list APPROVED publicly |
| 3B.4 | Q&A | Ask question (auth required); company admin answer; upvote/downvote; sort by most upvoted / most recent |
| 3B.5 | Benefits admin UI | Company admin: add benefit (label + emoji icon), remove, reorder; display on overview tab with avg rating |
| 3B.6 | Salary stub | Submit salary report (`/companies/[slug]/salaries/new`): job title, experience years, location, employment type, base, bonus, stock, anonymous; display aggregate (median, 25th/75th percentile by job title) on `/companies/[slug]/salaries` |
| 3B.7 | Company admin dashboard | `/dashboard/company`: tabs — Overview (stats: reviews, avg rating, followers stub, job views); Edit Profile (full form with rich text about); Media (drag-reorder, upload, delete); Benefits (add/remove/reorder); Reviews (all statuses: approve/flag); Team (list admins + invite stub) |
| 3B.8 | Rate limiting | Max 1 review per user per company (enforced in API); max 1 interview review per user per company per role; Redis-backed rate limiter on submit endpoints |

**Routes:** All `/companies/[slug]/reviews`, `/interviews`, `/qa`, `/salaries`, `/benefits` routes (GET + POST); `/dashboard/company` full implementation.

**Exit criteria:**
- [ ] Reviews: submit, list (APPROVED only public), vote, flag
- [ ] Interview reviews: submit and list
- [ ] Q&A: ask, answer (company admin only), vote
- [ ] Benefits: admin add/remove; avg rating displayed on overview
- [ ] Salary stub: submit + aggregate display
- [ ] Company admin dashboard: all 6 tabs functional
- [ ] Rate limiting on review/interview submission

---

### Phase 10B: Candidate Intelligence Dashboard

**Goal:** Turn a job seeker's platform activity and market data into a personalised career intelligence layer — driving premium conversion, daily active usage, and measurable outcomes for the acquisition narrative.

| # | Task | Deliverables |
|---|------|--------------|
| 10B.1 | Market Value card | Estimated salary range for the candidate based on their profile (title, experience, skills, location) vs current JD corpus + Phase 8 salary data; "You are estimated to be worth ₹X–₹Y in the current market"; refreshed weekly |
| 10B.2 | Profile Visibility Score | How often the profile appears in recruiter search results vs similar profiles on the platform; trend (up/down vs last week); tips to improve visibility |
| 10B.3 | Skills Gap Report | Candidate's current skills vs top 50 JDs for their target role (from CareerIntent); "You have X of Y commonly required skills"; missing skills ranked by frequency; "Learn [skill]" → course recommendation (Phase 22) |
| 10B.4 | Application Performance | Response rate %; view-to-interview ratio; avg time-to-response; benchmarked against platform average for same role/location; "Your response rate is above/below average for [Role] applications" |
| 10B.5 | Career Trajectory Insights | Anonymised aggregate: "Professionals who moved from [current role] to [target role] typically had X years experience and these 3 skills" (derived from platform profile data over time) |
| 10B.6 | Best time to apply | Day-of-week and time-of-day patterns when applications to similar roles received fastest recruiter responses; shown as a simple heatmap or tip card |
| 10B.7 | Weekly career digest email | Every Monday: personalised summary — market value update, new jobs matching fit score 75%+, skills gap delta, application performance; opt-out in settings |

**Routes:** `/dashboard/seeker/intelligence`; API: `GET /api/intelligence/market-value`, `GET /api/intelligence/visibility`, `GET /api/intelligence/skills-gap`, `GET /api/intelligence/application-stats`.

**AI/data:** Market value from JDSalarySignal (Phase 0) + Phase 8 salary data. Skills gap from ParsedJD keyword/skill aggregates. Application stats from JobApplication table. Career trajectory from anonymised aggregate queries on JobSeekerProfile + Experience.

**Exit criteria:**
- [ ] All 6 intelligence cards render with real data (not stubs)
- [ ] Weekly digest email sends on Monday with personalised content
- [x] Skills gap links to course recommendations (Phase 22: "Learn [skill]" → `/marketplace/courses?skill=...`)
- [ ] All metrics benchmarked against platform aggregate (not shown in isolation)

---

### Phase 16: Data & Analytics Platform

**Goal:** Internal PLATFORM_ADMIN analytics dashboard for pilot decision-making: persona cohort analytics, funnel (registration → persona → context → first action → return), feature usage by persona, seeker journey, and platform health.

**Deliverables:** Prisma `AnalyticsEvent` and `DailyMetricSnapshot`; `lib/analytics/track.ts` with `track()` and `EVENTS`; event tracking wired into register, persona, context, job view, application, fit score, mentorship routes; cron `GET /api/cron/daily-snapshot` (midnight IST); APIs: `GET /api/admin/analytics/overview|funnel|personas|features|retention` (PLATFORM_ADMIN only); `/dashboard/admin/analytics` with tabs Overview, Funnel, Personas, Platform Health; recharts components (OverviewLineChart, PersonaDonut, FunnelChart, PersonaCard, FeatureUsageTable); admin nav Analytics link; seed script `scripts/seed-analytics.ts` for 30 days of snapshot data. See **PHASE_16_BUILD.md**.

**Exit criteria:** Migration applied; track() wired; daily snapshot cron runs; all four analytics API routes return correct shapes; analytics page loads for PLATFORM_ADMIN and redirects others; all four tabs render; seed populates 30 days; no console errors.

---

### Phase 16B: Recruiter Intelligence & Hiring Analytics

**Goal:** Give recruiters a data layer that makes Ascend competitive with dedicated ATS tools, justifies enterprise pricing, and dramatically increases switching cost once a team is using it.

| # | Task | Deliverables |
|---|------|--------------|
| 16B.1 | Time-to-hire analytics | Per role, per company, per recruiter: avg days from job posted → hired; trend over time; benchmark vs industry (from platform aggregate) |
| 16B.2 | Funnel drop-off | Per job: Applied → Viewed → Shortlisted → Interview → Offer → Hired; drop-off % at each stage; "68% of applicants were never viewed — consider updating the JD" |
| 16B.3 | Competitive benchmarking | "Your [Role] job gets 31% fewer applicants than similar roles on Ascend"; root cause suggestions: salary range, location, requirement count, work mode |
| 16B.4 | Source attribution | When Phase 18 ATS integrations are live: which source (Ascend / Naukri import / LinkedIn import / direct) produced hired candidates; cost-per-hire by source |
| 16B.5 | AI score explainability | Per applicant on recruiter pipeline: "Why 78%?" — breakdown shown to recruiter: Skills Match X/30, Experience Match Y/25, etc.; not just the number |
| 16B.6 | Hiring team collaboration | Internal notes with @mention; interview scorecard per candidate per interviewer (rating 1–5 + notes per dimension: Technical / Communication / Culture / Problem Solving); visible to all team members on that job |
| 16B.7 | D&I metrics | Opt-in: anonymised gender, location, education distribution in applicant pool vs shortlisted vs hired; flag significant drop-off between stages |

**Routes:** `/dashboard/recruiter/intelligence`; APIs under `/api/recruiter/intelligence/*`.

**Exit criteria:**
- [x] Time-to-hire and funnel analytics render with real data
- [x] Competitive benchmarking shows meaningful comparisons (requires sufficient platform job volume)
- [x] AI score explainability shown on every applicant card in recruiter pipeline
- [x] Interview scorecards: create, fill, view per candidate
- [x] D&I metrics dashboard (opt-in toggle; anonymised only)

---

### Phase 17: Trust, Safety & Compliance

**Goal:** Close the Zero Trust audit gap (Bug 19): extend audit logging to auth, data access, mutation, payment, mentorship, and compliance; add content reporting, GDPR/DPDP data requests, and admin Trust & Safety tooling. Required before public launch.

**Status: ✅ Complete** — Pilot gate done. Parts 1–9 delivered.

#### Delivered (Parts 1–3)

- **Schema & audit:** Extended `AuditLog` (category, severity, actorIp, actorAgent, previousState, newState, success, errorCode); `SecurityEvent`, `UserReport`, `DataRequest` models; `logAudit()`, `logSecurityEvent()`, `logAdminAction()`; audit wired to auth (login, OAuth, verify-email, reset-password), resume/contract download, job create, application submit, review submit, contract generate/sign.
- **Reporting:** POST/GET/PATCH `/api/reports`, `ReportButton` on job detail, company review card, mentor profile, user profile (authenticated non-owner only); outcome `PHASE17_REPORT_SUBMITTED`.
- See **PHASE_17_BUILD.md** for full checklist and file list.

#### Delivered (Parts 4–9)

- **Part 4 — GDPR/DPDP:** POST/GET `/api/user/data-request` (1 per type per 30 days), admin GET/PATCH data-requests; BullMQ data-export and account-deletion workers; "Your Data" section on `/settings/privacy` (export, delete with "DELETE" confirmation, past requests).
- **Part 5 — Admin Trust & Safety:** `/dashboard/admin/trust` (PLATFORM_ADMIN) with 5 tabs: Audit Log, Security Events (Block IP), Reports Queue, Data Requests, Compliance Summary; APIs for audit-log, security-events, compliance-summary.
- **Part 6 — Rate limit + blocklist:** `reportRateLimitHit` → `logSecurityEvent('RATE_LIMIT_HIT')`; Redis blocklist; blocklist check on reports, data-request, contract sign; 403 IP_BLOCKED.
- **Part 7 — Resend templates:** data-export-requested/ready, account-deletion-requested/completed, report-received/resolved; all wired.
- **Part 8 — Outcome events:** PHASE17_DATA_EXPORT_REQUESTED, PHASE17_ACCOUNT_DELETION_REQUESTED, PHASE17_SECURITY_EVENT_LOGGED (sampled), PHASE17_COMPLIANCE_ACTION_TAKEN wired.
- **Part 9 — Navigation:** Admin nav "Trust & Safety" → `/dashboard/admin/trust`; "Your Data" section on `/settings/privacy`.

See **PHASE_17_BUILD.md** for full exit checklist and file list.


---

### Phase 18: B2B / Enterprise & API Platform — ✅ Complete

**Goal:** Full B2B/Enterprise layer: public REST API v1, ATS webhook ingestion, Enterprise plan enforcement, white-label careers pages, bulk import/export, developer portal, API usage billing stub.

**Implemented (see PHASE_18_BUILD.md):**

- **Prisma:** CompanyApiKey, ApiUsageLog, AtsWebhookEvent, CareersPageConfig, BulkImportJob, CompanyWebhook, AtsIntegration, SsoConfig.
- **API keys:** lib/api/keys.ts (generate, validate, revoke); lib/api/middleware.ts (withApiAuth, rate limit 1000/hr, usage log); lib/api/usage.ts; lib/api/webhooks.ts (outbound queue).
- **REST API v1:** GET/POST/PATCH/DELETE jobs; GET/PATCH applications; GET candidates; GET/POST webhooks; POST bulk jobs import; GET bulk import status; GET bulk applications export (CSV).
- **ATS webhooks:** POST /api/webhooks/ats/greenhouse|lever|workday|generic/[companyId]; ats-webhook-processor worker; webhook-delivery worker (HMAC-SHA256, 3 retries).
- **Enterprise:** PLAN_LIMITS (apiAccess, whiteLabel, ssoEnabled, etc.); canCompanyUseFeature gate on all /api/v1/*.
- **White-label careers:** /careers/[companySlug]; custom domain middleware (Redis 5min cache); /dashboard/company/careers; CareersPageConfig.
- **Dashboards:** /dashboard/company/api (4 tabs: Keys, Usage, Webhooks, ATS); /dashboard/company/sso; /dashboard/admin/enterprise.
- **Developer portal:** /developers (overview, reference, webhooks, changelog).
- **8 outcome events:** PHASE18_API_KEY_CREATED/REVOKED, PHASE18_API_REQUEST_MADE (5%), PHASE18_ATS_EVENT_RECEIVED/PROCESSED, PHASE18_CAREERS_PAGE_VIEWED (10%), PHASE18_BULK_IMPORT_COMPLETED, PHASE18_WEBHOOK_DELIVERED.

---

### Phase 18B: Internal Job Board & Employee Mobility

**Goal:** Enable companies to use Ascend not just for external hiring but for internal transfers, promotions, and referrals — turning Ascend into a year-round talent platform rather than a transactional job board.

| # | Task | Deliverables |
|---|------|--------------|
| 18B.1 | Job visibility field | Add `visibility` enum to `JobPost`: `PUBLIC` (default, existing behaviour) \| `INTERNAL` (verified employees of the company only) \| `UNLISTED` (direct link only, not in any listing) |
| 18B.2 | Employee domain verification | Company admin configures verified email domain(s) (e.g. `nexara.com`); users whose verified email matches are auto-granted `EMPLOYEE` role for that company; `CompanyEmployee` model (userId, companyId, verifiedAt, domain) |
| 18B.3 | Internal portal | `/internal/[company-slug]` — auth-gated; only users with `EMPLOYEE` role for that company; lists INTERNAL jobs for that company; same job card/detail/apply flow as public |
| 18B.4 | Employee referral system | On any job (PUBLIC or INTERNAL): "Refer a colleague" → enter name + email → sends referral email with job link and referrer attribution; `JobReferral` model tracks referrer, referred, job, outcome; outcome fed back to outcome tracking (Phase 16) |
| 18B.5 | Internal mobility tagging | Job post form: checkbox "Open to internal candidates first" → INTERNAL visibility for first N days, then auto-switch to PUBLIC; configurable days per company |
| 18B.6 | Anonymous internal apply | Employee can apply to internal job without their manager seeing (apply with anonymous flag; recruiter sees application without name until shortlisted) |
| 18B.7 | HR analytics | Company admin dashboard tab: internal fill rate; time-to-fill internal vs external; referral conversion rate; top referrers |

**Routes:** `/internal/[company-slug]` (auth-gated); `/api/companies/[slug]/referrals`; `/api/jobs/[id]/refer`.

**Prisma:** `JobPost.visibility` enum addition; `CompanyEmployee` model; `JobReferral` model.

**Exit criteria:**
- [x] `visibility` field on JobPost; INTERNAL jobs not visible in public `/jobs` listing
- [x] Domain verification flow works; CompanyEmployee granted automatically on login when email domain matches
- [x] `/internal/[company-slug]` accessible only to verified employees
- [x] Referral system: send, track, record outcome
- [x] Anonymous apply works; name revealed only on shortlist
- [x] HR analytics (Mobility) tab in company admin dashboard

---

### Phase 19: Growth, Virality & Network Effects

**Goal:** Drive organic growth through referral codes, share tracking, skill endorsements, and recruiter team invites. Attribution via Redis + cookie; no monetary rewards yet (30-day premium unlock for referrers).

**Deliverables (see PHASE_19_BUILD.md):** ReferralCode, Referral, ShareEvent, ProfileEndorsement models; `lib/growth/referral.ts` (generate, track click, attribute signup, convert); GET/POST growth APIs (referral, share, endorsements, recruiter-invite); `/join?ref=` landing; ShareButton on job/company/profile/salary/mentor pages; skill endorsement UI on public profile (1st-degree only, 5/week); Invite Teammates card on recruiter dashboard; admin Growth dashboard (funnel, shares by channel, top referrers); registration and career-context wired; 6 outcome events; 3 Resend templates (referral-converted, referral-reward-granted, recruiter-invite).

---

### Phase 21: Global Multilingual & Market Expansion — 🔄 Rolled Back

**Original goal:** Win the market that LinkedIn and Naukri have largely ignored — India's next 100 million job seekers who are not English-first and are based in Tier-2/3 cities. Phase 21 was expanded to **global** multilingual (7 languages: en, hi, es, ar, fr, pt, de) with RTL support for Arabic.

**Rollback (see PHASE21_ROLLBACK_BUILD.md):** Multilingual support has been fully removed. The platform is **English-only**. This rollback simplifies the codebase and removes all i18n overhead.

**Removed:** next-intl, `/messages/` (7 locales), LanguageSwitcher, `/settings/language`, `User.preferredLanguage`/`preferredRegion`, SupportedLanguage, ParsedJDTranslation, JD translation script + BullMQ worker, admin `/dashboard/admin/languages`, PHASE21_LANGUAGE_CHANGED, PHASE21_JD_TRANSLATED.

**Retained:** `User.preferredCurrency`, `lib/i18n/currency.ts` (formatCurrency, convertFromInr, formatSalaryRange), `/settings/currency` (currency selector only), PWA manifest + `/offline` page, PHASE21_CURRENCY_CHANGED, PHASE21_PWA_INSTALLED.

**Routes:** `/settings/currency` (replaces `/settings/language`).

---

### Phase 22: Marketplace & Career Services ✅ Complete

**Goal:** Transform Ascend from a job board into a career ecosystem with diversified revenue streams — marketplace GMV is valued differently than SaaS ARR and signals platform network effects to acquirers.

| # | Task | Deliverables |
|---|------|--------------|
| 22.1 | Resume review marketplace | ✅ Certified resume reviewers listed with profiles, ratings, pricing; job seeker purchases (Razorpay/Stripe); reviewer delivers feedback; 20% platform fee; `ResumeReviewOrder` |
| 22.2 | Mock interview marketplace | ✅ Mock interviews (30/60 min); scorecard (Technical / Communication / Culture / Problem Solving + notes); booking + payment; Calendly URL; `MockInterviewBooking` |
| 22.3 | Career coaching | ✅ Vetted coaches; specialisation (career switch, leadership, MBA prep, etc.); session booking + payment; `CoachingSession`; provider admin approval |
| 22.4 | Course recommendations | ✅ Skills gap (Phase 10B) links to courses; `CourseRecommendation`, `CourseClick`; affiliate click tracking + redirect; admin course CRUD |
| 22.5 | Certification badges | ✅ `ProfileBadge` (userId, provider, skill, score, badgeUrl, verificationUrl); manual add in `/settings/badges`; display on profile; admin revoke |
| 22.6 | Recruiter InMail credits (refined) | ⬜ Deferred; Phase 12 InMail remains as-is |

**Routes:** `/marketplace/become-provider`, `/marketplace/resume-review`, `/marketplace/mock-interviews`, `/marketplace/coaching`, `/marketplace/courses`; `/settings/badges`; `/dashboard/provider`; `/dashboard/admin/marketplace` (providers, orders, revenue, courses, badges).

**Prisma:** `MarketplaceProvider`, `ResumeReviewOrder`, `MockInterviewBooking`, `CoachingSession`, `ProviderReview`, `CourseRecommendation`, `CourseClick`, `ProfileBadge`; enums `ProviderStatus`, `ProviderType`, `OrderStatus`, `BadgeStatus`.

**Exit criteria:** ✅ See PHASE_22_BUILD.md. Resume review, mock interview, coaching: list, book, pay (Razorpay), deliver, rate, dispute; course recommendations + skills gap links + click tracking; certification badges on profile; provider onboarding + admin queue; dispute/refund; 7 Resend templates; 8 outcome events. Commission/affiliate tracked in `PaymentEvent.metadata`. Recruiter filter by badge and 22.6 (InMail refined) deferred.

---

## 4.1 How the Resume Builder, Fit Score & JD Optimiser Connect

```
Resume Builder (Phase 2A)  →  creates forward-focused, ATS-ready base resume(s)
         ↓
Fit Score (Phase 5A)       →  shows candidate how well they match a specific job
         ↓
JD Optimiser (Phase 6A)   →  tailors base resume for that specific JD
         ↓
Application (Phase 6)      →  candidate applies with optimised, role-specific version
         ↓
Tracking                   →  fit score updates as profile improves over time
```

**Integration points:**

- **Fit Score panel on job detail** → "Optimise Resume for this Job" CTA opens JD Optimiser with that job pre-selected.
- **Apply flow** → Option to attach the JD-optimised resume version (if one was created for this job).
- **Dashboard** → Fit score history for saved jobs; "Your score for [Job] went from X% to Y% after you…".
- **Resume versions** → Builder creates base versions (by CareerIntent); Optimiser creates job-specific versions; both appear in "My Resumes" with clear labels (e.g. "Product Manager - Nexara - Applied Jan 2026").

**Build order:** Resume Builder first (Phase 2A), then Fit Score (Phase 5A), then JD Optimiser (Phase 6A).

**Extended pipeline with Phase 0 and Phase 6A:**

```
Phase 0  JD Corpus          →  pre-trains keyword banks, skills taxonomy, salary signals, vector store
         ↓
Phase 2A Resume Builder     →  creates forward-focused, ATS-ready base resume(s)
         ↓
Phase 5A Fit Score          →  shows candidate how well they match a specific job
         ↓
Phase 6A JD Optimiser      →  tailors base resume for that specific JD
         ↓
Phase 6  Application       →  candidate applies with optimised, role-specific version
         ↓
Phase 10B Intelligence     →  outcome data feeds market value, skills gap, career trajectory
         ↓
Tracking                   →  fit score updates as profile improves over time
```

---

## 5. Database & API Strategy

### 5.1 Schema Summary (Prisma)

- **Auth & users:** `User`, `Account`, `Session`, `VerificationToken`
- **Profiles:** `JobSeekerProfile`, `RecruiterProfile`, `Experience`, `Education`, `Certification`, `Project`, `Award`, `Language`, `Volunteer`, `Publication`, `Resume`, `Skill`, `UserSkill`
- **Resume & Fit Score:** `CareerIntent` (targetRole, targetIndustry, targetLevel, careerGoal, switchingIndustry); `ResumeVersion` (name, careerIntentId, templateId, contentSnapshot, atsScore, lastUsed, lastUpdated; optional link to JobPost for JD-optimised versions); job + profile embeddings (pgvector or Pinecone) for fit score; Redis cache for JD analysis (24h TTL) and fit scores (e.g. 1h TTL); `JDEmbedding` (parsedJdId, embedding, model); `JDSalarySignal` (role, seniority, location, salaryMin, salaryMax)
- **Ingestion:** `RawJD` (sourceUrl, rawText, hash, scrapedAt, parsedAt); `ParsedJD` (rawJdId, title, seniority, industry, location, skills JSON, keywords[], salaryMin?, salaryMax?, tone, promptVersion); `ParsedJDTranslation` (parsedJdId, language, translatedContent JSON)
- **Companies:** `Company`, `CompanyAdmin`, `CompanyMedia`, `CompanyBenefit`, `CompanyReview`, `InterviewReview`, `CompanyQ&A`, `SalaryReport`
- **Jobs:** `JobPost`, `JobPostSkill`, `JobApplication`, `SavedJob`, `JobAlert`
- **Network:** `Connection`, `Follow`, `Post`, `PostReaction`, `Comment`, `Message`, `Conversation`, `MessageRequest`
- **System:** `Notification`, `SavedSearch`, `Subscription`, `Usage`, `AuditLog`, `Report`
- **Marketplace:** `MarketplaceProvider`, `ResumeReviewOrder`, `MockInterviewBooking`, `CoachingSession`, `ProviderReview`, `CourseRecommendation`, `CourseClick`, `ProfileBadge`
- **Internal Job Board:** `CompanyEmployee` (userId, companyId, verifiedAt, domain); `JobReferral` (referrerId, referredEmail, jobPostId, outcome)

### 5.2 API Conventions

- REST-style: `GET/POST/PATCH/DELETE` with JSON.
- Auth: Session cookie (NextAuth) or Bearer for mobile/API clients later.
- Pagination: `cursor` or `page` + `limit`; consistent response shape `{ data, nextCursor, total }`.
- Errors: HTTP status + `{ code, message, details? }`.
- Rate limiting: Per route (e.g. apply, review, message) with Redis.
- OpenAPI/Swagger: Auto-generated from route handlers or manual spec for critical APIs.

### 5.3 Folder Structure (from spec)

```
/app
  /auth          → login, register, onboarding
  /jobs          → browse, [id], post-a-job
  /companies     → browse, [slug], reviews, salaries
  /profile       → [username], edit
  /resume        → build, versions, optimise (Resume Builder & JD Optimiser)
  /dashboard     → seeker, recruiter, company, admin
  /network       → connections, feed, messaging
  /salary        → insights, compare, estimator
  /career        → resources, skill-assessments, blog
  /settings      → account, privacy, notifications, billing
/components
  /ui            → ShadCN
  /jobs, /profile, /company, /feed, /common
/lib
  /prisma, /auth, /api, /ai, /search
/hooks
/store
/types
/utils
/public
```

---

## 6. Quality, Security & Compliance

| Area | Approach |
|------|----------|
| **Testing** | Jest for critical business logic (auth, application status, limits); React Testing Library for key UI; E2E (Playwright) for critical paths. **Implemented (pre–Phase 2A):** Jest unit tests (profile completion, username, JWT denylist, rate limiter, storage adapter, API keys, profile API); manual checklist (`__tests__/MANUAL_TEST_CHECKLIST.md`); DB integrity script (`scripts/db-check.ts`); regression report (`__tests__/REGRESSION_REPORT.md`). |
| **Security** | HTTPS only; secure cookies; CSRF for forms; sanitize rich text; rate limiting; no secrets in client |
| **Privacy** | Profile visibility; “hide from company”; data export (GDPR); account deletion; audit log for sensitive actions |
| **Performance** | Redis cache; DB indexes (job search, applications, messages); lazy load and pagination; image optimization (Next/Image, S3 variants) |

---

## 7. Timeline Overview

| Phase | Focus | Suggested duration |
|-------|-------|--------------------|
| 0 | Pre-Launch Data Layer (JD Ingestion) | 2–3 weeks (run in parallel) |
| 1 | Auth & Onboarding | 2–3 weeks ✅ |
| Pre-2 | Infrastructure & AI Scaffolding | 1 week ✅ |
| 2 | Job Seeker Profile | 2–3 weeks ✅ |
| 2A | Intelligent Resume Builder | 2–3 weeks ✅ |
| 3 | Company Profiles | 2–3 weeks ✅ |
| 3B | Company Admin Dashboard Completion | 1–2 weeks |
| 4 | Job Post Creation & Listing | 2 weeks ✅ |
| 5 | Job Search & Filters | 2 weeks 🔄 |
| 5A | Profile Fit Score (JD) | 1.5–2 weeks |
| 6 | Application System | 2–3 weeks |
| 6A | JD Resume Optimiser | 2 weeks |
| 7 | Reviews & Ratings | 2 weeks |
| 8 | Salary Insights | 1–2 weeks |
| 9 | Networking & Feed | 3–4 weeks |
| 10 | Dashboards | 2 weeks |
| 10B | Candidate Intelligence Dashboard | 1–2 weeks |
| 11 | AI Features | 2–3 weeks |
| 12 | Monetization (Stripe) | 2 weeks |
| 13 | Admin Panel | 1–2 weeks |
| 14 | SEO Optimizations | ~1 week |
| 15 | Mobile Responsiveness Polish | 1–2 weeks |
| 16 | Data & Analytics Platform | 2 weeks |
| 16B | Recruiter Intelligence & Hiring Analytics | 1–2 weeks |
| 17 | Trust, Safety & Compliance | 2 weeks |
| 18 | B2B / Enterprise & API Platform | 2–3 weeks |
| 18B | Internal Job Board & Employee Mobility | 1–2 weeks |
| 19 | Growth, Virality & Network Effects | 2–3 weeks |
| 20 | Platform Intelligence & Investor Metrics | 2 weeks |
| 21 | Global Multilingual & Market Expansion | 3–4 weeks |
| 22 | Marketplace & Career Services | 3–4 weeks |

**Total: ~55–75 weeks** for a small team (1–2 devs). Phase 0 runs in parallel and does not add to the critical path.

---

## Next Step

**Current status:** Phases 1–22 complete (except Phase 21 rolled back); M-1–M-9, M-10, M-11, M-13, M-14, M-15, M-16, M-17 complete; Design System (DS-1–DS-5, DS-4B) complete. **M-9** Dispute Resolution Engine ✅ (evidence-based resolution, strike system, M-13 upheldDisputeCount wired). **Mentorship Track complete** — pilot-ready. See PHASE_M9_BUILD.md, PHASE_M13_BUILD.md, PHASE_M7_BUILD.md. **Next:** Set `seeker_pilot_open = true` to open pilot; or Phase 18 enhancements.

**Immediate next steps:**
1. ~~M-6 (Escrow & Payments)~~ ✅
2. ~~Phase 12 Pricing Restructure~~ ✅
3. ~~M-14 (Platform Fee & Revenue)~~ ✅
4. ~~M-7 (Meeting Room & Ascend Steno)~~ ✅
5. ~~M-13 (Mentor Monetisation Unlock)~~ ✅
6. ~~M-9 (Dispute Resolution Engine)~~ ✅ — Mentorship Track complete
7. Set `seeker_pilot_open = true` (admin panel or seed) to open pilot
8. Phase 21/22 follow-ups: URL locale prefix, resume builder language + RTL/Devanagari PDF, hreflang/sitemaps, service worker, WhatsApp alerts; recruiter filter by badge (Phase 22); Phase 22.6 InMail credits refined
