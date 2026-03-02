# Phase 19 Build — Growth, Virality & Network Effects

## Exit checklist

- [x] Prisma migration: `phase19_growth_virality` — ReferralCode, Referral, ShareEvent, ProfileEndorsement models; ReferralStatus enum; User extended (`referralCode`, `referredBy`, `referrals`, `shareEvents`, `endorserEndorsements`, `recipientEndorsements`, `referralPremiumUntil`)
- [x] `lib/growth/referral.ts` — generateReferralCode, trackReferralClick, attributeReferral, convertReferral
- [x] Registration wired → generateReferralCode + attributeReferral (cookie `ref_sid`)
- [x] Onboarding completion (career-context POST) wired → convertReferral
- [x] GET `/api/growth/referral` (auth)
- [x] GET `/api/growth/referral/[code]` (public, tracks click, sets cookie)
- [x] POST `/api/growth/share`
- [x] POST `/api/growth/endorsements`
- [x] GET `/api/growth/endorsements/user/[userId]`
- [x] DELETE `/api/growth/endorsements/[endorsementId]`
- [x] GET `/api/admin/growth/referrals`
- [x] GET `/api/admin/growth/shares`
- [x] GET `/api/admin/growth/top-referrers`
- [x] `/join?ref=[code]` landing page
- [x] ShareButton component (Web Share API + dropdown fallback)
- [x] Share CTAs on job, company, profile, salary, mentor pages
- [x] Skills endorsement UI on `/profile/[username]` (Endorse button for 1st-degree connections)
- [x] Endorsement in-app notification (SKILL_ENDORSED, link to profile#skills)
- [x] Invite Teammates card on recruiter dashboard
- [x] `/dashboard/admin/growth` page (referral funnel + share chart + top referrers)
- [x] 3 Resend email templates (`lib/email/growth.ts`: referral-converted, referral-reward-granted, recruiter-invite)
- [x] 6 outcome events: PHASE19_REFERRAL_CLICKED, PHASE19_REFERRAL_SIGNED_UP, PHASE19_REFERRAL_CONVERTED, PHASE19_SHARE_EVENT, PHASE19_SKILL_ENDORSED, PHASE19_RECRUITER_INVITE_SENT
- [ ] `tsc --noEmit` — passes for Phase 19 files; pre-existing errors in admin/languages, marketplace, user/preferences, etc.
- [ ] `npm run build` — fails pre-existing: Resend module can't resolve `@react-email/render` (unrelated to Phase 19).

## File list

### Schema & migration
- `prisma/schema.prisma` — ReferralCode, Referral, ShareEvent, ProfileEndorsement, ReferralStatus; User relations + referralPremiumUntil; NotificationType.SKILL_ENDORSED; OutcomeEventType Phase 19 events
- `prisma/migrations/20260305000000_phase19_growth_virality/migration.sql`

### Core logic
- `lib/growth/referral.ts` — generateReferralCode, trackReferralClick, attributeReferral, convertReferral
- `lib/email/growth.ts` — sendReferralConvertedEmail, sendReferralRewardGrantedEmail, sendRecruiterInviteEmail

### APIs
- `app/api/growth/referral/route.ts` — GET (auth, my code + stats)
- `app/api/growth/referral/[code]/route.ts` — GET (public, validate + track click + cookie)
- `app/api/growth/share/route.ts` — POST (log share, return UTM URL)
- `app/api/growth/endorsements/route.ts` — POST (endorse skill, 1st-degree only, rate limit 5/week)
- `app/api/growth/endorsements/user/[userId]/route.ts` — GET (endorsements by skill, max 3 endorser names)
- `app/api/growth/endorsements/[endorsementId]/route.ts` — DELETE (retract own)
- `app/api/growth/recruiter-invite/route.ts` — POST (invite teammates, rate limit 10/day)
- `app/api/growth/utm/route.ts` — POST (log UTM_VISIT to AnalyticsEvent)
- `app/api/admin/growth/referrals/route.ts` — GET (funnel stats)
- `app/api/admin/growth/shares/route.ts` — GET (by channel / entity, last 30 days)
- `app/api/admin/growth/top-referrers/route.ts` — GET (top 10 by conversions)

### Pages & components
- `app/join/page.tsx` — join landing with ref support
- `components/growth/JoinClient.tsx` — client: fetch referral API, show referrer name, CTA to register
- `components/growth/ShareButton.tsx` — share dropdown (Copy, WhatsApp, LinkedIn, Twitter, Email; Web Share on supported)
- `components/growth/EndorseSkillButton.tsx` — endorse one skill (optimistic UI)
- `components/growth/InviteTeammatesCard.tsx` — recruiter dashboard invite form
- `app/dashboard/admin/growth/page.tsx` — admin growth tab
- `components/dashboard/admin/AdminGrowthClient.tsx` — funnel, share chart, top referrers
- `components/dashboard/admin/AdminNav.tsx` — Growth nav link

### Wired flows
- `app/api/auth/register/route.ts` — after user create: generateReferralCode, attributeReferral (ref_sid cookie)
- `app/api/user/career-context/route.ts` — after POST success: convertReferral
- `app/profile/[username]/page.tsx` — endorsements data + isConnected, endorsedByMe → PublicProfileView
- `components/profile/PublicProfileView.tsx` — ShareButton; skills section: endorsement count + EndorseSkillButton
- `app/jobs/[slug]/page.tsx` — ShareButton
- `app/companies/[slug]/page.tsx` — ShareButton
- `app/salary/page.tsx` — ShareButton
- `app/mentors/[userId]/page.tsx` — ShareButton
- `components/dashboard/recruiter/RecruiterDashboardClient.tsx` — InviteTeammatesCard

### Analytics & outcomes
- `lib/analytics/track.ts` — EVENTS.UTM_VISIT
- OutcomeEventType (schema): PHASE19_REFERRAL_CLICKED, PHASE19_REFERRAL_SIGNED_UP, PHASE19_REFERRAL_CONVERTED, PHASE19_SHARE_EVENT, PHASE19_SKILL_ENDORSED, PHASE19_RECRUITER_INVITE_SENT

### Notes
- Referral reward: 30 days free premium via `User.referralPremiumUntil` (no monetary payout).
- Attribution: Redis `referral:{sessionId}` = codeId (30-day TTL); cookie `ref_sid` set by GET `/api/growth/referral/[code]`.
- Endorsements: require ACCEPTED connection; max 5 per user per week (Redis).
- UTM: Client can call POST `/api/growth/utm` with `{ source, medium, campaign, entityId }` when page has utm_* params to log UTM_VISIT.
