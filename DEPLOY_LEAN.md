# Lean Deployment — ~$25–35/month

This guide implements all cost-saving measures from [COST_ESTIMATE.md](./COST_ESTIMATE.md). Target: **~$25–35/mo** instead of ~$75–97/mo.

**Not technical?** Use **[DEPLOY_LEAN_BEGINNER.md](./DEPLOY_LEAN_BEGINNER.md)** — step-by-step, beginner-friendly.

---

## Summary of Changes

| Measure | Before | After |
|---------|--------|-------|
| 1. Vercel Hobby | Pro $20/mo | **$0** |
| 2. Self-host Typesense | Cloud $7–25/mo | **$0** (on VPS) |
| 3. Skip workers | Optional VPS $10–12 | **$0** (add later) |
| 4. VPS for DB + Redis | Managed $30–60/mo | **$0** (on same VPS) |
| 5. Object storage | Vultr $18/mo | **$0** (R2 free tier or local on VPS) |

---

## Step 1: Use Vercel Hobby ($0)

Link your project to your **personal** scope (Hobby plan = $0):

```bash
rm -rf .vercel
vercel link --yes --scope karthikiyer25gmailcoms-projects --project ascend
```

Replace `karthikiyer25gmailcoms-projects` with your personal Vercel username if different. List scopes with `vercel teams list`.

**Trade-off:** No team features, slightly lower limits. Fine for MVP.

---

## Step 2–4: Single VPS for Postgres, Redis, and Typesense

One Vultr Cloud Compute instance (~$10–12/mo) runs everything.

### 2a. Create VPS

1. [Vultr](https://my.vultr.com) → **Products** → **Add** → **Cloud Compute**
2. Ubuntu 22.04, **4 GB RAM** (needed for Postgres + Redis + Typesense)
3. Deploy; note the **IP address**

### 2b. Install Docker on VPS

```bash
ssh root@YOUR_VPS_IP
apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2
systemctl enable docker && systemctl start docker
```

### 2c. Deploy Postgres, Redis, Typesense

```bash
cd /opt
git clone https://github.com/Recon-X2025/Ascend.git
cd Ascend
```

Create `.env.lean`:

```env
POSTGRES_PASSWORD=your_strong_password
REDIS_PASSWORD=your_redis_password
TYPESENSE_API_KEY=your_typesense_api_key
```

Then:

```bash
docker compose -f docker-compose.lean.yml up -d
```

### 2d. Open firewall (allow Vercel + your IP)

```bash
# Allow PostgreSQL, Redis, Typesense from anywhere (or restrict to Vercel IPs)
ufw allow 5432/tcp
ufw allow 6379/tcp
ufw allow 8109/tcp
ufw allow 22/tcp
ufw enable
```

### 2e. Run migrations

From your **local machine** (or the VPS if Node is installed):

```bash
DATABASE_URL="postgresql://ascend:your_strong_password@YOUR_VPS_IP:5432/ascend" npx prisma migrate deploy
DATABASE_URL="postgresql://ascend:your_strong_password@YOUR_VPS_IP:5432/ascend" npx prisma db seed
```

---

## Step 5: Object Storage — Use Cloudflare R2 Free Tier ($0)

R2 is S3-compatible. Use the existing Vultr storage config with R2 credentials:

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → Create bucket `ascend-prod`
2. **R2** → **Manage R2 API Tokens** → Create token with read/write
3. In Vercel env vars, set:

| Variable | Value |
|----------|-------|
| `STORAGE_PROVIDER` | `vultr` |
| `VULTR_STORAGE_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `VULTR_STORAGE_REGION` | `auto` |
| `VULTR_STORAGE_ACCESS_KEY` | R2 Access Key ID |
| `VULTR_STORAGE_SECRET_KEY` | R2 Secret Access Key |
| `VULTR_STORAGE_BUCKET` | `ascend-prod` |

Get `<ACCOUNT_ID>` from R2 overview. Free tier: 10 GB storage, 10M requests/mo.

**Alternative (Full Vultr only):** If you run the app on the VPS (not Vercel), use `STORAGE_PROVIDER=local` and `LOCAL_STORAGE_PATH=/var/ascend/uploads` — no object storage cost.

---

## Vercel Environment Variables (Lean Setup)

Set in [Vercel Dashboard](https://vercel.com) → Project → Settings → Environment Variables:

| Variable | Where |
|----------|-------|
| `DATABASE_URL` | `postgresql://ascend:PASSWORD@VPS_IP:5432/ascend` |
| `REDIS_HOST` | VPS IP |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | From `.env.lean` |
| `TYPESENSE_HOST` | VPS IP |
| `TYPESENSE_PORT` | `8109` |
| `TYPESENSE_PROTOCOL` | `http` |
| `TYPESENSE_API_KEY` | From `.env.lean` |
| `NEXTAUTH_URL` | `https://ascend.vercel.app` or your domain |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Same as NEXTAUTH_URL |
| `STORAGE_PROVIDER` | `vultr` (+ R2 vars above) |
| OAuth, Resend, etc. | From `.env.local.example` |

---

## Skip Workers Initially

Core flows (auth, jobs, applications, company pages) work **without** BullMQ workers. Defer workers (resume gen, fit score, mentorship expiry) until you need them. See [DEPLOY_VULTR.md](./DEPLOY_VULTR.md) Option B Step 7 when you add workers.

---

## Post-Deploy

1. **Reindex jobs** (local, with prod DATABASE_URL + TYPESENSE):
   ```bash
   DATABASE_URL="postgresql://ascend:PASSWORD@VPS_IP:5432/ascend" \
   TYPESENSE_HOST=VPS_IP TYPESENSE_PORT=8109 TYPESENSE_PROTOCOL=http TYPESENSE_API_KEY=xxx \
   npm run reindex:jobs
   ```

2. **Restrict DB/Redis to Vercel IPs** (optional, for security): [Vercel IP ranges](https://vercel.com/docs/security/ip-addresses); add to UFW rules.

3. Deploy: `vercel --prod` or push to GitHub (if connected).

---

## Lean Cost Summary

| Item | Cost |
|------|------|
| Vercel Hobby | $0 |
| Vultr VPS (4 GB) | ~$20–24/mo |
| Cloudflare R2 | $0 (free tier) |
| **Total** | **~$25–35/mo** |

For minimal traffic, a **2 GB VPS** (~$10–12/mo) may work; 4 GB is recommended for production.
