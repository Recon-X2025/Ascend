# Ascend — India's Career Platform

A unified job search, company reviews, salary insights, and career mentoring platform. Built with Next.js 14, TypeScript, Tailwind, Prisma, and PostgreSQL.

---

## Phase Build Review

A detailed summary of all phases built to date. Each phase is documented in `PHASE_*_BUILD.md` and `PHASE_M*_BUILD.md`.

### Foundation & Data Layer

| Phase | Deliverables |
|-------|--------------|
| **Pre-Phase 2** | Elevio→Ascend rename; ioredis; Vultr Object Storage; Anthropic; design system tokens |
| **Phase 0** | RawJD, ParsedJD, JDEmbedding, JDSalarySignal; JD parser; ingestion scripts; admin stats API; keyword banks; skills taxonomy |
| **Phase 0B** | RawJD.source enum; upsertRawJD; 5 JD sources (Kaggle, Adzuna, Naukri RSS, Careers pages, RemoteOK); deduplication; `ingest:sources` pipeline |

### Auth & Profile

| Phase | Deliverables |
|-------|--------------|
| **Phase 1** | NextAuth (Credentials, Google, LinkedIn); email verification; onboarding wizard; RBAC; 2FA stub |
| **Phase 1 & 2 Fix** | LinkedIn OIDC; denylist; JWT jti/iat; sign out all devices; profile section reorder; settings layout; avatar/banner; privacy |
| **Phase 2** | Full JobSeekerProfile (Experience, Education, Skills, Certs, Projects, Awards, Languages, Volunteer, Publications); profile APIs; completion score; public profile |
| **Phase 2A** | CareerIntent; ResumeVersion; ATS engine; keyword optimiser; 6 templates; PDF/DOCX export; BullMQ generation |

### Company & Jobs

| Phase | Deliverables |
|-------|--------------|
| **Phase 3** | Company schema; claim/verify; overview; media; reviews; interviews; Q&A; benefits; salary; discovery |
| **Phase 3B** | Extended reviews/interviews/Q&A/salary APIs; company admin dashboard (6 tabs); submit forms; rate limiting |
| **Phase 4** | JobPost, JobPostSkill, JobScreeningQuestion, SavedJob; job post form; listing; detail; recruiter dashboard; deadline cron |

### Search & Fit

| Phase | Deliverables |
|-------|--------------|
| **Phase 5** | Typesense full-text search; faceted filters; saved searches; job alerts (immediate/daily/weekly); Redis cache |
| **Phase 5A** | FitScore model; extractor, scorer, explainer; FitScoreCard, FitScoreBadge, FitScoreBreakdown; batch scores |

### Applications & Resume

| Phase | Deliverables |
|-------|--------------|
| **Phase 6** | JobApplication; Easy Apply flow; screening questions; withdraw; status emails; recruiter inbox; outcome tracking |
| **Phase 6A** | OptimisationSession; BullMQ JD optimiser; OptimiseResumeButton; AI JD-tailored resume; fabrication prevention |

### Reviews, Salary & Network

| Phase | Deliverables |
|-------|--------------|
| **Phase 7** | CompanyReview, InterviewReview, SalaryReport; moderation; unified Reviews tab; helpful votes |
| **Phase 8** | SalaryInsightCache, CityMetric; role/company/city browse; estimate API; premium gating |
| **Phase 9** | Connection, CompanyFollow, Conversation, Message, CareerSignal; connections; follow; messaging; feed |
| **Phase 9B** | MentorProfile, MentorAvailability, MentorSession; become-mentor flow; discovery; session lifecycle; match scoring |

### Dashboards & AI

| Phase | Deliverables |
|-------|--------------|
| **Phase 10** | Notification model; Notification Centre; seeker/recruiter/admin dashboards; profile views |
| **Phase 10B** | CandidateInsightSnapshot; market value; visibility; skills gap; app performance; heatmap; weekly digest |
| **Phase 11** | CoverLetter, InterviewPrep, ProfileOptimiserResult, JobDismissal; cover letter; interview prep; profile optimiser; smart recommendations |

### Monetisation, Admin & Platform

| Phase | Deliverables |
|-------|--------------|
| **Phase 12 (Pricing)** | SEEKER_FREE/PAID, MENTOR_*, RECRUITER_* plans; resume credits; mentor subscription; billing dashboard |
| **Phase 13** | AuditLog, FeatureFlag; user ban/unban; company verify/suspend; moderation; feature flags |
| **Phase 14** | Metadata utility; JSON-LD (JobPosting, Organization); sitemap; robots; JD Library |
| **Phase 15** | Bottom nav; filters Sheet; touch targets; dark mode; error boundaries |
| **Phase 16** | AnalyticsEvent, DailyMetricSnapshot; track(); admin analytics dashboard |
| **Phase 16B** | HiringAnalyticsSnapshot; InterviewScorecard; DIMetricsSnapshot; time-to-hire; funnel; fit explainer |
| **Phase 17** | Extended AuditLog, SecurityEvent, UserReport, DataRequest; GDPR/DPDP; admin Trust & Safety |
| **Phase 18** | CompanyApiKey; REST API v1; ATS webhooks; white-label careers; bulk import/export; developer portal |
| **Phase 18B** | JobVisibility (PUBLIC/INTERNAL/UNLISTED); CompanyEmployee; JobReferral; internal portal; referrals |
| **Phase 19** | ReferralCode, Referral, ShareEvent, ProfileEndorsement; referral flow; share CTAs; skill endorsements |
| **Phase 20** | InvestorSnapshot, MetricAlert; North Star; retention; revenue waterfall |
| **Phase 21** (Rollback) | next-intl removed; English-only; preferredCurrency retained; PWA kept |
| **Phase 22** | MarketplaceProvider; Resume Review, Mock Interview, Coaching; courses; ProfileBadge; admin marketplace |
| **Phase GST** | Invoice, InvoiceLineItem, BillingProfile; GST invoicing; subscriptions, marketplace, mentorship |

### Mentorship Track (M-1 through M-17)

| Phase | Deliverables |
|-------|--------------|
| **M-1** | MentorVerification, VerificationDocument; upload/submit; admin decide; Zero Trust verification |
| **M-2** | Extended MentorProfile; 6-step become-a-mentor; availability; transition record; public profile |
| **M-3** | MentorApplication, MenteeReadinessCheck; 3 readiness gates; max 3 matches; 5-day SLA |
| **M-4** | Multi-dimensional matching (transition, geography, focus, availability); Redis cache; BullMQ refresh |
| **M-5** | MentorshipContract, ContractSignature; OTP signing; PDF generation; expire-unsigned cron |
| **M-6** | MentorshipEscrow, EscrowTranche, PaymentMovement; Razorpay; tranche release; platform fee |
| **M-7** | SessionRoom, SessionTranscript, SessionRecord; Daily.co; Ascend Steno; transcript; SHA-256 PDF |
| **M-8** | EngagementSession, EngagementMilestone; schedule/complete; goal/outcome docs; reminders |
| **M-9** | MentorshipDispute, DisputeEvidence; filing window; category-based resolution; strike system |
| **M-10** | MentorshipOutcome; claim/verify/dispute; 7-day window; 6‑month check-in; verified outcomes badge |
| **M-11** | MentorTier (RISING/ESTABLISHED/ELITE); tier history; capacity; discovery boost |
| **M-12** | MentorshipCircle, CircleMember, CircleSession; group cohorts; peer check-in |
| **M-13** | MentorMonetisationStatus; 5 unlock criteria; session fee (₹2k–₹25k); MENTOR_MARKETPLACE |
| **M-14** | TrancheFeeRecord, MentorshipRevenueSnapshot; tier-based fee; admin revenue dashboard |
| **M-15** | LegalDocument, LegalDocumentSignature; Mentorship Addendum; Mentor Conduct Agreement; OTP gates |
| **M-16** | MentorshipAuditLog, OpsAlert; ops hub; intervene (WARN/PAUSE); engagement monitoring |
| **M-17** | MentorshipAnalyticsSnapshot, MentorAnalyticsSnapshot; platform/mentor/mentee analytics |

For detailed build notes, file lists, and test steps, see the individual `PHASE_*_BUILD.md` files.

---

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Building

```bash
npm run build
```

If the build fails with webpack or prerender errors (e.g. **"Cannot find module for page"** or prerender errors on `/`, `/dashboard`, `/auth/login`), use a clean build:

```bash
npm run rebuild
```

This runs `npm run clean` (removes `.next`) then `npm run build`. Stale `.next` cache often causes these issues.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) — Full project roadmap and phase details
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Stack and infrastructure

## Deploy on Vercel

Deploy using the [Vercel Platform](https://vercel.com/new) or see [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).
