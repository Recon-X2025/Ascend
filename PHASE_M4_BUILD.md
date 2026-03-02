# M-4: Matching Engine — Build Summary

## Overview

M-4 replaces the placeholder scoring in mentorship discovery with a multi-dimensional matching algorithm. The mentee never sees a score; they see a plain-language reason. All scoring logic lives in `lib/mentorship/match.ts`; discover uses it with Redis caching and refresh triggers.

## Deliverables

### Prisma
- **MentorApplication**: added `matchScoreAtApplication Int?` and `matchDimensionsSnapshot Json?` (snapshot at apply time for ops only).
- Migration: `20260302000000_add_match_score_snapshot`.

### lib/mentorship/match.ts
- **MatchInput**: mentee (careerContext, targetFromRole, targetToRole, targetCity, primaryNeed, …) and mentor (profile + availabilityWindows, verificationStatus, currentMenteeCount).
- **MatchScore**: mentorUserId, mentorProfileId, totalScore (0–100, internal), dimensions (transitionSimilarity 0–40, geographyRelevance 0–20, focusAreaAlignment 0–20, availabilityFit 0–10, capacity 0–10), reason (plain English, ≤2 sentences).
- **Scoring**: Transition (exact 40 / adjacent domain 25 / partial 15 / no 0), geography (INDIA_TO_GLOBAL + international 20, same city 20, India-only 15, mismatch 5), focus (direct 20 / adjacent 12 / 0), availability (≥2 windows 10 / 1 window 5 / 0 windows 3), capacity (2+ slots 10 / 1 slot 7 / 0 exclude).
- **scoreOneMentor(input)**: returns MatchScore or null if capacity 0.
- **scoreMentors(menteeInput, eligibleMentors)**: returns top 3 by totalScore; excludes zero-capacity.
- **Reason generation**: from top dimensions; references real mentor data; no score mentioned.

### lib/mentorship/discover.ts
- Placeholder scoring removed; uses **scoreMentors()** with mentee input from MenteeReadinessCheck + UserCareerContext.
- Eligible mentors: isDiscoverable, isPublic, isActive, verification VERIFIED, userId ≠ mentee, not in existing PENDING/QUESTION_ASKED/ACCEPTED applications, currentMenteeCount < maxActiveMentees.
- **Redis cache**: key `mentorship:discover:${menteeUserId}`, TTL 6 hours. Value: { profileIds, reasons, scores, dimensions }. On hit: fetch profiles by id, return MentorMatch[] with reason (scores/dimensions internal only).
- **getDiscoverCacheKey(menteeUserId)** exported for refresh.

### lib/mentorship/refresh-matches.ts
- **shouldRefreshMatches(menteeUserId)**: returns true (allow refresh).
- **queueMatchRefresh(menteeUserId)**: adds job to BullMQ `mentorship-match` queue.
- **queueMatchRefreshAll()**: finds all MenteeReadinessCheck where allGatesPassed, queues refresh for each.
- **invalidateDiscoverCache(menteeUserId)**: DEL Redis key (used by worker).

### BullMQ
- **Queue**: `mentorship-match` (MentorshipMatchJobData: { menteeUserId }).
- **Worker** (lib/queues/workers/mentorship-match.worker.ts): on job, calls invalidateDiscoverCache(menteeUserId).

### Triggers
- **PATCH /api/user/career-context** and **POST /api/user/career-context**: after successful upsert, queueMatchRefresh(session.user.id).
- **POST /api/admin/mentorship/verification/[id]/decide**: when decision === APPROVED, queueMatchRefreshAll().
- **POST /api/mentorship/applications/[applicationId]/respond**: when action === DECLINE, queueMatchRefresh(application.menteeId).
- **PATCH /api/mentorship/sessions/[sessionId]**: when action === "complete", queueMatchRefreshAll() (mentor slot opens).

### Application submit
- **POST /api/mentorship/applications**: after discoverMentors(), find match for chosen mentorProfileId; store matchScoreAtApplication and matchDimensionsSnapshot on MentorApplication.create (plus existing matchScore, matchReason).

### Admin
- **GET /api/admin/mentorship/applications**: PLATFORM_ADMIN only; returns list of applications including matchScore, matchScoreAtApplication, matchDimensionsSnapshot (for pilot tuning). Not exposed to mentee or mentor.

### API behaviour
- **GET /api/mentorship/discover**: response unchanged; returns mentorProfileId, mentorUserId, mentorName, mentorImage, matchReason, profile. Does **not** return totalScore or any dimension.

## Key Files

| File | Purpose |
|------|---------|
| prisma/schema.prisma | MentorApplication.matchScoreAtApplication, matchDimensionsSnapshot |
| prisma/migrations/20260302000000_add_match_score_snapshot/migration.sql | Migration |
| lib/mentorship/match.ts | scoreOneMentor, scoreMentors, dimensions, reason |
| lib/mentorship/discover.ts | scoreMentors + Redis cache, getDiscoverCacheKey |
| lib/mentorship/refresh-matches.ts | queueMatchRefresh, queueMatchRefreshAll, invalidateDiscoverCache |
| lib/queues/index.ts | mentorshipMatchQueue, MentorshipMatchJobData |
| lib/queues/workers/mentorship-match.worker.ts | Invalidate cache on job |
| app/api/user/career-context/route.ts | Trigger queueMatchRefresh on PATCH/POST |
| app/api/admin/mentorship/verification/[id]/decide/route.ts | Trigger queueMatchRefreshAll on APPROVED |
| app/api/mentorship/applications/[applicationId]/respond/route.ts | Trigger queueMatchRefresh on DECLINE |
| app/api/mentorship/sessions/[sessionId]/route.ts | Trigger queueMatchRefreshAll on complete |
| app/api/mentorship/applications/route.ts | Snapshot matchScoreAtApplication, matchDimensionsSnapshot on create |
| app/api/admin/mentorship/applications/route.ts | GET list with matchScore, matchDimensions (admin only) |
| __tests__/unit/lib/mentorship/match.test.ts | Unit tests for scoreMentors |

## Exit checklist

- [x] lib/mentorship/match.ts — scoreMentors() with all 5 dimensions
- [x] Placeholder in discover.ts replaced — real scores drive results
- [x] Discover API returns reason only, never score
- [x] Top 3 results; full-capacity mentors excluded
- [x] Redis cache for discover (6hr TTL)
- [x] queueMatchRefresh wired to career-context, respond DECLINE; queueMatchRefreshAll to admin APPROVED, session complete
- [x] BullMQ worker invalidates cache
- [x] matchScoreAtApplication + matchDimensionsSnapshot stored on application submit
- [x] Admin GET /api/admin/mentorship/applications includes match fields
- [x] Unit tests pass
- [ ] npm run build green (run after migration)
