# Ascend JD Ingestion — Source Registry

## Active Sources

| Source | Script | Type | Volume | ToS Status | Rate Limit | Last Run |
|--------|--------|------|--------|------------|------------|----------|
| Kaggle datasets | `ingest:kaggle` | CSV/JSON import | 20–50k (one-time) | ✅ Public datasets, free download | N/A | - |
| Adzuna India API | `ingest:adzuna` | REST API | 25k calls/month free | ✅ API ToS — permitted | 1 req/sec | - |
| Naukri RSS | `ingest:rss` | RSS feeds | ~5–10k/month | ✅ RSS designed for consumption | 2 sec/feed | - |
| Company careers pages | `ingest:careers` | Playwright scraper | ~2–5k ongoing | ✅ Public pages, company wants applications | 3 sec/page | - |
| RemoteOK | `ingest:remoteok` | REST API (no key) | ~1k/month | ✅ Explicitly public API | N/A | - |

## Recommended Run Schedule

- **Daily (cron):** `ingest:sources` → `ingest:parse` → `ingest:embed`
- **Weekly:** `ingest:careers` (Playwright — slow, run separately)
- **One-time bootstrap:** `ingest:kaggle --file <path> --format <format>`
- **Monthly:** `ingest:taxonomy` (regenerate keyword/skills taxonomy from accumulated ParsedJDs)

## Kaggle Datasets

Download from https://www.kaggle.com — free account required.

Recommended datasets:

- Search "naukri india jobs" — several datasets with 10k–100k rows
- Search "linkedin jobs india" — good salary disclosure rate
- Search "indeed india jobs" — broad coverage

After download, run:

```bash
npm run ingest:kaggle -- --file ./data/naukri-dataset.csv --format naukri
npm run ingest:kaggle -- --file ./data/linkedin-dataset.csv --format linkedin
```

## Field Mapping

All sources produce the same `rawText` blob format fed to the GPT-4o parser:

```
Job Title: <title>
Company: <company>
Location: <location>
Experience: <experience> (where available)
Salary: <salary> (where available)
Skills: <skills> (where available)
Description:
<full description text>
```

## Adding a New Source

1. Create `scripts/ingestion/sources/<source-name>.ts`
2. Use `upsertRawJD()` from `scripts/ingestion/lib/upsert-raw-jd.ts`
3. Set `source` field to a unique string identifier
4. Add npm script to `package.json`
5. Add row to this table with ToS status confirmed
6. Never scrape a source without confirming robots.txt allows it
