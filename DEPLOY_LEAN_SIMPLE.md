# Deploy Lean — 3 Steps (Non-Technical)

Use your Vultr VPS (139.84.213.110) to run the database and save money. Follow these steps in order.

---

## Step 1: Fix and Start the VPS Services

Open **Terminal** (on Mac: press Cmd+Space, type "Terminal", press Enter).

Copy and paste this command, then press Enter:

```bash
cd /Users/kathikiyer/Documents/Elevio
./scripts/fix-lean-vps.sh 139.84.213.110
```

**When it asks for a password:** Type your VPS password from the Vultr dashboard (Server Information → click the eye icon to reveal it). You won’t see it as you type — that’s normal. Press Enter when done.

Wait for it to finish. It will print connection details at the end — keep the Terminal window open.

---

## Step 2: Run Database Setup

When Step 1 finishes, run these two commands (one at a time) in the same Terminal:

```bash
DATABASE_URL="postgresql://ascend:ascend123@139.84.213.110:5432/ascend" npx prisma migrate deploy
```

```bash
DATABASE_URL="postgresql://ascend:ascend123@139.84.213.110:5432/ascend" npx prisma db seed
```

If both finish without errors, the database is ready.

---

## Step 3: Add Variables to Vercel

1. Go to [vercel.com](https://vercel.com) → your Ascend project → **Settings** → **Environment Variables**

2. Add or update these (Production):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://ascend:ascend123@139.84.213.110:5432/ascend` |
| `REDIS_HOST` | `139.84.213.110` |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | `ascend123` |
| `TYPESENSE_HOST` | `139.84.213.110` |
| `TYPESENSE_PORT` | `8109` |
| `TYPESENSE_PROTOCOL` | `http` |
| `TYPESENSE_API_KEY` | `ascend_search_key` |

3. If you had Neon / Upstash / Typesense Cloud variables before, you can remove or leave them; these new ones will take precedence.

4. **Redeploy:** Deployments → your latest deploy → ⋮ menu → **Redeploy**

---

## Done

Your app will now use the VPS for Postgres, Redis, and search instead of paid managed services.

**Cost:** VPS (~$10–12/mo) + Vercel (Hobby = $0) ≈ **$10–12/month**
