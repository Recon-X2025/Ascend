# Phase 0: Pre-Launch Data Layer (JD Ingestion) — Build Summary

**Project:** Ascend  
**Phase:** 0 — JD Ingestion (runs in parallel; no dependency on app features)  
**Build date:** 2025-02-27

---

## Goal

Eliminate the AI cold-start problem by building a **JD ingestion pipeline** that populates keyword banks, a skills taxonomy, a vector store, and a salary corpus **before** the first real user signs up. Every AI feature — Phase 2A keyword optimiser, Phase 5A fit score, Phase 6A JD optimiser, Phase 8 salary estimator, Phase 10B skills gap — depends on this data being present and rich on day one.

**Environment:** Localhost (Next.js dev, local PostgreSQL, local Redis). Scripts run via `ts-node` or npm scripts. No production deployment required for Phase 0.

---

## 0.1 — Prisma Schema (Ingestion Models)

Four new models added to `prisma/schema.prisma`. **No existing models modified.**

| Model | Purpose |
|-------|---------|
| **RawJD** | Raw job text: sourceUrl (unique), rawText, hash (SHA-256, unique), source (e.g. kaggle-naukri, manual), scrapedAt, parsedAt, parseError. |
| **ParsedJD** | Structured JD: rawJdId → RawJD; title, seniority, industry, location, workMode; skills (JSON mustHave/niceToHave), keywords[], responsibilities[]; salaryMin/Max, currency; tone, companySize; promptVersion, parsedAt. |
| **JDEmbedding** | One embedding per ParsedJD: parsedJdId, embedding (JSON float[]), model (e.g. text-embedding-3-small), createdAt. |
| **JDSalarySignal** | Salary corpus: parsedJdId, role, seniority, location, salaryMin/Max, currency; index (role, location). |

**Migration:** Run when `DATABASE_URL` is set:

```bash
npx prisma migrate dev --name phase-0-jd-ingestion
```

---

## 0.2 — AI Prompt (JD Parser)

- **lib/ai/prompts/jd-parse.ts**
  - `JD_PARSE_PROMPT_VERSION = "1.0.0"`
  - `JD_PARSE_SYSTEM_PROMPT` — expert job description analyser; valid JSON only.
  - `buildJDParsePrompt(rawText)` — returns user prompt with schema (title, seniority, industry, location, workMode, skills, keywords, responsibilities, salary*, currency, tone, companySize); rules for normalisation; JD text truncated to 6000 chars.

---

## 0.3 — Ingestion Scripts

| Script | Purpose |
|--------|---------|
| **scripts/ingestion/load-csv.ts** | Load Kaggle CSV into RawJD. Column maps: `kaggle-naukri`, `kaggle-linkedin`. Dedup by SHA-256 of full text. CLI: `--file <path> --source <source-name>`. |
| **scripts/ingestion/load-manual.ts** | Single JD: from `--file` or stdin. Optional `--url`, `--source` (default `manual`). Dedup by hash. |
| **scripts/ingestion/parser.ts** | Batch parse unparsed RawJDs with GPT-4o; create ParsedJD + JDSalarySignal when salary present; set parseError on failure. City normalisation (e.g. Bengaluru → Bangalore). CLI: `--limit`, `--batch` (default 100, 25). |
| **scripts/ingestion/embed.ts** | Embed ParsedJDs without JDEmbedding using `text-embedding-3-small`. Builds text from title, seniority, industry, location, workMode, skills, keywords, responsibilities. CLI: `--limit` (default 1000). |
| **scripts/ingestion/generate-taxonomy.ts** | Read all ParsedJDs; write **lib/data/keywords-by-role.ts** (top 30 keywords per role) and **lib/data/skills-taxonomy.ts** (top 25 skills per role, with frequency %). Roles with 10+ JDs only. Helpers: `getTopSkillsForRole`, `isSkillCommonForRole`. |
| **scripts/ingestion/stats.ts** | Pipeline status: raw/parsed/embedded/salary counts, top roles/locations/sources, target progress bars (50k JDs, 5k salary signals). |

---

## 0.4 — npm Scripts

| Script | Command |
|--------|---------|
| ingest:load-csv | `ts-node scripts/ingestion/load-csv.ts` |
| ingest:load-manual | `ts-node scripts/ingestion/load-manual.ts` |
| ingest:parse | `ts-node scripts/ingestion/parser.ts` |
| ingest:embed | `ts-node scripts/ingestion/embed.ts` |
| ingest:taxonomy | `ts-node scripts/ingestion/generate-taxonomy.ts` |
| ingest:stats | `ts-node scripts/ingestion/stats.ts` |
| ingest:all | parse → embed → taxonomy |

---

## 0.5 — API Route (Admin)

- **GET /api/ingestion/stats**
  - **Auth:** `getServerSession(authOptions)`; must be **PLATFORM_ADMIN**.
  - **Response:** `{ totalRaw, parsedCount, embeddedCount, salarySignalCount, unparsed, unembedded, topRoles, topSources }`.
  - For use by Admin UI later.

---

## Dependencies & Config

- **Installed:** `csv-parse` (Kaggle CSV import).
- **Existing:** `openai`, `@prisma/client`; `@types/node` (dev).
- **tsconfig.json:** `"ts-node": { "esm": false, "transpileOnly": true }`.
- **Environment:** `DATABASE_URL`, `OPENAI_API_KEY` (parser + embedder).

---

## Key Files

| Area | Path |
|------|------|
| Schema | prisma/schema.prisma (RawJD, ParsedJD, JDEmbedding, JDSalarySignal) |
| Prompt | lib/ai/prompts/jd-parse.ts |
| Generated data | lib/data/keywords-by-role.ts, lib/data/skills-taxonomy.ts |
| Loaders | scripts/ingestion/load-csv.ts, scripts/ingestion/load-manual.ts |
| Parser | scripts/ingestion/parser.ts |
| Embedder | scripts/ingestion/embed.ts |
| Taxonomy | scripts/ingestion/generate-taxonomy.ts |
| Stats | scripts/ingestion/stats.ts |
| API | app/api/ingestion/stats/route.ts |

---

## Suggested First Run (After Migration)

```bash
# 1. Pipeline check with 5 manual JDs (paste or --file)
npm run ingest:stats                    # e.g. 5 raw, 0 parsed

# 2. Parse
npm run ingest:parse -- --limit 5 --batch 5
npm run ingest:stats                    # 5 parsed

# 3. Embed
npm run ingest:embed -- --limit 5
npm run ingest:stats                    # 5 embedded

# 4. Taxonomy (sparse with 5 JDs, but confirms flow)
npm run ingest:taxonomy

# 5. Load Kaggle CSV
npm run ingest:load-csv -- --file ./data/naukri.csv --source kaggle-naukri
npm run ingest:stats                    # thousands of raw

# 6. Parse first 500 (~$5)
npm run ingest:parse -- --limit 500 --batch 25

# 7. Embed
npm run ingest:embed -- --limit 500

# 8. Regenerate taxonomy; commit lib/data/*.ts
npm run ingest:taxonomy
```

---

## Phase 0 Exit Checklist

- [ ] Prisma migration `phase-0-jd-ingestion` run successfully; all 4 models created
- [ ] `lib/ai/prompts/jd-parse.ts` created; prompt version `1.0.0` set
- [ ] `scripts/ingestion/load-csv.ts` works; can import Kaggle CSV into RawJD
- [ ] `scripts/ingestion/load-manual.ts` works; can paste a single JD and save it
- [ ] `scripts/ingestion/parser.ts` works; runs GPT-4o, creates ParsedJD + JDSalarySignal
- [ ] `scripts/ingestion/embed.ts` works; creates JDEmbedding records
- [ ] `scripts/ingestion/generate-taxonomy.ts` works; outputs keywords-by-role.ts and skills-taxonomy.ts
- [ ] `scripts/ingestion/stats.ts` shows correct pipeline counts
- [ ] GET /api/ingestion/stats returns JSON stats (PLATFORM_ADMIN only)
- [ ] All npm scripts added and functional
- [ ] `csv-parse` installed
- [ ] Run `npm run ingest:stats` — confirm pipeline end-to-end with at least 10 test JDs

---

## Constraints

- No existing Prisma models, API routes, or app pages modified — only **new** models and the **new** ingestion API.
- GPT-4o: `temperature: 0`, `response_format: { type: "json_object" }`.
- Prompts live in `lib/ai/prompts/`; no inline prompt strings in scripts.
- Parser records errors in `parseError` and continues the batch; no single failure crashes the run.
- `lib/data/keywords-by-role.ts` and `lib/data/skills-taxonomy.ts` are **auto-generated** — do not edit by hand.

---

## What's Next

| Phase | Focus | Status |
|-------|--------|--------|
| Phase 0 | JD Ingestion (pre-launch data) | ✅ Build complete |
| Phase 3B | Company profile debt | Next |
| Phase 5 | Job Search & Filters | Done |
