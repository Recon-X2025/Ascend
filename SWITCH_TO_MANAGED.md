# Fix: Switch from VPS to Managed (Neon + Upstash)

**Problem:** Vercel cannot reach your VPS at 139.84.213.110. That causes 500 errors on auth.

**Solution:** Use Neon (Postgres) and Upstash (Redis) instead — they work from Vercel.

---

## Do this now

### 1. Get your Neon connection string
You already used Neon before. Find it at [neon.tech](https://neon.tech) → your project → Connection string.

Looks like: `postgresql://user:pass@xxx.neon.tech/neondb?sslmode=require`

### 2. Get your Upstash Redis URL
At [console.upstash.com](https://console.upstash.com) → your database → REST API or Connect.

Looks like: `rediss://default:xxx@xxx.upstash.io:6379`

### 3. Update Vercel Environment Variables

Vercel → ascend → Settings → Environment Variables. **Edit** these:

| Variable | Change to |
|----------|-----------|
| `DATABASE_URL` | Your **Neon** connection string (replace the VPS one) |
| `REDIS_URL` | Your **Upstash** Redis URL (`rediss://...`) |
| Remove or leave blank | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (use REDIS_URL instead) |

### 4. Redeploy
Deployments → ⋮ → Redeploy.

### 5. Test the fix
After deploy, open: **https://your-app-url.vercel.app/api/health**

- **`{"ok":true,"db":"connected"}`** → DB works. Auth should work too.
- **`{"ok":false,"db":"failed","error":"..."}`** → DB still unreachable. The `error` field shows why. Double-check DATABASE_URL and that you redeployed after changing it.

---

## Why this works

- **VPS**: Your Mac can reach it. Vercel’s servers often cannot (firewall, network).
- **Neon / Upstash**: Hosted services built for serverless. Vercel can reach them.

Your local `.env.local` can keep using the VPS. Production on Vercel uses Neon + Upstash.
