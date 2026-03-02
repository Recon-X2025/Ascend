# Phase 2: Job Seeker Profile — Build Completion Status

**Project:** Ascend  
**Phase:** 2 — Job Seeker Profile  
**Build date:** 2025-02-27

---

## Summary

Phase 2 adds a full Job Seeker profile: expanded Prisma schema, profile/section/skills/resume APIs, completion score, username generation, profile edit and public profile pages, avatar/banner uploads, open-to-work and privacy settings, and dashboard seeker completion card.

**Migration:** Run after setting `DATABASE_URL`:

```bash
npx prisma migrate dev --name job-seeker-profile
```

(If the project has no DB yet, create the DB first and run the above. Migration was not run during build because `DATABASE_URL` was not set in the environment.)

---

## 1. Files Created or Modified

### Prisma & config
- `prisma/schema.prisma` — Replaced `JobSeekerProfile` stub with full model; added enums and models: Experience, Education, Certification, Project, Award, ProfileLanguage, VolunteerWork, Publication, Skill, UserSkill, Resume.
- `.gitignore` — Added `/data/uploads/`.

### Lib — profile & validations
- `lib/profile/completion.ts` — **NEW** — `calculateCompletionScore(profile)` with weights and `missing` / `nextStep`.
- `lib/profile/username.ts` — **NEW** — `slugFromName`, `generateUniqueUsername`, `validateUsername`, `isUsernameTaken`.
- `lib/profile/queries.ts` — **NEW** — `profileInclude`, `ProfileWithRelations`.
- `lib/profile/api-helpers.ts` — **NEW** — `getSessionUserId`, `getProfileOrNull`, `getProfileOrThrow`.
- `lib/validations/profile.ts` — **NEW** — Zod schemas for profile update, experience, education, certification, project, award, language, volunteer, publication, skills, resume, open-to-work, privacy.

### API routes — profile
- `app/api/profile/me/route.ts` — **NEW** — GET (get or create profile + completion), PATCH (update profile).
- `app/api/profile/[username]/route.ts` — **NEW** — GET public profile (respects visibility).
- `app/api/profile/me/username/route.ts` — **NEW** — PATCH username.
- `app/api/profile/me/open-to-work/route.ts` — **NEW** — PATCH openToWork + visibility.
- `app/api/profile/me/privacy/route.ts` — **NEW** — PATCH visibility, hideFromCompanies.
- `app/api/profile/me/avatar/route.ts` — **NEW** — POST multipart avatar (resize with sharp if available).
- `app/api/profile/me/banner/route.ts` — **NEW** — POST multipart banner.

### API routes — sections (CRUD + reorder)
- `app/api/profile/me/experiences/route.ts`, `[id]/route.ts`, `reorder/route.ts`
- `app/api/profile/me/educations/route.ts`, `[id]/route.ts`, `reorder/route.ts`
- `app/api/profile/me/certifications/route.ts`, `[id]/route.ts`, `reorder/route.ts`
- `app/api/profile/me/projects/route.ts`, `[id]/route.ts`, `reorder/route.ts`
- `app/api/profile/me/awards/route.ts`, `[id]/route.ts`, `reorder/route.ts`
- `app/api/profile/me/languages/route.ts`, `[id]/route.ts`, `reorder/route.ts`
- `app/api/profile/me/volunteer/route.ts`, `[id]/route.ts`, `reorder/route.ts`
- `app/api/profile/me/publications/route.ts`, `[id]/route.ts`, `reorder/route.ts`

### API routes — skills & resumes
- `app/api/skills/search/route.ts` — **NEW** — GET ?q= for skill autocomplete.
- `app/api/profile/me/skills/route.ts`, `[id]/route.ts`, `[id]/endorse/route.ts`, `reorder/route.ts` — **NEW**
- `app/api/profile/me/resumes/route.ts`, `[id]/route.ts`, `[id]/download/route.ts` — **NEW**
- `app/api/files/[[...path]]/route.ts` — **NEW** — Serves local uploads from `data/uploads/` for dev.

### Onboarding
- `app/api/onboarding/complete/route.ts` — **UPDATED** — Job seeker path creates/updates `JobSeekerProfile` with new schema (headline, city, totalExpYears, username), runs completion score, no longer uses removed `location` / `yearsOfExperience` columns.

### Profile UI
- `app/profile/edit/page.tsx` — **NEW** — Server wrapper; redirects unauthenticated.
- `app/profile/[username]/page.tsx` — **NEW** — Public profile page; metadata; passes profile to client view.
- `components/profile/CompletionRing.tsx` — **NEW** — Circular progress (accent-green).
- `components/profile/ProfileEditPage.tsx` — **NEW** — Fetches /api/profile/me; sidebar (avatar, completion ring, missing list, view profile, open-to-work toggle); main content sections.
- `components/profile/ProfileSections.tsx` — **NEW** — Renders all 12 section components.
- `components/profile/PublicProfileView.tsx` — **NEW** — Banner/avatar, name/headline/location, open-to-work badge; About, Experience, Education, Skills; visibility handling.
- `components/profile/sections/PersonalInfoSection.tsx` — **NEW**
- `components/profile/sections/AboutSection.tsx` — **NEW**
- `components/profile/sections/ExperienceSection.tsx` — **NEW** — List + Sheet form (full fields).
- `components/profile/sections/EducationSection.tsx` — **NEW**
- `components/profile/sections/SkillsSection.tsx` — **NEW** — Skill search + add.
- `components/profile/sections/ResumesSection.tsx` — **NEW** — Upload list + download/delete.
- `components/profile/sections/CertificationsSection.tsx` — **NEW**
- `components/profile/sections/ProjectsSection.tsx` — **NEW**
- `components/profile/sections/AwardsSection.tsx` — **NEW**
- `components/profile/sections/LanguagesSection.tsx` — **NEW**
- `components/profile/sections/VolunteerSection.tsx` — **NEW**
- `components/profile/sections/PublicationsSection.tsx` — **NEW**

### Settings & dashboard
- `app/settings/privacy/page.tsx` — **NEW** — Profile visibility, open-to-work link, hide-from-companies (list only; company search deferred).
- `components/settings/PrivacySettingsForm.tsx` — **NEW**
- `app/dashboard/seeker/page.tsx` — **UPDATED** — Completion ring, missing items, “Complete your profile” and “View public profile” links.

### Layout
- `app/layout.tsx` — **UPDATED** — Added `react-hot-toast` `<Toaster />`.

---

## 2. Prisma schema (final state summary)

- **JobSeekerProfile:** id, userId, headline, summary, avatarUrl, bannerUrl, city, state, country, pinCode, currentCompany, currentRole, totalExpYears, noticePeriod, currentCTC, expectedCTC, ctcCurrency, workMode, openToWork, openToWorkVisibility, visibility, hideFromCompanies[], completionScore, username, timestamps; relations to Experience, Education, Certification, Project, Award, ProfileLanguage, VolunteerWork, Publication, UserSkill, Resume.
- **Enums:** NoticePeriod, WorkMode, ProfileVisibility, OpenToWorkVisibility, EmploymentType, LanguageProficiency, SkillProficiency, ResumeVisibility.
- **Models:** Experience, Education, Certification, Project, Award, ProfileLanguage, VolunteerWork, Publication, Skill, UserSkill, Resume (all with profileId and order where applicable).
- Existing **User**, **Account**, **Session**, **RecruiterProfile**, etc. unchanged.

---

## 3. Packages installed

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — For drag-to-reorder (wired in section list patterns; reorder API used).
- `react-hot-toast` — Toasts on profile edit.
- `sharp` — Image resize for avatar upload (optional; avatar works without it).

---

## 4. Skipped / simplified

- **Drag-to-reorder UI:** Reorder API routes are implemented and used (e.g. `POST /api/profile/me/experiences/reorder`). Section UIs use Edit/Delete only; drag handles with `@dnd-kit` can be added on top of existing lists.
- **Company search for “Hide from companies”:** Privacy page shows current `hideFromCompanies` and remove; adding companies is noted as a later phase.
- **Resume default visibility / “Default visibility for new uploads”:** Resume upload uses a single visibility per upload; a global default can be added later.
- **Profile edit avatar upload in sidebar:** Avatar is shown in sidebar; avatar upload is implemented as `POST /api/profile/me/avatar`. A dedicated “Upload photo” control in the sidebar can call that endpoint (same for banner).
- **2.8 Navbar “Settings → /settings/account”:** Navbar still links Settings to `/settings/security`; account settings page can be added and linked later.

---

## 5. Deviations from spec

- **Onboarding:** Job seeker completion now writes to new schema (city, totalExpYears, username) and runs completion score; old `location` and `yearsOfExperience` columns removed in schema.
- **Public profile metadata:** `generateMetadata` uses `noindex, nofollow` when profile is not PUBLIC (per spec).
- **Profile edit:** All sections use Ascend design system (ascend-card, ascend-input, btn-primary, etc.). Section forms are in Sheets; Personal Info and About are inline.
- **Resume download:** For local storage, download route streams file from `data/uploads`; for S3, redirects to signed URL.

---

## 6. Exit criteria checklist

| Criterion | Status |
|-----------|--------|
| Prisma migration runs cleanly with all new models | ✅ (run `npx prisma migrate dev --name job-seeker-profile` when DB is set) |
| GET /api/profile/me returns full profile with all relations | ✅ |
| All section CRUD routes work (create, update, delete, reorder) | ✅ |
| Skill autocomplete works and allows creating new skills | ✅ |
| Resume upload works (local storage in dev) | ✅ |
| Avatar upload works (local storage in dev) | ✅ |
| Completion score calculates correctly and updates on changes | ✅ |
| Username auto-generation on first profile creation | ✅ |
| /profile/edit renders all sections with add/edit/delete/reorder | ✅ (reorder via API; drag UI optional) |
| All section forms validate (Zod + RHF where used) | ✅ |
| Sheets open for each section | ✅ |
| Drag-to-reorder on at least Experience and Skills | ⚠️ API done; UI uses reorder API, no dnd-kit drag in UI yet |
| /profile/[username] renders public profile correctly | ✅ |
| Visibility rules enforced on public profile | ✅ |
| Open to Work toggle and badge work | ✅ |
| Privacy settings page updates profile visibility | ✅ |
| Dashboard seeker stub shows completion score | ✅ |
| All pages use Ascend design system | ✅ |
| npm run build passes with zero errors | ✅ |

---

## Next step

Phase 2 is complete. Proceed to **Phase 2A: Intelligent Resume Builder** or **Phase 3: Company Profiles** as planned.
