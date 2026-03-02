# Pre-Phase 2 Build — Completion Status

**Project:** Ascend  
**Scope:** Pre-Phase 2 tasks (rename, infrastructure, design system)  
**Build date:** 2025-02-27

---

## Overview

Before starting Phase 2 (Job Seeker Profile), the following pre-phase tasks were completed so the codebase is consistently branded as Ascend, uses the correct infrastructure clients, and applies the Ascend by Coheron design system everywhere.

**Environment note:** Local development only — PostgreSQL and Redis run locally; Vultr Object Storage credentials are not yet set (client files are scaffolded; env vars left blank until deployment).

---

## Task 1 — Rename: Elevio → Ascend

| Find     | Replace |
|----------|---------|
| Elevio   | Ascend  |
| elevio   | ascend  |
| ELEVIO   | ASCEND  |

**Locations updated:**

- **package.json** — `"name": "ascend"`
- **app/layout.tsx** — metadata title, description
- **Navbar / Header** — brand text "Ascend", logo alt
- **Footer** — "© 2025 Ascend by Coheron"
- **Email templates** — subject/body/from name (e.g. "Verify your Ascend account")
- **Auth pages** — headings and copy ("Welcome back", "Sign in to your account", "Join Ascend", etc.)
- **Onboarding** — "How will you use Ascend?", success copy
- **Dashboard stubs** — any placeholder text
- **Cookies** — `elevio_remember` → `ascend_remember`, theme key → `ascend-theme`
- **.env.local.example** — comments
- **README / PROJECT_PLAN / PHASE_1_BUILD** — references

**Verification:** Case-insensitive grep for `elevio` across the project returns zero results (excluding `package-lock.json` if present).

---

## Task 2 — Infrastructure Clients Setup

### 2.1 Environment Variables

**.env.local.example** contains the full variable set:

- **App:** `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- **Database:** `DATABASE_URL` (e.g. `postgresql://.../ascend`)
- **Redis:** `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- **Object Storage (Vultr):** `VULTR_STORAGE_ENDPOINT`, `VULTR_STORAGE_ACCESS_KEY`, `VULTR_STORAGE_SECRET_KEY`, `VULTR_STORAGE_BUCKET`, `VULTR_STORAGE_REGION`
- **OAuth:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- **Email:** `RESEND_API_KEY`
- **AI:** `ANTHROPIC_API_KEY`
- **Job Search:** `RAPIDAPI_KEY`
- **JD Scraping:** `FIRECRAWL_API_KEY`
- **Payments (Phase 12):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

No `UPSTASH_*` variables remain.

### 2.2 Redis — ioredis

- **Removed:** `@upstash/redis`
- **Added:** `ioredis`
- **lib/redis/client.ts** — Singleton client using `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`; TLS in production.
- **lib/redis/ratelimit.ts** — Sliding-window rate limit using ioredis (`ratelimit:key:window`); used for resend-verification (1/min per email).

### 2.3 Vultr Object Storage (S3-compatible)

- **Packages:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- **lib/storage/client.ts** — S3Client with Vultr endpoint and credentials from env (placeholder when not set).
- **lib/storage/upload.ts** — `uploadFile`, `deleteFile`, `getSignedDownloadUrl`, `generateStorageKey`, `isStorageConfigured()`.
- **lib/storage/local.ts** — Local dev fallback: `saveLocalFile`, `getLocalFileUrl`, `deleteLocalFile` (writes to `data/uploads`).
- **lib/storage/index.ts** — Unified adapter: `storeFile`, `getFileUrl`, `removeFile`; uses Vultr when configured, else local. Application code imports from `lib/storage/index.ts` only.

Storage client is not connected or tested until Vultr credentials are provided at deployment.

### 2.4 Anthropic Claude

- **Package:** `@anthropic-ai/sdk`
- **lib/ai/client.ts** — Singleton Anthropic client; `CLAUDE_MODEL = 'claude-sonnet-4-5'`.
- **lib/ai/generate.ts** — `generateText`, `generateJSON`, `generateStream` (latest Claude model).

### 2.5 RapidAPI JSearch

- **lib/jobs/jsearch.ts** — Types `JSearchJob`, `JSearchResponse`; `searchJobs(params)` using `RAPIDAPI_KEY` and `jsearch.p.rapidapi.com`.

### 2.6 Firecrawl

- **Package:** `@mendable/firecrawl-js`
- **lib/scraping/firecrawl.ts** — Firecrawl v2 client; `scrapeJobDescription(url)` returns markdown. Uses `FIRECRAWL_API_KEY`.

---

## Task 3 — Ascend Design System

### 3.1 Tailwind (tailwind.config.ts)

- **Colors:** primary `#0A2540`, accent green `#00C566`, accent blue `#1A56DB`, surface, card (light/dark), border, text-primary, text-secondary, success, warning, danger, muted.
- **Font:** `--font-inter` (Inter).
- **Border radius:** card 12px, button 8px.
- **Shadows:** card, card-hover, card-active (green ring).
- **Transitions:** fast 150ms, base 200ms.

### 3.2 Inter Font

- **app/layout.tsx** — `next/font/google` Inter, variable `--font-inter`, weights 400/500/600/700; applied to root/body.

### 3.3 Global CSS (app/globals.css)

- **Base:** `:root` and `.dark` CSS variables (background, foreground, card, border, primary, accent, muted, radius, ring).
- **Components:**  
  `ascend-card`, `ascend-card-hover`, `ascend-card-active`  
  `btn-base`, `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`  
  `ascend-input`, `ascend-label`, `ascend-error`, `ascend-hint`  
  Badges: `badge`, `badge-match-high/mid/low`, `badge-new`, `badge-urgent`, `badge-remote`, `badge-featured`  
  `page-container`, `page-section`, `section-title`, `section-subtitle`, `ascend-divider`, `skeleton`

### 3.4 Navbar (components/layout/Navbar.tsx)

- Height `h-16`, sticky, `border-b border-border`, white (light) / `#161B22` (dark).
- **Left:** Green dot + "Ascend" link to `/`.
- **Center (desktop):** Jobs, Companies, Salary, Network (plain links; active = `text-accent-green`).
- **Right:** ThemeToggle; unauthenticated: "Sign in" (ghost), "Get started" (primary); authenticated: notification bell stub + Avatar dropdown (Dashboard, Profile, Settings, Sign out).
- **Mobile:** Hamburger opens Sheet with same links and actions.

### 3.5 Footer (components/layout/Footer.tsx)

- Background `bg-primary` (#0A2540).
- Three columns: Product (Jobs, Companies, Salary Insights, Network), Company (About Coheron, coheron.tech, Contact), Legal (Privacy, Terms, Cookie Policy).
- Bottom bar: `border-t border-white/10`; "© 2025 Ascend by Coheron"; coheron.tech with external link icon.

### 3.6 Auth Pages

- Wrapper: `min-h-screen` flex center, `bg-surface`.
- Card: `ascend-card` (AuthCard), optional green dot + "Ascend" wordmark.
- Forms: `ascend-label`, `ascend-input`, `ascend-error`; primary CTA `btn-primary w-full`; OAuth as `btn-secondary`; divider "or continue with email".
- Headings: Login "Welcome back" / "Sign in to your account"; Register "Create your account" / "Join Ascend"; Forgot "Reset your password"; Reset "Set a new password"; Verify-email-sent "Check your inbox".

### 3.7 Onboarding

- Page: `min-h-screen bg-surface`; content `max-w-2xl mx-auto px-4 py-12`.
- **Progress bar:** Thin bar at very top (`h-1`), `bg-muted` track, `bg-accent-green` fill; "Step X of 3" in `text-text-secondary`.
- **Step 1:** `ascend-card p-8`; two role cards with `ascend-card-hover`, Briefcase (Job Seeker) and Users (Recruiter) icons; selected state `border-accent-green shadow-card-active`; Next = `btn-primary`.
- **Steps 2A / 2B:** `ascend-card p-8`; `ascend-label` + `ascend-input`; Back = `btn-ghost`, Continue = `btn-primary`.
- **Step 3:** `ascend-card p-8`; checkmark in accent-green circle; "You're all set, [name]!"; "Go to your dashboard" = `btn-primary`.

---

## Task 4 — Verification & Confirm

| Check | Result |
|-------|--------|
| Grep "elevio" (case-insensitive) | Zero results |
| .env.local.example | All required variables present |
| Grep "UPSTASH" | Zero results |
| npm list — depth=0 | No @upstash/redis; ioredis, @anthropic-ai/sdk, @aws-sdk/client-s3, @mendable/firecrawl-js present |
| Client files exist | lib/redis/client.ts, ratelimit.ts; lib/storage/client.ts, upload.ts, local.ts, index.ts; lib/ai/client.ts, generate.ts; lib/jobs/jsearch.ts; lib/scraping/firecrawl.ts |
| Design system | Inter in layout; Ascend tokens in Tailwind; component classes in globals.css; Navbar green dot + Ascend; Footer Ascend by Coheron; auth and onboarding use design system |
| Redis connectivity | Test script set/get key; "Redis OK: ✅" (script removed after confirm) |
| npm run build | Passes with zero errors |

---

## Exit Criteria — Pre-Phase 2 Complete

| Criterion | Status |
|----------|--------|
| Zero instances of "elevio" / "Elevio" in codebase | ✅ |
| .env.local.example has all required variables | ✅ |
| No UPSTASH_ references | ✅ |
| @upstash/redis uninstalled; ioredis installed and working locally | ✅ |
| Vultr Object Storage client scaffolded with local fallback | ✅ |
| Anthropic Claude client (generateText, generateJSON, generateStream) | ✅ |
| RapidAPI jsearch client | ✅ |
| Firecrawl client | ✅ |
| Inter font via next/font, --font-inter | ✅ |
| Ascend color tokens in tailwind.config.ts | ✅ |
| Global CSS component classes defined | ✅ |
| Navbar: green dot + "Ascend", design system | ✅ |
| Footer: navy background, "Ascend by Coheron" | ✅ |
| Auth pages use Ascend design system | ✅ |
| Onboarding uses Ascend design system and green progress bar | ✅ |
| Redis connectivity confirmed locally | ✅ |
| npm run build passes | ✅ |

---

## Key Files (Created or Modified in Pre-Phase 2)

**Config / env:**  
`package.json`, `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `.env.local.example`

**Layout:**  
`components/layout/Navbar.tsx`, `components/layout/Footer.tsx`

**Auth:**  
`components/auth/AuthCard.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, auth pages under `app/auth/*`

**Onboarding:**  
`app/onboarding/page.tsx`, `components/onboarding/ProgressBar.tsx`, `RoleSelectionStep.tsx`, `JobSeekerStep.tsx`, `RecruiterStep.tsx`, `SuccessStep.tsx`, `OnboardingWizard.tsx`

**Infrastructure:**  
`lib/redis/client.ts`, `lib/redis/ratelimit.ts`  
`lib/storage/client.ts`, `lib/storage/upload.ts`, `lib/storage/local.ts`, `lib/storage/index.ts`  
`lib/ai/client.ts`, `lib/ai/generate.ts`  
`lib/jobs/jsearch.ts`  
`lib/scraping/firecrawl.ts`

**Docs:**  
`PHASE_1_BUILD.md`, `PROJECT_PLAN.md`

---

## Next Step

Pre-Phase 2 is complete. Proceed to **Phase 2: Job Seeker Profile** when ready.
