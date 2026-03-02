# LinkedIn OAuth Test Checklist

## Pre-test requirements

- [ ] `LINKEDIN_CLIENT_ID` set in `.env.local`
- [ ] `LINKEDIN_CLIENT_SECRET` set in `.env.local`
- [ ] LinkedIn app has redirect URI: `http://localhost:3000/api/auth/callback/linkedin`
- [ ] LinkedIn app has OAuth 2.0 scopes: openid, profile, email
- [ ] LinkedIn app is in "Active" status (not development/review)

## Test flows

- [ ] Click "Continue with LinkedIn" on `/auth/login`
- [ ] Redirects to LinkedIn consent screen
- [ ] After consent: redirects back to `/auth/callback`
- [ ] Session created: `GET /api/auth/session` returns user object
- [ ] `user.role` and `user.onboardingComplete` present in session
- [ ] New user: redirected to `/onboarding`
- [ ] Existing user: redirected to `/dashboard/seeker` (or role dashboard)
- [ ] Signing in again with same LinkedIn: links to existing account
- [ ] Error page shows friendly message if user cancels

## Known issues

- LinkedIn OIDC requires scope `openid profile email` (not old API scopes)
- Email must be verified on LinkedIn account
- Corporate LinkedIn accounts may block OAuth consent
