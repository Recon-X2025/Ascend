# Phase 1: Auth & Onboarding — Build Completion Status

**Project:** Ascend  
**Phase:** 1 — Auth & Onboarding  
**Build date:** 2025-02-27

---

## ✅ Task List vs Completion

| # | Task | Status | Notes |
|---|------|--------|--------|
| **1.1** | Project scaffold | ✅ Done | Next.js 14 (App Router), TypeScript, Tailwind, ShadCN UI, ESLint, Prettier. Base layout with Navbar + Footer. `.env.local.example` with all required vars. |
| **1.2** | Prisma + PostgreSQL schema | ✅ Done | `schema.prisma` with User, Account, Session, VerificationToken, PasswordResetToken, Role enum, JobSeekerProfile, RecruiterProfile. Migration SQL in `prisma/migrations/20250227000000_init/migration.sql`. Run `npx prisma migrate dev --name init` after setting `DATABASE_URL`. |
| **1.3** | NextAuth.js setup | ✅ Done | `/app/api/auth/[...nextauth]/route.ts`. Credentials + Google + LinkedIn. JWT strategy. Callbacks: jwt (id, role, onboardingComplete), session, signIn (create/link user for OAuth). Pages: signIn `/auth/login`, error `/auth/error`. |
| **1.4** | Email/password auth | ✅ Done | Register, login, verify-email-sent, verify-email, forgot-password, reset-password pages + API routes. Resend emails (verification + password reset). Client + server validation (Zod + RHF). |
| **1.5** | OAuth sign-in | ✅ Done | Google + LinkedIn on login and register. First OAuth creates User (JOB_SEEKER, onboardingComplete false). Account linking when email matches existing user. |
| **1.6** | Role & profile stubs | ✅ Done | Role on User; JobSeekerProfile and RecruiterProfile stubs in schema. Onboarding sets role and creates profile. |
| **1.7** | Onboarding flow | ✅ Done | `/onboarding` wizard: Step 1 role selection → Step 2A Job Seeker (name, headline, location, years) or 2B Recruiter (name, company, designation, size) → Step 3 success + “Go to dashboard”. Progress bar. Back button. `/api/onboarding/complete` POST. |
| **1.8** | 2FA (foundation) | ✅ Done | `twoFactorEnabled`, `twoFactorSecret` on User. `/settings/security` stub with “Enable 2FA (coming soon)”. |
| **1.9** | Remember me / sessions | ✅ Done | “Remember me” sets cookie `ascend_remember=1` (30 days). NextAuth route reads cookie and sets session maxAge 30d vs 24h. `/api/auth/signout-all` POST (prepared; JWT strategy does not use DB sessions for invalidation). |
| **1.10** | RBAC middleware | ✅ Done | `middleware.ts`: `/dashboard/seeker` → JOB_SEEKER; `/dashboard/recruiter` → RECRUITER or COMPANY_ADMIN; `/dashboard/company` → COMPANY_ADMIN; `/dashboard/admin` → PLATFORM_ADMIN. `/onboarding` requires auth; redirects if already complete. `/auth/*` redirects if authed + complete. Unauthorized → `/auth/login` with callbackUrl. |

---

## Exit Criteria Checklist

| Criterion | Status |
|-----------|--------|
| User can register with email/password and receive verification email | ✅ |
| User can verify email via link | ✅ |
| User can log in with email/password | ✅ |
| User can sign in with Google OAuth | ✅ |
| User can sign in with LinkedIn OAuth | ✅ |
| User can reset password via email | ✅ |
| User completes onboarding (role + basic info) | ✅ |
| `onboardingComplete = true` after onboarding | ✅ |
| Middleware protects dashboard routes by role | ✅ |
| Authed users redirected away from `/auth/*` when complete | ✅ |
| Dark mode across auth and onboarding | ✅ (ThemeProvider + class) |
| Forms validate client (Zod + RHF) and server | ✅ |
| Dashboard stubs for all 4 roles | ✅ |
| Rate limiting on resend verification (1/min per email via Redis) | ✅ |
| “Remember me” extends session to 30 days | ✅ |

---

## Env Vars Required

Set in `.env.local` (see `.env.local.example`):

- `DATABASE_URL` — PostgreSQL connection string  
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`  
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`  
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`  
- `RESEND_API_KEY`  
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (local Redis or Vultr Managed Redis)  

---

## Run Database Migration

```bash
# After setting DATABASE_URL
npx prisma migrate dev --name init
# or if migration folder already exists and DB is empty:
npx prisma migrate deploy
```

---

## Next Step

Phase 1 is complete. Proceed to **Phase 2: Job Seeker Profile** when ready.
