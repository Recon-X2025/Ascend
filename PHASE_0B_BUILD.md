# Phase 0B: Free JD Source Scripts — Build Summary

## Overview

Phase 0B adds five free JD source scripts that feed into the existing Phase 0 pipeline (`RawJD` → parse → embed → taxonomy). All output goes into `RawJD` with deduplication by SHA-256 hash. No parsing is done in source scripts — only population of `RawJD`.

## Deliverables

### 1. Schema

- **RawJD.source** — `@default("manual")` added; values: `kaggle` | `adzuna` | `naukri-rss` | `careers-page` | `remoteok` | `manual`.
- **Migration:** `phase-0b-rawjd-source` (sets default only).

### 2. Shared ingestion utility

- **scripts/ingestion/lib/upsert-raw-jd.ts**
  - `upsertRawJD({ sourceUrl, rawText, source })` — hashes rawText (SHA-256), skips if hash exists, else creates `RawJD`.
  - `buildStats()` — returns `{ record(result), error(), print() }` for inserted/skipped/errors.
  - Exports `prisma` for `$disconnect()` in scripts.

### 3. Source scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Kaggle | `ingest:kaggle --file <path> --format naukri\|linkedin\|indeed\|generic` | CSV import; Naukri format uses marketing_sample columns (Job Title, Job Salary, Job Experience Required, Key Skills, Role Category, Location, Functional Area, Industry, Role); no Company/Job Description column — validation uses skills/roleCategory |
| Adzuna | `ingest:adzuna` | REST API (India); env: `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`; 1 req/sec |
| Naukri RSS | `ingest:rss` | 22 RSS feeds; 2 sec delay between feeds |
| Careers pages | `ingest:careers` | Playwright scraper for 18 Indian company careers pages |
| RemoteOK | `ingest:remoteok` | Public API, no key; India + remote filter |

All scripts use `upsertRawJD()` and `buildStats()`; no direct `prisma.rawJD.create()` in sources.

### 4. package.json scripts

- `ingest:kaggle`, `ingest:adzuna`, `ingest:rss`, `ingest:careers`, `ingest:remoteok`
- `ingest:sources` = remoteok + adzuna + rss (no kaggle/careers — file arg and slow run)
- `ingest:all` = ingest:sources → parse → embed → taxonomy

### 5. Environment and docs

- **.env.local.example:** `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`
- **docs/SOURCES.md:** Source registry (ToS, rate limits, run schedule, Kaggle usage, adding new sources)

### 6. Dependencies

- `rss-parser`, `playwright` installed. Run `npx playwright install chromium` before `ingest:careers`.

## Key Files

| File | Purpose |
|------|---------|
| prisma/schema.prisma | RawJD.source default |
| prisma/migrations/*_phase_0b_rawjd_source/migration.sql | SET DEFAULT 'manual' |
| scripts/ingestion/lib/upsert-raw-jd.ts | Dedup + insert helper |
| scripts/ingestion/sources/kaggle.ts | Kaggle CSV importer |
| scripts/ingestion/sources/adzuna.ts | Adzuna India API |
| scripts/ingestion/sources/naukri-rss.ts | Naukri RSS parser |
| scripts/ingestion/sources/careers-pages.ts | Playwright careers scraper |
| scripts/ingestion/sources/remoteok.ts | RemoteOK API |
| docs/SOURCES.md | Source registry |

## Run order (first time)

```bash
npx prisma migrate dev --name phase-0b-rawjd-source   # if not already applied
npm install rss-parser playwright
npx playwright install chromium

# Kaggle (after downloading CSVs from kaggle.com)
# Naukri: use marketing_sample_for_naukri_com column names (e.g. naukri-30k.csv)
npm run ingest:kaggle -- --file ./data/naukri-30k.csv --format naukri
npm run ingest:kaggle -- --file ./data/linkedin-jobs.csv --format linkedin

# Live API sources
npm run ingest:remoteok
npm run ingest:adzuna   # requires ADZUNA_APP_ID, ADZUNA_APP_KEY in .env
npm run ingest:rss

# Careers (slow)
npm run ingest:careers

# Downstream pipeline (unchanged)
npm run ingest:parse
npm run ingest:embed
npm run ingest:taxonomy
```

## Exit checklist

- [ ] RawJD.source default applied; migration phase-0b-rawjd-source applied
- [ ] upsertRawJD() and buildStats() in lib/upsert-raw-jd.ts
- [ ] ingest:kaggle with naukri/linkedin/indeed/generic formats (Naukri: Job Title, Job Salary, Job Experience Required, Key Skills, Role Category, Location, Functional Area, Industry, Role; ~29k inserted from 30k CSV)
- [ ] ingest:adzuna with rate limit and 429 handling
- [ ] ingest:rss parses 22 Naukri feeds with delay
- [ ] ingest:careers Playwright scraper for 18 companies
- [ ] ingest:remoteok filters India/remote
- [ ] All scripts use upsertRawJD(); package.json and docs/SOURCES.md updated; ADZUNA in .env.example; rss-parser and playwright installed
