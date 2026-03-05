# Fix Ascend on Vercel — Simple Steps

**500 or "Registration failed"?** `DATABASE_URL` in Vercel must be a **Neon** URL (postgresql://...neon.tech/...), NOT your VPS.

**504 on session?** Ensure `NEXTAUTH_SECRET` is set (generate with: `openssl rand -base64 32`). Set `NEXTAUTH_URL` to `https://ascend-chi-nine.vercel.app` (or your production domain).

**API routes hanging (pending forever)?** Typesense and Redis (if Vultr-hosted) may be unreachable from Vercel. Code now has 3s timeouts: Typesense falls back to Prisma for jobs; Redis operations return empty/degraded responses so routes don't hang.

Everything you change is in **websites** (no code editing needed, except one push at the end). Here’s where each update happens.

---

## WHERE: Vercel (vercel.com)

**1. Sign in:** [vercel.com](https://vercel.com) → sign in with your account

**2. Open your project:** Click the **ascend** project

**3. Go to Settings:** In the left sidebar, click **Settings**

**4. Environment Variables:** Under Settings, click **Environment Variables**

**5. Edit these:**
- Click **Edit** next to **DATABASE_URL** → paste your Neon connection string → Save
- Click **Edit** next to **NEXTAUTH_URL** → set to `https://ascend-chi-nine.vercel.app` → Save
- Click **Edit** next to **NEXT_PUBLIC_APP_URL** → set to `https://ascend-chi-nine.vercel.app` → Save  
- If **REDIS_URL** exists: Edit it → paste your Upstash Redis URL → Save  
  If it doesn’t: Click **Add New** → Name: `REDIS_URL`, Value: your Upstash Redis URL → Save

**6. Deployment Protection:** In the left sidebar, click **Deployment Protection**  
- Find **Vercel Authentication**  
- Turn **OFF** the "Enabled for" switch (make it grey)

**7. Redeploy:** In the left sidebar, click **Deployments**  
- Find the latest deployment (top of the list)  
- Click the **three dots (⋮)** on the right  
- Click **Redeploy**  
- Wait until it finishes (usually 1–2 minutes)

---

## WHERE: Neon (neon.tech)

**1. Sign in:** [neon.tech](https://neon.tech) → sign in or create an account

**2. Open project:** Click your project (or create one)

**3. Copy connection string:** Click **Connection** → **Copy** to copy the database URL  
(This is the value you paste into Vercel’s `DATABASE_URL` above.)

---

## WHERE: Upstash (console.upstash.com)

**1. Sign in:** [console.upstash.com](https://console.upstash.com) → sign in or create an account

**2. Create database:** Click **Create Database** → choose a region → Create

**3. Copy Redis URL:** Open the database → go to the **REST API** tab → copy the **Redis URL**  
(This is the value you paste into Vercel’s `REDIS_URL` above.)

---

## WHERE: Your code (push the fix)

The fix for the blank preview is already in your project. To deploy it:

1. In **Cursor**, open the **Source Control** panel (sidebar icon that looks like a branching diagram).
2. Check the changed files (e.g. `app/layout.tsx`, `FIX_NOW.md`).
3. Add a short message in the box (e.g. “Fix blank preview”).
4. Click the **✓ Commit** button.
5. Click **Sync** (or **Push**) so Vercel gets the update.

Vercel will redeploy automatically if it’s connected to your repo. If it doesn’t, go back to [vercel.com](https://vercel.com) → **ascend** → **Deployments** → **⋮** → **Redeploy**.

---

## WHERE: Use your app

Use this URL only: **https://ascend-chi-nine.vercel.app**  
Don’t use URLs that have random numbers (e.g. `1lo3c556c`) in them.
