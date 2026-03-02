# Ascend — Manual Test Checklist

Run through this checklist manually in the browser with `npm run dev` and database connected.

## 2.1 — Auth Flows

### Email/Password
- [ ] Register with new email → verification email received
- [ ] Verify email via link → redirected to /onboarding
- [ ] Login with verified email + correct password → dashboard
- [ ] Login with wrong password → error message shown
- [ ] Forgot password → reset email received
- [ ] Reset password via link → can login with new password
- [ ] Register with duplicate email → error message shown
- [ ] Unverified user tries to login → blocked with message

### Google OAuth
- [ ] Click "Continue with Google" → Google consent screen
- [ ] Complete Google auth → onboarding (new user)
- [ ] Complete Google auth → dashboard (returning user)
- [ ] Google email matches existing email/password user → accounts linked

### LinkedIn OAuth
- [ ] Click "Continue with LinkedIn" → LinkedIn consent screen
- [ ] LinkedIn OIDC scope is "openid profile email"
- [ ] Complete LinkedIn auth → onboarding (new user)
- [ ] Complete LinkedIn auth → dashboard (returning user)
- [ ] Check session: user.role and user.onboardingComplete present

### Session & Security
- [ ] Remember me checked → session persists after browser close
- [ ] Remember me unchecked → session expires after 24h
- [ ] POST /api/auth/signout-all → GET /api/auth/session returns no user
- [ ] Sign in again after signout-all → works normally
- [ ] Password change via /settings/account → all other sessions invalidated

## 2.2 — Onboarding Flow

- [ ] New user lands on /onboarding after registration/OAuth
- [ ] Progress bar shows Step 1 of 3
- [ ] Role selection: Job Seeker / Recruiter cards selectable
- [ ] Step 2 (Job Seeker/Recruiter): form fields present
- [ ] Back button returns to previous step
- [ ] Form validates required fields before Next
- [ ] Step 3: "You're all set" shown
- [ ] "Go to your dashboard" → correct dashboard
- [ ] onboardingComplete = true after completion
- [ ] Authed + complete user → /auth/login redirects to dashboard
- [ ] Authed + incomplete → redirected to /onboarding

## 2.3 — RBAC Middleware

- [ ] /dashboard/seeker → redirects to login if not authed
- [ ] /dashboard/seeker → redirects if user is RECRUITER
- [ ] /dashboard/recruiter → redirects if JOB_SEEKER
- [ ] /onboarding → accessible when authed + incomplete
- [ ] /onboarding → redirects to dashboard when complete
- [ ] /profile/edit → redirects to login if not authed
- [ ] /settings/* → redirects to login if not authed

## 2.4 — Job Seeker Profile — Personal Info

- [ ] GET /api/profile/me → returns profile for logged-in user
- [ ] Profile auto-created on first GET
- [ ] PATCH /api/profile/me → updates headline, city, workMode etc.
- [ ] Avatar upload → camera overlay, file picker, validation, preview update
- [ ] Banner upload → same flow, max 4MB

## 2.5 — Profile Sections (Experience + Skills)

### Experience
- [ ] Add → Sheet opens, submit → entry appears
- [ ] Edit / Delete work
- [ ] Drag handle visible, drag reorders, persists after refresh

### Skills
- [ ] Skill search autocomplete, add skill, proficiency, delete
- [ ] Drag to reorder → persists

## 2.6 — Resume Upload

- [ ] Upload PDF/DOC/DOCX → appears in list
- [ ] Reject > 5MB, non-document
- [ ] Set default, download, delete
- [ ] New resume uses defaultResumeVisibility from privacy

## 2.7 — Profile Completion Score

- [ ] Empty profile → 0; add headline/summary/location/experience/skills/resume → score increases
- [ ] Dashboard completion ring and missing list correct

## 2.8 — Public Profile

- [ ] /profile/[username] renders for PUBLIC profile
- [ ] Sections visible; Open to Work badge when enabled
- [ ] Non-PUBLIC shows restricted message; owner sees Edit

## 2.9 — Settings

- [ ] Account: name update, email read-only, password change (validates, invalidates others)
- [ ] Privacy: visibility, default resume visibility
- [ ] Security: Sign out all devices
- [ ] Settings nav: Account, Privacy, Security; active link highlighted

## 2.10 — Design System

- [ ] Inter font, primary/accent colors, dark mode
- [ ] ascend-card, ascend-input, btn-primary
- [ ] Navbar: Ascend wordmark; Footer: Ascend by Coheron
- [ ] Mobile: hamburger menu
