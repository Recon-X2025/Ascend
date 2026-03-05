# Fix Registration & Auth (Vercel)

If "Create account" fails with 405/500 errors, add these in Vercel:

## 1. Vercel → ascend → Settings → Environment Variables

Add or update:

| Variable | Value |
|----------|-------|
| `SEEKER_PILOT_OPEN` | `true` (opens registration for **all roles**: job seeker, recruiter, mentor) |
| `NEXTAUTH_URL` | Your production URL (e.g. `https://ascend-karthikiyer25gmailcoms-projects.vercel.app`) — or omit if using trustHost |
| `NEXTAUTH_SECRET` | From before (or run `openssl rand -base64 32`) |

**NEXTAUTH_URL must match the URL you visit:**
- Preview: `https://ascend-XXXXX-karthikiyer25gmailcoms-projects.vercel.app`
- Production: `https://ascend.vercel.app` or `https://ascend.coheron.tech`

## 2. Redeploy

Deployments → ⋮ menu → **Redeploy**

## 3. 500 on /api/auth/error (common causes)

- **Database unreachable** → Ensure `DATABASE_URL` is correct. If using the VPS (lean setup), run `./scripts/fix-lean-vps.sh` and ensure port 5432 is open.
- **Google/LinkedIn not configured** → If you haven't set up OAuth, either add the credentials to Vercel OR leave them empty — the app now treats missing OAuth as optional; email/password sign-in will still work.
- **NEXTAUTH_SECRET missing** → Required. Run `openssl rand -base64 32` and add it.

## 4. Use the main Production URL (not deployment-specific)

If you see 401/405 on `ascend-karthikiyer25-8657-...vercel.app`, try the **canonical** production URL instead:  
**https://ascend-karthikiyer25gmailcoms-projects.vercel.app**  
(no `-8657` in the middle). Deployment-specific URLs can still be protected.

## 5. Fix Deployment Protection (fixes 401, 405, "Unexpected token <!DOCTYPE")

Deployment Protection blocks API routes and returns HTML login pages instead of JSON. Fix it:

1. Go to: https://vercel.com/karthikiyer25gmailcoms-projects/ascend/settings/deployment-protection
2. Under **Protection Scope**, select **None** (or "Standard Protection" with production domain set — production stays public on Hobby).
3. Save. Redeploy.

**Or** test on your **production URL** (ascend.coheron.tech or ascend.vercel.app) — production is usually public even with Standard Protection.

## 5. Other errors

- **500 on /api/auth/providers** → Same as above (DB or OAuth).
