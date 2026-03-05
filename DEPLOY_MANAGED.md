# Fully Managed Deployment — No Server to Run

This guide uses **only cloud services**. Nothing runs on your machine or a VPS. Everything is hosted by the providers and runs 24/7 automatically.

**Estimated cost:** ~$7–35/mo (depending on Typesense plan and usage)

---

## What You’ll Use

| Service | Purpose | Cost |
|--------|---------|------|
| **Vercel Hobby** | Host your Next.js app | $0 |
| **Neon** | PostgreSQL database | $0 (free tier) |
| **Upstash Redis** | Cache & rate limiting | $0 (free tier) |
| **Typesense Cloud** | Job search | ~$7–25/mo |
| **Cloudflare R2** | File storage (resumes, etc.) | $0 (10 GB free) |

---

## Step 1: Create a Neon Database (Free)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project (e.g. "ascend")
3. Copy the **connection string** (looks like `postgresql://user:password@xxx.neon.tech/neondb?sslmode=require`)
4. Save it — this is your `DATABASE_URL`

---

## Step 2: Create Upstash Redis (Free)

1. Go to [console.upstash.com](https://console.upstash.com) and sign up
2. Create a new Redis database
3. In **REST API** or **Connect**, find the Redis URL (e.g. `rediss://default:xxx@xxx.upstash.io:6379`)
4. Copy it — this is your `REDIS_URL`

---

## Step 3: Create Typesense Cloud (Paid)

1. Go to [cloud.typesense.org](https://cloud.typesense.org) and sign up
2. Create a cluster (0.5 GB is enough to start, ~$7/mo)
3. Note: **Host**, **Port**, **Protocol** (https), **API Key**
4. These become `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL`, `TYPESENSE_API_KEY`

---

## Step 4: Create Cloudflare R2 Bucket (Free)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage**
2. Create bucket `ascend-prod`
3. **Manage R2 API Tokens** → Create token
4. Copy: **Endpoint** (e.g. `https://ACCOUNT_ID.r2.cloudflarestorage.com`), **Access Key ID**, **Secret Access Key**
5. Note your **Account ID** from the sidebar

---

## Step 5: Add Environment Variables in Vercel

1. Go to [vercel.com](https://vercel.com) → your ascend project → **Settings** → **Environment Variables**
2. Add these (for **Production**):

| Name | Value |
|------|-------|
| `DATABASE_URL` | Neon connection string from Step 1 |
| `REDIS_URL` | Upstash Redis URL from Step 2 (`rediss://...`) |
| `TYPESENSE_HOST` | Typesense host (e.g. `xxx.a1.typesense.net`) |
| `TYPESENSE_PORT` | Typesense port (often `443`) |
| `TYPESENSE_PROTOCOL` | `https` |
| `TYPESENSE_API_KEY` | Typesense API key |
| `NEXTAUTH_URL` | `https://ascend.vercel.app` (or your domain) |
| `NEXT_PUBLIC_APP_URL` | Same as NEXTAUTH_URL |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` and paste |
| `STORAGE_PROVIDER` | `vultr` |
| `VULTR_STORAGE_ENDPOINT` | `https://ACCOUNT_ID.r2.cloudflarestorage.com` |
| `VULTR_STORAGE_REGION` | `auto` |
| `VULTR_STORAGE_ACCESS_KEY` | R2 Access Key ID |
| `VULTR_STORAGE_SECRET_KEY` | R2 Secret Access Key |
| `VULTR_STORAGE_BUCKET` | `ascend-prod` |

Also add any OAuth keys (Google, LinkedIn), Resend, etc. from `.env.local.example`.

---

## Step 6: Run Migrations

From your project folder:

```bash
cd /Users/kathikiyer/Documents/Elevio

# Use your Neon connection string
DATABASE_URL="postgresql://user:password@xxx.neon.tech/neondb?sslmode=require" npx prisma migrate deploy

DATABASE_URL="postgresql://user:password@xxx.neon.tech/neondb?sslmode=require" npx prisma db seed
```

---

## Step 7: Deploy

```bash
vercel --prod
```

Your app will be live at your Vercel URL.

---

## Step 8: Reindex Jobs (Optional)

If you have jobs in the database and want search to work:

```bash
DATABASE_URL="your-neon-url" \
TYPESENSE_HOST="xxx" TYPESENSE_PORT="443" TYPESENSE_PROTOCOL="https" TYPESENSE_API_KEY="xxx" \
npm run reindex:jobs
```

---

## Note: No Workers

Workers (resume generation, fit score, mentorship expiry, etc.) need a long-running process. Without a VPS, workers won’t run. Core flows (auth, jobs, applications, company pages) work without them.

---

## Cost Summary

| Service | Cost |
|---------|------|
| Vercel Hobby | $0 |
| Neon | $0 |
| Upstash | $0 |
| Typesense Cloud | ~$7–25/mo |
| Cloudflare R2 | $0 |
| **Total** | **~$7–35/mo** |
