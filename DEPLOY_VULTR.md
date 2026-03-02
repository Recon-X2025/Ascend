# Deploy Ascend on Vultr

This guide covers deploying Ascend using Vultr services. Two approaches:

1. **Hybrid** (recommended): Vercel (Next.js) + Vultr (PostgreSQL, Redis, Object Storage)
2. **Full Vultr**: VPS for app + workers + Vultr Managed PostgreSQL/Redis/Object Storage

---

## Prerequisites

- Vultr account: [vultr.com](https://www.vultr.com)
- Domain (optional but recommended for production)
- All API keys from `.env.local.example` (Resend, Stripe/Razorpay, OAuth, etc.)

---

## Option A: Hybrid (Vercel + Vultr)

Best for getting to production quickly. Next.js runs on Vercel; data lives on Vultr.

### Step 1: Create Vultr Managed PostgreSQL

1. Log in to [Vultr](https://my.vultr.com) → **Products** → **Add** → **Databases**
2. Choose **PostgreSQL**, select plan and region (e.g. Singapore for India)
3. Create database; note **Host**, **Port**, **User**, **Password**
4. Enable **Trusted Sources** and add `0.0.0.0/0` (or Vercel IP ranges) for initial setup
5. Run migrations from your machine:
   ```bash
   DATABASE_URL="postgresql://user:password@host:port/defaultdb?sslmode=require" npx prisma migrate deploy
   npx prisma db seed
   ```

### Step 2: Create Vultr Managed Redis

1. **Products** → **Add** → **Databases** → **Redis**
2. Choose plan and region (same as PostgreSQL)
3. Note **Host**, **Port**, **Password**
4. Add trusted sources for Vercel / your IPs

### Step 3: Create Vultr Object Storage

1. **Products** → **Add** → **Object Storage**
2. Create a bucket (e.g. `ascend-prod`)
3. Go to **Object Storage** → **S3 API** → create access keys
4. Note: **Endpoint URL** (e.g. `https://sgp1.vultrobjects.com`), **Access Key**, **Secret Key**

### Step 4: Deploy to Vercel

1. Push your repo to GitHub (already done)
2. Go to [vercel.com](https://vercel.com) → **Add Project** → import `Recon-X2025/Ascend`
3. Add environment variables (from `.env.local.example`):

| Variable | Where to get |
|----------|--------------|
| `DATABASE_URL` | Vultr PostgreSQL connection string (SSL) |
| `REDIS_HOST` | Vultr Redis host |
| `REDIS_PORT` | Vultr Redis port |
| `REDIS_PASSWORD` | Vultr Redis password |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` or custom domain |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Same as NEXTAUTH_URL |
| `STORAGE_PROVIDER` | `vultr` |
| `VULTR_STORAGE_ENDPOINT` | e.g. `https://sgp1.vultrobjects.com` |
| `VULTR_STORAGE_ACCESS_KEY` | From Object Storage S3 API |
| `VULTR_STORAGE_SECRET_KEY` | From Object Storage S3 API |
| `VULTR_STORAGE_BUCKET` | e.g. `ascend-prod` |
| `VULTR_STORAGE_REGION` | e.g. `sgp1` |
| `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `LINKEDIN_CLIENT_ID`, etc. | Your existing keys |
| `CRON_SECRET` | `openssl rand -base64 32` (for Vercel cron auth) |

4. Deploy. Vercel will run crons from `vercel.json`.

### Step 5: Typesense (Search)

- Use [Typesense Cloud](https://cloud.typesense.org) or self-host on a small VPS
- Add `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL`, `TYPESENSE_API_KEY` to Vercel
- After deploy, run `npm run reindex:jobs` (with prod DATABASE_URL) to populate the index

### Step 6: BullMQ Workers (Optional for MVP)

Vercel does not run long-running workers. For full functionality (resume gen, fit score, etc.):

- Provision a small Vultr VPS (1 GB RAM)
- Run workers via PM2 (see Option B, Workers section)
- Point `DATABASE_URL`, `REDIS_HOST`, etc. to your Vultr services

For MVP, you can skip workers; core flows (auth, jobs, applications) work without them.

---

## Option B: Full Vultr (VPS)

Run app + workers on a Vultr Cloud Compute instance.

### Step 1: Vultr Managed Services

Same as Option A: create PostgreSQL, Redis, and Object Storage on Vultr.

### Step 2: Create a VPS

1. **Products** → **Add** → **Cloud Compute**
2. Choose Ubuntu 22.04, 2 GB RAM minimum, region near your DB
3. Deploy

### Step 3: Initial Server Setup

```bash
ssh root@YOUR_VPS_IP
apt update && apt upgrade -y
apt install -y nodejs npm nginx certbot python3-certbot-nginx
npm install -g pm2
```

### Step 4: Deploy the App

```bash
cd /var/www
git clone https://github.com/Recon-X2025/Ascend.git
cd Ascend
npm ci
```

Create `.env` (or `.env.production`) with all variables. Then:

```bash
npx prisma migrate deploy
npx prisma generate
npm run build
```

### Step 5: Run with PM2

```bash
pm2 start npm --name "ascend" -- start
pm2 save
pm2 startup  # enable on reboot
```

### Step 6: Nginx + SSL

```nginx
# /etc/nginx/sites-available/ascend
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/ascend /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d your-domain.com
```

### Step 7: Run Workers (Separate PM2 Processes)

Create `scripts/start-workers.ts` or use individual worker entry points. Example with PM2:

```bash
# Run each worker queue (simplified; in practice you may have a single worker entry)
pm2 start "npx ts-node -r tsconfig-paths/register workers/mentorship-expiry.ts" --name "mentorship-expiry"
# Add other workers as needed
pm2 save
```

---

## Environment Variables Checklist

Use `.env.local.example` as reference. Production must have:

- `NEXTAUTH_URL` = your public app URL
- `NEXTAUTH_SECRET` = strong random value
- `DATABASE_URL` = PostgreSQL (with `?sslmode=require` for managed DB)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `STORAGE_PROVIDER=vultr` + `VULTR_*` for Object Storage
- `TYPESENSE_*` for job search
- OAuth, Resend, Razorpay/Stripe, Daily.co, Deepgram as needed
- `CRON_SECRET` if using Vercel crons or cron-triggered APIs

---

## Post-Deploy

1. **Reindex jobs**: `DATABASE_URL=... TYPESENSE_*=... npm run reindex:jobs`
2. **Trusted sources**: Restrict DB/Redis to your app IPs after deploy
3. **Domain**: Point DNS to Vercel or your VPS
4. **Webhooks**: Update Razorpay, Stripe, Daily.co webhook URLs to production

---

## Quick Reference: Vultr Console

| Service | Vultr Path |
|---------|------------|
| Managed PostgreSQL | Products → Databases → PostgreSQL |
| Managed Redis | Products → Databases → Redis |
| Object Storage | Products → Object Storage |
| Cloud Compute (VPS) | Products → Cloud Compute |

For connection strings and firewall rules, use the Vultr dashboard for each product.
