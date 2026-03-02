# M-9: Dispute Resolution Engine for Ascend Mentorship

Final phase of Mentorship Track.

## Implemented

### 1. Prisma
- **MentorshipDispute**, **DisputeEvidence**, **DisputeStrike** models
- Enums: **DisputeCategory**, **DisputeStatus**, **DisputeOutcome**, **DisputeOpsReason**, **StrikeType**
- **User.canFileDisputes** Boolean @default(true)
- **PaymentReasonCode**: DISPUTE_RESOLVED_MENTOR, DISPUTE_RESOLVED_MENTEE
- **EscrowTranche.disputes** relation
- **OpsAlertType**: MENTEE_3_STRIKES, ESCROW_DISPUTE_SLA_BREACH
- **OutcomeEventType**: M9_* events (9 values)

### 2. lib/mentorship/disputes.ts
- DISPUTE_RULES, DISPUTE_FILING_WINDOW_DAYS, MIN_SESSION_DURATION_MINS
- validateDisputeFiling()
- assembleEvidence()
- runAutoResolution() + per-category resolve functions
- applyResolutionOutcome()
- getMenteeStrikeCount(), getMentorUpheldCount() (in dispute-strikes.ts)
- enforceStrikeConsequences()
- fileDispute()
- resolveSessionDidNotHappen, resolveBelowMinimumDuration, resolveStenoNotGenerated, resolveOffPlatformSolicitation, resolveCommitmentsNotMet

### 3. lib/escrow
- unfreezeTrancheForDispute(trancheId, outcome: 'UPHELD'|'REJECTED')
- releaseTranche() supports paymentReasonOverride for DISPUTE_RESOLVED_MENTOR

### 4. BullMQ
- dispute-evidence queue + worker (assembleEvidence)
- dispute-auto-resolve queue + worker (runAutoResolution, 10 min delay after evidence)
- dispute-deadline: PENDING_OPS SLA check in checkAndCreateAlerts() (runs daily 08:00 IST via mentorship-ops-check cron)

### 5. APIs
- POST /api/mentorship/disputes
- GET /api/mentorship/disputes/[disputeId]
- GET /api/mentorship/contracts/[contractId]/disputes
- POST /api/admin/mentorship/disputes/[disputeId]/resolve
- GET /api/admin/mentorship/disputes
- GET /api/admin/mentorship/disputes/[disputeId]

### 6. UI
- /mentorship/engagements/[contractId]/milestones/[milestoneId]/dispute — 3-step filing
- /mentorship/engagements/[contractId]/disputes/[disputeId] — status (mentor/mentee)
- Admin: Disputes tab (10th) in mentorship ops dashboard
- Admin: /dashboard/admin/mentorship/disputes/[disputeId] — resolve form

### 7. M-13
- monetisation.ts: upheldDisputeCount from getMentorUpheldCount(mentorId)
- MentorProfile.upheldDisputeCount comment updated

### 8. Resend templates (10)
- dispute-filed-mentee, dispute-filed-mentor
- dispute-upheld, dispute-rejected, dispute-rejected-invalid
- dispute-mentor-upheld, dispute-mentor-rejected
- dispute-pending-ops, dispute-evidence-assembled
- dispute-rights-revoked

## Filing validation
- Milestone status COMPLETE or MENTOR_FILED
- Filing window: completedAt + 7 days
- Mentee only; one dispute per milestone
- Strike limit: 2 rejected = lose rights, 3 = OpsAlert
- hasWaivedDisputeRights for STENO_NOT_GENERATED, COMMITMENTS_NOT_MET

## Migration
Run when DB is ready:
```bash
npx prisma migrate dev --name m9_dispute_resolution_engine
```

## Post-build: Open pilot

After M-9, the Mentorship Track is complete. To open the platform to pilot users:

```bash
# Via Prisma Studio or admin panel:
# FeatureFlag key = 'seeker_pilot_open' → enabled = true

# Or via seed script (create if needed):
npx ts-node scripts/set-pilot-flag.ts
```

## Build
```bash
npx prisma generate
npx tsc --noEmit
npm run build
```
