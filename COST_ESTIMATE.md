# Ascend — Monthly Cost Estimate

Rough monthly costs to run Ascend in production. Prices as of early 2025; check each provider for current pricing.

---

## Option A: Hybrid (Vercel + Vultr) — Recommended

| Service | Cost | Notes |
|--------|------|-------|
| **Vercel Pro** | $20/mo | $20/user/month; includes $20 usage credit. Light traffic often stays within credit. |
| **Vultr Managed PostgreSQL** | ~$15–30/mo | Starts at ~$15 for entry tier; more for replicas/backups. |
| **Vultr Managed Redis (Valkey)** | ~$15–30/mo | Similar to PostgreSQL. |
| **Vultr Object Storage** | $18/mo | Standard tier, 1 TB storage + 1 TB transfer. |
| **Typesense Cloud** | ~$7–25/mo | Pay-as-you-go; ~$7 for 0.5 GB, ~$15–25 for 1 GB. |
| **Vultr VPS (workers)** | ~$10–12/mo | Optional; 2 GB RAM for BullMQ workers (resume gen, fit score). |

**Estimated total (minimal):** ~$75–85/mo  
**Estimated total (with workers):** ~$85–97/mo  

---

## Option B: Full Vultr (VPS + Managed Services)

| Service | Cost | Notes |
|--------|------|-------|
| **Vultr Cloud Compute (2 GB)** | ~$10–12/mo | Runs Next.js app + workers. |
| **Vultr Managed PostgreSQL** | ~$15–30/mo | Same as Option A. |
| **Vultr Managed Redis** | ~$15–30/mo | Same as Option A. |
| **Vultr Object Storage** | $18/mo | Same as Option A. |
| **Typesense Cloud** | ~$7–25/mo | Same as Option A. |

**Estimated total:** ~$65–112/mo  

---

## Usage-Based (Pay Per Use)

| Service | Typical Cost | Notes |
|--------|--------------|-------|
| **Resend** | $0–20/mo | 3,000 emails/mo free; $20/mo for 50k. |
| **Razorpay / Stripe** | % of revenue | No fixed cost; fees per transaction. |
| **Daily.co** | $0–99/mo | Free tier for low usage; paid for heavy video. |
| **Deepgram** | Pay per minute | Transcription; varies with usage. |
| **OpenAI / Anthropic** | Pay per request | AI features; varies. |
| **Adzuna** | $0 | Free tier for job listings. |

---

## Vercel Pro Usage Details

- **Base:** $20/user/month with $20 included credit.
- **Overage:** Function invocations (~$0.60/million), CPU/memory above included limits.
- For typical low–medium traffic, $20 credit often covers usage.
- More traffic or heavy serverless use can add $5–50+/mo.

---

## Summary

| Setup | Base Cost (approx) |
|-------|-------------------|
| **Lean** (Hobby + single VPS + R2) | **~$25–35/mo** |
| Hybrid (Vercel + Vultr, no workers) | **$75–85/mo** |
| Hybrid + workers | **$85–97/mo** |
| Full Vultr | **$65–112/mo** |

Plus usage-based costs (email, AI, video, payments) depending on product usage.

---

## Lean Setup (~$25–35/mo)

Apply all cost-saving measures for **~$25–35/month** instead of ~$75–97. See [DEPLOY_LEAN.md](./DEPLOY_LEAN.md) for step-by-step instructions.

| Setup | Base Cost |
|-------|-----------|
| **Lean** (Hobby + VPS + R2) | **~$25–35/mo** |

---

## Ways to Reduce Costs

1. **Use Vercel Hobby** (if acceptable): $0 for hosting; Pro features not needed at first.
2. **Self-host Typesense** on the Vultr VPS: ~$0 extra if you already run the app there.
3. **Skip workers initially**: Core flows work; add workers when you need resume gen, fit scores, etc.
4. **Start with Vultr VPS for DB + Redis**: Cheaper than managed (~$12–24/mo for a single 2–4 GB VPS) but more setup and maintenance.
5. **Object Storage**: Use Cloudflare R2 free tier (10 GB) — S3-compatible; set `VULTR_STORAGE_*` to R2 credentials (same client works).
