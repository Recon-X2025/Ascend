# M-6: Mentorship Escrow & Payment Infrastructure — Build Summary

## Overview

M-6 delivers Zero Trust payment rails for Ascend mentorship: full engagement fee collected at signing, split into tranches held in Razorpay escrow. Release: mentee confirms → immediate; mentee silent 7 days → auto-release; mentee disputes → freeze, ops review. Platform fee at release (pilot waived). All movements immutable via PaymentMovement.

### M-6 Edit: Payment Mode, Fee Structure & Mentor Subscription Gate

- **PaymentMode enum:** ESCROW (tranche-based, dispute rights intact) | FULL_UPFRONT (pay in full now, mentor paid immediately, mentee waives dispute rights)
- **Mode-aware fee rates:** RISING (ESCROW 20%, FULL_UPFRONT 25%), ESTABLISHED (15%/20%), ELITE (10%/15%); platform fee deducted from mentor payout only
- **PaymentModeAcknowledgement:** Stores mentee waiver text for FULL_UPFRONT; required before Razorpay checkout
- **Mentor subscription gate:** `getMentorActivePlan()` — mentor must have MENTOR_MARKETPLACE (canReceivePaidEngagements) to receive paid engagements
- **MENTOR_MARKETPLACE plan:** ₹1,199/month, ₹11,942/year (17% off); canListInMarketplace, seoBoostEligible, canReceivePaidEngagements
- **Payment page UI:** Mode selector (ESCROW default, FULL_UPFRONT with waiver modal); mentee never sees platform fee

## Deliverables

### 1. Prisma

- **PaymentMode enum:** ESCROW | FULL_UPFRONT
- **EscrowStatus:** +COMPLETED (for FULL_UPFRONT immediate completion)
- **MentorshipContract:** `agreedFeePaise Int?` (nullable for backward compat)
- **MentorshipEscrow:** contractId, razorpayOrderId, razorpayPaymentId, paymentMode, platformFeePaise, mentorPayoutPaise, status, totalAmountPaise, mentorId, menteeId, fundedAt, terminatedAt, voidedAt, acknowledgement?
- **PaymentModeAcknowledgement:** escrowId, menteeId, paymentMode, waiverText, acknowledgedAt, ipAddress
- **EscrowTranche:** escrowId, trancheNumber, amountPaise, percentPct, status, milestoneId (optional), autoReleaseAt, releasedAt
- **PaymentMovement:** escrowId, amountPaise, direction, reasonCode, contractId, trancheId, triggeredBy, notes
- **Enums:** EscrowStatus, TrancheStatus, MovementType, PaymentReasonCode
- **Relations:** MentorshipContract.escrow, User.escrowAsMentor/escrowAsMentee, EngagementMilestone.escrowTranche
- **OutcomeEventType:** M6_ESCROW_ORDER_CREATED, M6_ESCROW_FUNDED, M6_TRANCHE_CONFIRMED, M6_TRANCHE_DISPUTED, M6_TRANCHE_RELEASED, M6_TRANCHE_REFUNDED, M6_ESCROW_TERMINATED, M6_ESCROW_VOIDED

### 2. lib/escrow

- **tranches.ts:** TRANCHE_CONFIG (SPRINT 2×50%, STANDARD/DEEP 3×33/33/34), calculateTranches(), ESCROW_FEE_RATES, getFeeRate(tier, paymentMode)
- **route-stub.ts:** holdFunds, transferToMentor, refundToMentee (mock)
- **config.ts:** DEFAULT_ESCROW_FEE_PAISE (SPRINT 80k, STANDARD 120k, DEEP 150k), AUTO_RELEASE_DAYS=7
- **index.ts:** createEscrowOrder(contractId, paymentMode), confirmPayment — branches FULL_UPFRONT (immediate release, COMPLETED) vs ESCROW (tranches); mentor subscription gate via getMentorActivePlan

### 3. Wires

- **Milestones:** When bothFiled → COMPLETE, call markMilestonePendingRelease(milestoneId)
- **Contract void:** expireUnsignedContracts → voidEscrow
- **Termination:** Admin intervene TERMINATE_BY_MENTOR/TERMINATE_BY_MENTEE → terminateEscrow
- **createContract:** Set agreedFeePaise from engagement type default
- **initialiseEngagement:** linkEscrowTranchesToMilestones after creating milestones

### 4. APIs

| Route | Access | Description |
|-------|--------|-------------|
| POST /api/mentorship/escrow/create | Mentee | createEscrowOrder(contractId, paymentMode), returns order + keyId; body: { contractId, paymentMode? } |
| POST /api/mentorship/escrow/acknowledge-payment-mode | Mentee | Records PaymentModeAcknowledgement for FULL_UPFRONT before Razorpay; body: { escrowId, paymentMode, waiverText } |
| POST /api/mentorship/escrow/verify | Mentee | HMAC verify + confirmPayment (client after Razorpay success) |
| GET /api/mentorship/escrow/[contractId] | Mentor/Mentee | Escrow + tranches |
| POST /api/mentorship/escrow/tranches/[trancheId]/confirm | Mentee | confirmTranche |
| POST /api/mentorship/escrow/tranches/[trancheId]/dispute | Mentee | freezeTranche, body { reason } |
| POST /api/admin/mentorship/escrow/tranches/[trancheId]/release | PLATFORM_ADMIN | releaseTranche OPS_OVERRIDE, body { reason } min 20 chars |
| GET /api/admin/mentorship/escrow | PLATFORM_ADMIN | Paginated, filters status, contractId |
| GET /api/mentorship/earnings/me | Mentor | Released tranches total |

### 5. Webhook

- **POST /api/webhooks/razorpay/mentorship:** HMAC verify (MENTORSHIP_RAZORPAY_WEBHOOK_SECRET or RAZORPAY_WEBHOOK_SECRET), payment.captured → confirmPayment

### 6. Cron

- **GET /api/cron/mentorship-escrow-autorelease:** CRON_SECRET, PENDING_RELEASE tranches where autoReleaseAt <= now
- **vercel.json:** Schedule 03:30 UTC (09:00 IST)

### 7. UI

- **/mentorship/engagements/[contractId]/payment:** Payment mode selector (ESCROW default, FULL_UPFRONT with waiver modal); "You are paying ₹X to [Mentor Name]"; Razorpay checkout; platform fee never shown to mentee
- **Engagement page:** Escrow status card — FULL_UPFRONT: "Full payment received ✓" with amount + date; ESCROW: tranches, Confirm/Dispute for mentee
- **/dashboard/mentor:** MentorEarningsCard (total released)

### 8. Admin

- **Escrow tab:** 8th tab in /dashboard/admin/mentorship, list escrow accounts

### 9. Emails (8 Resend templates)

- escrow-order-created
- escrow-funded
- tranche-pending-release
- tranche-confirmed
- tranche-disputed
- tranche-released
- escrow-terminated
- escrow-voided

## Key Files

| Area | Path |
|------|------|
| Schema | prisma/schema.prisma |
| Lib | lib/escrow/tranches.ts, route-stub.ts, config.ts, index.ts |
| APIs | app/api/mentorship/escrow/*, app/api/webhooks/razorpay/mentorship, app/api/admin/mentorship/escrow |
| Cron | app/api/cron/mentorship-escrow-autorelease |
| UI | app/mentorship/engagements/[contractId]/payment, EngagementDashboardClient, MentorEarningsCard |
| Admin | MentorshipOpsClient (Escrow tab) |
| Emails | lib/email/templates/mentorship/escrow-*.ts, tranche-*.ts |

## Pilot

- seeker_pilot_open feature flag → platform fee waived; infrastructure runs
- agreedFeePaise from contract or DEFAULT_ESCROW_FEE_PAISE
- MentorProfile.tier (RISING/ESTABLISHED/ELITE) used for platform fee % via getFeeRate(tier, paymentMode) when not pilot
- Mentor subscription: PLATFORM_ADMIN can manually set MENTOR_MARKETPLACE on UserSubscription for pilot mentors
