# M-14: Platform Fee & Revenue Layer — Build Summary

## Overview

M-14 adds a focused platform fee and revenue layer on top of M-6 (escrow). Fee rate at release = live mentor tier; mentee never sees platform fee. All amounts flow through TrancheFeeRecord and MentorshipRevenueSnapshot for audit and analytics.

## Deliverables

### 1. Prisma schema

- **MentorshipEscrow:** `pilotFeeWaived` (Boolean, default false), `mentorTierAtSigning` (String?), `feeRate` (Float?) — audit snapshot at signing
- **EscrowTranche:** `platformFeePaise` (Int, default 0), `mentorNetPaise` (Int, default 0) — set at release
- **TrancheFeeRecord:** trancheId, mentorTierAtRelease, feeRateApplied, platformFeePaise, mentorNetPaise, pilotFeeWaived, paymentMode, releasedAt; optional 1:1 with EscrowTranche
- **MentorshipRevenueSnapshot:** date, totalReleasedPaise, platformFeePaise, mentorPayoutPaise, pilotWaivedPaise, tranchesReleased, byTier (Json), byPaymentMode (Json)
- **MentorshipAnalyticsSnapshot:** platformRevenuePaise, mentorPayoutsPaise, pilotWaivedRevenuePaise (Int, default 0)
- **MentorAnalyticsSnapshot:** totalEarnedPaise, pendingEarnedPaise, inEscrowPaise (Int, default 0)
- **OutcomeEventType:** M14_TRANCHE_FEE_APPLIED, M14_TRANCHE_FEE_RECALCULATED, M14_REVENUE_SNAPSHOT_COMPUTED, M14_PILOT_FEE_WAIVED

### 2. lib/escrow/fees.ts

- `getLiveFeeRate(mentorId, paymentMode)` — fetches MentorProfile.tier, returns { tier, rate } via getFeeRate from tranches
- `calculateFeeAmounts(grossAmountPaise, feeRate, pilotFeeWaived)` — returns platformFeePaise, mentorNetPaise, pilotWaivedPaise
- `hasTierChanged(tierAtSigning, currentTier)`
- `formatFeeRate(rate)` — e.g. "15%"

### 3. lib/escrow/index.ts

- **createEscrowOrder:** store pilotFeeWaived, mentorTierAtSigning, feeRate on MentorshipEscrow (FULL_UPFRONT and ESCROW)
- **releaseTranche:**
  - Get live fee rate at release via getLiveFeeRate
  - Recalculate amounts via calculateFeeAmounts
  - Update tranche with platformFeePaise, mentorNetPaise
  - Create TrancheFeeRecord
  - Log TRANCHE_FEE_RECALCULATED_TIER_CHANGE if hasTierChanged
  - transferToMentor with mentorNetPaise (not full tranche.amountPaise)
  - Record payment movements (mentor OUT, platform PLATFORM_FEE if applicable)
  - Emit M14_TRANCHE_FEE_APPLIED, M14_TRANCHE_FEE_RECALCULATED when tier changed

### 4. lib/escrow/revenue.ts

- `computeDailyRevenueSnapshot(date)` — aggregate from TrancheFeeRecord + FULL_UPFRONT escrows, upsert MentorshipRevenueSnapshot
- `getRevenueSummary(from, to)`
- `getMentorPayoutSummary(mentorId)` — totalEarnedPaise, pendingEarnedPaise, inEscrowPaise
- `getPlatformFeeSummary(from, to)`

### 5. Cron

- **GET /api/cron/mentorship-revenue-snapshot** — schedule `30 20 * * *` (20:30 UTC = 02:00 IST). CRON_SECRET auth. Calls computeDailyRevenueSnapshot(yesterday), emits M14_REVENUE_SNAPSHOT_COMPUTED.

### 6. M-17 updates

- **computePlatformSnapshot:** call getRevenueSummary(snapshotDate, snapshotDate), set platformRevenuePaise, mentorPayoutsPaise, pilotWaivedRevenuePaise
- **computeMentorSnapshot:** call getMentorPayoutSummary(mentorId), set totalEarnedPaise, pendingEarnedPaise, inEscrowPaise

### 7. APIs

| Route | Access | Description |
|-------|--------|-------------|
| GET /api/mentorship/escrow/[contractId]/fee-summary | Mentor / Mentee | Mentor: fee details (tier, rate, platform fee, net). Mentee: total only |
| GET /api/admin/mentorship/revenue?from=&to= | PLATFORM_ADMIN | Revenue summary (platform fee, mentor payouts, pilot waived) |
| GET /api/admin/mentorship/revenue/snapshots?days=7\|30\|90 | PLATFORM_ADMIN | Daily revenue snapshots for charts |
| GET /api/mentorship/mentor/payout-summary | Mentor | totalEarnedPaise, pendingEarnedPaise, inEscrowPaise |

### 8. UI

- **/dashboard/mentor:** Fee info card (MentorFeeInfoCard) — released, pending, in escrow
- **/dashboard/mentor/analytics:** Real earnings (replaced stub with payout-summary data)
- **Admin mentorship:** Revenue tab (9th) — summary cards, revenue trend chart, revenue by tier table, tier change log

### 9. Outcome events

- M14_TRANCHE_FEE_APPLIED — on tranche release
- M14_TRANCHE_FEE_RECALCULATED — when tier changed between signing and release
- M14_REVENUE_SNAPSHOT_COMPUTED — cron
- M14_PILOT_FEE_WAIVED — FULL_UPFRONT when pilot fee waived

## Critical rules

- **Fee rate at release = live tier.** Never use escrow.feeRate.
- **transferToMentor gets mentorNetPaise**, not full tranche amount.
- **Mentee never sees platform fee** — fee-summary returns total only for mentee.

## Key files

| Area | Paths |
|------|------|
| Schema | prisma/schema.prisma |
| Migration | prisma/migrations/20260310000000_m14_platform_fee_revenue/migration.sql |
| Lib | lib/escrow/fees.ts, lib/escrow/revenue.ts, lib/escrow/index.ts |
| Analytics | lib/mentorship/analytics.ts |
| Cron | app/api/cron/mentorship-revenue-snapshot/route.ts |
| APIs | app/api/mentorship/escrow/[contractId]/fee-summary, app/api/admin/mentorship/revenue, app/api/admin/mentorship/revenue/snapshots, app/api/mentorship/mentor/payout-summary |
| UI | MentorFeeInfoCard, MentorAnalyticsClient (earnings), MentorshipOpsClient (Revenue tab) |
| Config | vercel.json |
