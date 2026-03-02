# Phase 22 Build — Marketplace & Career Services

## Exit checklist

- [x] Prisma migration: `phase22_marketplace` — MarketplaceProvider, ResumeReviewOrder, MockInterviewBooking, CoachingSession, ProviderReview, CourseRecommendation, CourseClick, ProfileBadge; enums ProviderStatus, ProviderType, OrderStatus, BadgeStatus
- [x] `lib/marketplace/fees.ts` — computeFees (20% platform fee)
- [x] `/marketplace/become-provider` — multi-step provider onboarding
- [x] POST `/api/marketplace/providers`
- [x] GET / PATCH `/api/marketplace/providers/me`
- [x] GET `/api/marketplace/providers/me/earnings`
- [x] `/dashboard/admin/marketplace/providers` — approval queue (pending / active / suspended)
- [x] Admin approve: POST `/api/admin/marketplace/providers/[id]/approve`
- [x] Admin reject: POST `/api/admin/marketplace/providers/[id]/reject`
- [x] Resume Review: discovery page, provider detail link, booking flow (order create + payment verify), delivery flow (PATCH deliver/rate/dispute)
- [x] Resume Review APIs: GET `/api/marketplace/resume-review`, POST/GET `/api/marketplace/resume-review/orders`, GET/PATCH `/api/marketplace/resume-review/orders/[id]`
- [x] Mock Interview: discovery (GET list), booking (POST orders), post-session scorecard (PATCH deliver), seeker scorecard view (GET order)
- [x] Mock Interview APIs: GET `/api/marketplace/mock-interviews`, POST/GET `/api/marketplace/mock-interviews/orders`, GET/PATCH `/api/marketplace/mock-interviews/orders/[id]`
- [x] Career Coaching: discovery, booking, post-session notes, seeker notes view
- [x] Coaching APIs: GET `/api/marketplace/coaching`, POST/GET `/api/marketplace/coaching/orders`, GET/PATCH `/api/marketplace/coaching/orders/[id]`
- [x] Course recommendations: GET `/api/marketplace/courses`, POST `/api/marketplace/courses/[id]/click` (track + redirect with affiliate)
- [x] `/marketplace/courses` browse page (placeholder + API); skills gap card links "Learn [skill]" → `/marketplace/courses?skill=...` and "Browse course recommendations" → `/marketplace/courses`
- [x] Admin course management: GET/POST `/api/admin/marketplace/courses`, PATCH/DELETE `/api/admin/marketplace/courses/[id]`
- [x] `/settings/badges` — add/manage certification badges (BadgesClient)
- [x] Badge display on `/profile/[username]` (PublicProfileView + profileBadges)
- [ ] Badge filter on recruiter applicant pipeline (deferred: filter UI can call GET applications and filter client-side or add API param later)
- [x] Badge APIs: GET/POST `/api/user/badges`, DELETE `/api/user/badges/[id]`, PATCH `/api/admin/badges/[id]` (revoke)
- [x] `/dashboard/provider` — orders, earnings, reviews, profile tabs
- [x] `/dashboard/admin/marketplace` — overview + Providers, Orders, Revenue, Courses, Badges (pages + links)
- [x] Dispute resolution: seeker can set order to DISPUTED; admin refund: POST `/api/admin/marketplace/orders/[id]/refund`
- [x] Resend email templates: `lib/email/marketplace.ts` — provider-approved, provider-rejected, order-received, order-delivered, order-disputed, order-refunded, badge-revoked
- [x] Outcome events: PHASE22_PROVIDER_APPLIED, PHASE22_PROVIDER_APPROVED, PHASE22_ORDER_CREATED, PHASE22_ORDER_DELIVERED, PHASE22_ORDER_DISPUTED, PHASE22_COURSE_CLICKED, PHASE22_BADGE_ADDED, PHASE22_MARKETPLACE_REVENUE (wired in provider apply/approve, payment-complete, course click, badge add)
- [x] `tsc --noEmit` passes
- [ ] `npm run build` — fails due to existing Resend/`@react-email/render` dependency (not Phase 22). Fix with `npm install @react-email/render` or Resend config if needed.

## File list

### Prisma & migration
- `prisma/schema.prisma` — Phase 22 enums, models, User relations, NotificationType + OutcomeEventType extensions
- `prisma/migrations/20260306000000_phase22_marketplace/migration.sql`

### Lib
- `lib/marketplace/fees.ts`
- `lib/marketplace/payment-complete.ts`
- `lib/email/marketplace.ts`

### Marketplace provider
- `app/marketplace/become-provider/page.tsx`
- `app/marketplace/become-provider/BecomeProviderClient.tsx`
- `app/api/marketplace/providers/route.ts` (POST)
- `app/api/marketplace/providers/me/route.ts` (GET, PATCH)
- `app/api/marketplace/providers/me/earnings/route.ts`
- `app/api/admin/marketplace/providers/route.ts`
- `app/api/admin/marketplace/providers/[id]/approve/route.ts`
- `app/api/admin/marketplace/providers/[id]/reject/route.ts`

### Resume review
- `app/api/marketplace/resume-review/route.ts`
- `app/api/marketplace/resume-review/orders/route.ts`
- `app/api/marketplace/resume-review/orders/[id]/route.ts`
- `app/marketplace/resume-review/page.tsx`
- `app/marketplace/resume-review/ResumeReviewList.tsx`

### Mock interview
- `app/api/marketplace/mock-interviews/route.ts`
- `app/api/marketplace/mock-interviews/orders/route.ts`
- `app/api/marketplace/mock-interviews/orders/[id]/route.ts`
- `app/marketplace/mock-interviews/page.tsx`

### Coaching
- `app/api/marketplace/coaching/route.ts`
- `app/api/marketplace/coaching/orders/route.ts`
- `app/api/marketplace/coaching/orders/[id]/route.ts`

### Courses
- `app/api/marketplace/courses/route.ts`
- `app/api/marketplace/courses/[id]/click/route.ts`
- `app/api/admin/marketplace/courses/route.ts`
- `app/api/admin/marketplace/courses/[id]/route.ts`
- `app/marketplace/courses/page.tsx`
- `app/dashboard/admin/marketplace/courses/page.tsx`
- `components/dashboard/intelligence/SkillsGapCard.tsx` — "Learn [skill]" and "Browse course recommendations" links

### Badges
- `app/api/user/badges/route.ts`
- `app/api/user/badges/[id]/route.ts`
- `app/api/admin/badges/[id]/route.ts`
- `app/settings/badges/page.tsx`
- `app/settings/badges/BadgesClient.tsx`
- `app/profile/[username]/page.tsx` — profileBadges fetch + pass to view
- `components/profile/PublicProfileView.tsx` — Certifications section (profileBadges)

### Payments
- `app/api/payments/verify/route.ts` — extended with marketplace_resume_review, marketplace_mock_interview, marketplace_coaching

### Provider dashboard
- `app/dashboard/provider/page.tsx`
- `app/dashboard/provider/ProviderOrdersTab.tsx`
- `app/dashboard/provider/ProviderEarningsTab.tsx`
- `app/dashboard/provider/ProviderReviewsTab.tsx`

### Admin marketplace
- `app/dashboard/admin/marketplace/page.tsx`
- `app/dashboard/admin/marketplace/providers/page.tsx`
- `app/dashboard/admin/marketplace/orders/page.tsx`
- `app/dashboard/admin/marketplace/revenue/page.tsx`
- `app/dashboard/admin/marketplace/badges/page.tsx`
- `app/api/admin/marketplace/orders/[id]/refund/route.ts`
- `components/dashboard/admin/AdminNav.tsx` — Marketplace section + links

## Notes

- **Skills gap → course link**: Wire Phase 10B skills gap card to “Learn [Skill]” by calling GET `/api/marketplace/courses?skill=<missingSkill>` and rendering course cards; on click use POST `/api/marketplace/courses/[id]/click` then redirect to returned `redirectUrl`.
- **Recruiter applicant badge filter**: Add optional `badgeProvider` or `badgeSkill` query param to applications/list API and filter by ProfileBadge; or filter client-side from existing list.
- **Provider orders list**: Add GET `/api/marketplace/providers/me/orders` that returns all ResumeReviewOrder, MockInterviewBooking, CoachingSession for the authenticated provider for the provider dashboard Orders tab.
- **Migration**: If `prisma migrate dev` fails on shadow DB (e.g. P3006), apply migration manually: `npx prisma migrate deploy` against the target DB, or run the SQL in `prisma/migrations/20260306000000_phase22_marketplace/migration.sql` after fixing enum order (PostgreSQL adds new enum values at the end; ensure OutcomeEventType/NotificationType additions are applied once).
