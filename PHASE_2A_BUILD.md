# Phase 2A: Resume Builder — Build

**Project:** Ascend  
**Phase:** 2A — Resume Builder (forward-focused, ATS-safe)  
**Build date:** 2025-02-27

---

## Goal

The resume is built around where the candidate *wants* to go, not just where they have been. Every section supports the target role, industry, and career trajectory.

---

## Task Map (2A.1 – 2A.11)

| #     | Task | Deliverables |
|-------|------|--------------|
| 2A.1  | Career Intent (Step 1) | Target role (job title autocomplete), industry (dropdown + custom), level (IC → C-Suite), career goal, switching industries (from/to). Stored as `CareerIntent` linked to user/profile. |
| 2A.2  | Profile data mapping (Step 2) | Work Experience, Education, Skills, Certifications, Projects, Awards; relevance to target role; experience &gt;10 years condensed; achievement-focused bullets. |
| 2A.3  | AI content generation (Step 3) | Per experience: reframe bullets for TARGET role; responsibility → achievement; action verbs; quantify; transferable skills. BullMQ job, not synchronous. |
| 2A.4  | Professional summary (AI) | Forward-focused; 3 alternatives; select + manual edit. |
| 2A.5  | Skills section (AI-assisted) | Core / Technical / Soft / Tools; prioritised + suggested; no auto-add without user confirmation. |
| 2A.6  | ATS compliance engine | No tables/columns/text boxes; standard headings; Arial/Calibri/Times New Roman; date format Month Year – Month Year; contact plain text; plain bullets. |
| 2A.7  | Keyword optimisation | Present vs missing keywords; natural integration suggestions; coverage score: "X% of commonly required keywords for [Target Role]". |
| 2A.8  | Resume templates | 6 ATS-safe: Classic, Modern, Executive, Tech, Creative Professional, International. Section order by career level. |
| 2A.9  | Multiple resume versions | Up to 5 (free); Premium unlimited. Per-version name, CareerIntent, templateId, contentSnapshot, atsScore, last used/updated; duplicate; default. |
| 2A.10 | ATS score panel | Live score (0–100); Format/Keyword/Completeness/Impact; Red/Amber/Green; issues + Fix; keyword chips; debounced live update; collapse. |
| 2A.11 | Prisma, API, export | `CareerIntent`, `ResumeVersion` (+ status, jobPostId); PDF/DOCX export; seed; set-default. |

---

## Routes

| Route | Purpose |
|-------|---------|
| `/resume` | Redirect to `/resume/build`. |
| `/resume/build` | Resume builder wizard (steps 1–6). |
| `/resume/versions` | List resume versions; create, edit, duplicate, download, delete, set default. |
| `/api/resume/career-intent` | GET list, POST create. |
| `/api/resume/career-intent/[id]` | GET, PATCH, DELETE. |
| `/api/resume/profile-map` | Suggested profile items for career intent. |
| `/api/resume/generate` | POST; enqueue BullMQ content/summary jobs. |
| `/api/resume/ats-score` | POST; compute ATS score + keyword analysis; persist on ResumeVersion. |
| `/api/resume/versions` | GET list (+ meta), POST create (enforce limit). |
| `/api/resume/versions/[id]` | GET, PATCH, DELETE. |
| `/api/resume/versions/[id]/duplicate` | POST; duplicate with " Copy" name. |
| `/api/resume/versions/[id]/set-default` | POST; set as default resume. |
| `/api/resume/export` | GET ?versionId=&format=pdf|docx; stream file. |

---

## Key Files

### Prisma & migrations

- `prisma/schema.prisma` — `CareerIntent`, `ResumeVersion`, `ResumeVersionStatus`, `JobPost`; indexes on userId, careerIntentId.
- `prisma/seed.ts` — 5 CareerIntents + 2 ResumeVersions for dev user (email contains "dev" or `SEED_DEV_EMAIL`).
- `prisma/migrations/*` — Career intent + resume version migrations.

### Lib

- `lib/resume/export.ts` — `getVersionForExport(versionId)`, `exportToPDF(versionId)`, `exportToDOCX(versionId)` (pdf-lib, docx).
- `lib/resume/ats-compliance.ts` — ATS rules, category scores, issues.
- `lib/resume/keyword-optimizer.ts` — Keyword analysis, present/missing, suggestions.
- `lib/resume/templates/` — 6 templates, `TemplateLayout`, `getSectionOrder`, section components.
- `lib/subscription.ts` — `getPlanForUser`, `getMaxResumeVersions`, `isAtResumeVersionLimit` (free: 5).
- `lib/ai/prompts/` — Resume content, summary, prompts (no inline strings).
- `lib/tracking/outcomes.ts` — `trackAIInteraction` used by resume workers.

### Queues & workers

- `lib/queues/index.ts` — Resume queue, job types.
- `lib/queues/workers/resume.worker.ts` — Generate content, generate summary; create/update ResumeVersion with userId.

### API

- `app/api/resume/*` — Routes above; export returns stream with correct Content-Type and filename.

### UI — Resume pages

- `app/resume/page.tsx` — Redirect to build.
- `app/resume/build/page.tsx` — Auth + profile check; `ResumeBuildWizard` with optional `initialCareerIntentId`.
- `app/resume/versions/page.tsx` — Auth + profile check; `ResumeVersionsList`.

### UI — Resume components

- `components/resume/ResumeBuildWizard.tsx` — Steps 1–6; sidebar (intents, ATS panel from step 3).
- `components/resume/CareerIntentStep.tsx` — Step 1.
- `components/resume/ProfileMappingStep.tsx` — Step 2.
- `components/resume/AIContentStep.tsx` — Step 3 (content + summary + skills).
- `components/resume/TemplateStep.tsx` — Step 4 (template picker + preview).
- `components/resume/ExportStep.tsx` — Step 6 (preview, ATS summary, Download PDF/DOCX, Save & Finish).
- `components/resume/ATSScorePanel.tsx` — Circular score, category bars, issues, keyword chips; collapse; props: contentSnapshot, careerIntentId, isLoading, targetRole.
- `components/resume/ResumeVersionsList.tsx` — Version cards, Create New Resume, Edit/Duplicate/Download/Delete/Set default, limit notice.
- `hooks/useATSScore.ts` — Debounce 1000ms, POST ats-score, `isLoading`.

### Store

- `store/resume-build.ts` — careerIntentId, contentSnapshot, selections, ATS result, templateId, etc.

---

## Phase 2A Exit Checklist

- [x] CareerIntent CRUD works
- [x] Profile data mapping pulls correct profile sections with relevance scoring
- [x] AI content generation runs via BullMQ (not synchronous)
- [x] 3 summary alternatives generated and selectable
- [x] Skills section shows prioritised + suggested skills; no auto-add without user confirmation
- [x] ATS compliance engine returns score breakdown
- [x] Keyword coverage score computed and displayed
- [x] All 6 templates render correctly and pass ATS format rules
- [x] Up to 5 versions manageable (free); limit enforced
- [x] PDF and DOCX export both work
- [x] All AI prompts in `lib/ai/prompts/` (no inline strings)
- [x] All AI interactions logged via `lib/tracking/outcomes.ts`
- [x] ResumeVersion and CareerIntent models migrated and indexed

---

## Run / Deploy

1. **Database:** Set `DATABASE_URL`; run `npx prisma migrate deploy`.
2. **Seed (optional):** `npx prisma db seed` (requires a dev user with JobSeekerProfile; creates 5 intents + 2 versions).
3. **Redis:** Required for BullMQ (resume generation jobs). Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` as needed.
4. **Export:** Download PDF/DOCX from `/resume/versions` or from Step 6 (Export) in the builder.

---

## Dependencies Added (Phase 2A)

- `docx` — DOCX generation.
- `pdf-lib` — PDF generation (server-side).
- `ts-node` — Prisma seed execution.
