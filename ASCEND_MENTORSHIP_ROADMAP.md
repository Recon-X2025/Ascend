# Ascend Mentorship — Complete Product Roadmap
**Version:** 1.0
**Last updated:** 2026-03-01
**Status:** Roadmap approved — prompts pending
**Classification:** Internal product document

---

## Philosophy

Ascend Mentorship is not a booking feature.
It is a trust infrastructure — a complete marketplace
with identity verification, legal contracts, escrow
payment protection, AI-powered session evidence,
and outcome attribution built into every layer.

**Core principles:**
- Zero Trust — evidence only, never claims
- Platform is the honest broker, not the judge
- If it didn't happen on Ascend, it didn't happen
- Every rupee is protected until evidence confirms delivery
- Mentor credibility is earned through verified outcomes, not self-declared

---

## Architecture Decision Record

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Meeting infrastructure | Daily.co embedded | Platform-generated rooms, native transcription API, session webhooks, no infrastructure ownership |
| Transcription | Daily.co + Deepgram | Speaker-attributed, production-ready, feeds Ascend Steno |
| AI steno | GPT-4o on transcript | Structured extraction — summary, commitments, action items, goal progress |
| Session record | Immutable PDF, S3 + SHA-256 | Evidence layer, not a notetaking feature |
| Video storage | Not stored | Transcript is the evidence. Video storage = cost + liability with no additional evidentiary value |
| Messaging | Async only | Pre/post session communication. Not the meeting. Clean separation. |
| Off-platform | Zero tolerance | Any external link in messaging = ToS violation. Flagged automatically. |
| Payment | Razorpay escrow | Tranche-based. Released on evidence, not on trust. |
| Digital signing | OTP-based (IT Act 2000) | Legally valid under Indian law. Aadhaar eSign post-pilot. |
| Dispute resolution | Rule-based, not judgment-based | Evidence determines outcome. Admin cannot override rules. |
| Mentor verification | Document + employment proof | LinkedIn URL alone is insufficient under Zero Trust. |
| Manual session summary | Retired | Ascend Steno replaces it entirely. Stronger evidence, less mentor admin. |

---

## The Mentorship Track — 17 Phases

```
── FOUNDATION ──────────────────────────────────────────────────────────────
M-1    Identity & Verification Infrastructure
M-2    Mentor Profile & Transition Record
M-3    Mentee Onboarding & Application Layer

── MARKETPLACE ─────────────────────────────────────────────────────────────
M-4    Matching Engine
M-5    Contract Generation & Digital Signing
M-6    Escrow & Payment Infrastructure

── ENGAGEMENT ──────────────────────────────────────────────────────────────
M-7    Meeting Room, Ascend Steno & Session Evidence
M-8    Session Rhythm & Milestone Framework
M-9    Dispute Resolution Engine

── OUTCOMES ────────────────────────────────────────────────────────────────
M-10   Outcome Verification & Attribution
M-11   Mentor Reputation & Tier System

── COHORTS ─────────────────────────────────────────────────────────────────
M-12   Mentorship Circles

── MONETISATION ────────────────────────────────────────────────────────────
M-13   Mentor Monetisation Unlock
M-14   Platform Fee & Revenue Layer

── GOVERNANCE ──────────────────────────────────────────────────────────────
M-15   Legal Framework & Compliance
M-16   Admin & Ops Layer

── INTELLIGENCE ────────────────────────────────────────────────────────────
M-17   Mentorship Analytics & Insights
```

---

## Phase Details

---

### M-1 — Identity & Verification Infrastructure
**The trust bedrock. Nothing else works without this.**

```
Deliverables:
- Government ID upload + ops review queue
- Employment verification:
    Company email ping, OR
    Document upload (offer letter / payslip)
- LinkedIn cross-reference
    URL stored, transition timeline checked against claims
- Verification status enum:
    UNVERIFIED / PENDING / VERIFIED / REVERIFICATION_REQUIRED
- Mentor not discoverable until VERIFIED
- Re-verification trigger: 12 months or role change
- Third party stub: SpringVerify / AuthBridge (post-pilot)
- Verification badge — permanent record of:
    When verified, what was verified, by whom

Prisma models:
  MentorVerification
  VerificationDocument
  VerificationStatus enum

Admin:
  Verification review queue
  Approve / Request more info / Reject
  Reason codes mandatory on every decision
  All decisions logged — immutable
  SLA: 48 hours (shown to mentor at submission)
```

---

### M-2 — Mentor Profile & Transition Record
**Not a bio. A verified career story built for matching.**

```
Deliverables:
- Structured transition story (not free text)
    From: role, company type, industry, city
    To: role, company type, industry, city
    Duration of transition
    3 key factors that made it possible (structured)
- Verification badge on transition:
    SELF_REPORTED / PLATFORM_VERIFIED
- Capacity declaration (platform-enforced):
    Max active mentees
    Availability windows (days + times + timezone)
    Engagement length preference (30 / 60 / 90 days)
    Session frequency (weekly / fortnightly)
- Focus areas (structured selection)
- Languages
- Geography experience tags:
    India only / India to Global / Specific countries
- What mentor will NOT help with (explicit)
- Mentor statement (structured prompts, 200 words max):
    "The transition I made..."
    "What I wish I had known..."
    "What I can help you with..."
    "What I cannot help you with..."

This profile is the matching input.
Not a marketing page.
```

---

### M-3 — Mentee Onboarding & Application Layer
**Mentees earn access to mentors. They don't pick from a menu.**

```
Deliverables:
- Mentee readiness gate (before any application):
    Profile completion minimum threshold
    DS-4B career context must be complete
    Target transition must be declared

- Mentor discovery (not a catalogue):
    System shows 3 matched mentors max
    Based on UserCareerContext + CareerIntent
    No browsing. No filters for mentee.
    Each match shown with a reason:
    "Riya made the exact transition you're targeting
     — IC to PM at a Series B — 18 months ago
     in Bangalore."
    Not a score. A reason.

- Mentee application (per mentor):
    Why this mentor specifically (100-200 words)
    What you want to achieve in this engagement
    What you will commit to as a mentee
    What your timeline looks like
    What you have already tried

- Application limits:
    Max 2 simultaneous applications
    Forces intentional applications
    Prevents spray-and-pray behaviour

- Mentor response flow:
    Accept / Decline / Ask one question
    One question only — keeps signal high
    Mentee answers → mentor decides
    Must respond within 5 days
    Auto-expires if no response
    Mentee notified, next match surfaced

- Application states:
    PENDING / ACCEPTED / DECLINED /
    QUESTION_ASKED / EXPIRED / WITHDRAWN
```

---

### M-4 — Matching Engine
**The system knows more than the mentee about who can help them.**

```
Deliverables:
- Matching algorithm (lib/mentorship/match.ts)

  Inputs:
    Mentee UserCareerContext
    Mentee CareerIntent
    Mentee target transition
    Mentor verified transition record
    Mentor focus areas
    Mentor geography experience tags
    Mentor current capacity
    Mentor availability windows

  Scoring dimensions:
    Transition similarity      40pts
      Exact match: same from → same to
      Adjacent: similar domain
      Partial: same destination, different origin
    Geography relevance        20pts
      Mentee India→Global: mentor has done it
      City transition: mentor has done it
    Focus area alignment       20pts
      Mentee primaryNeed matches mentor focus areas
    Availability fit           10pts
      Mentor availability overlaps mentee preference
    Capacity                   10pts
      Mentor has open slots

  Output:
    Ranked list, max 3 shown to mentee
    Explanation per match (natural language)
    Not a score shown to mentee — a reason

- Match refresh triggers:
    Mentee updates career context
    New verified mentor joins
    Previous match declines application
    Previous engagement completes
```

---

### M-5 — Contract Generation & Digital Signing
**Every engagement is a legal document. No exceptions.**

```
Deliverables:
- Engagement Contract auto-generated on acceptance
  Populated with:
    Both parties' verified details
    Engagement scope (from mentee application)
    Session count, frequency, duration
    Financial terms (total, tranches, platform fee %)
    Release conditions
    Obligations — mentor and mentee
    Off-platform prohibition (explicit clause)
    Early termination terms
    Transcription and data retention consent
    Zero Trust policy acknowledgement
    Governing law:
      Indian Contract Act 1872
      IT Act 2000
      Consumer Protection Act 2019
      Jurisdiction: Ascend's registered city

- Contract versioning:
    Locked to platform T&C version at signing
    Future T&C changes don't affect active contracts
    Existing contracts run to completion
    under version signed

- Digital signing flow:
    Mentor signs first (they accepted, they go first)
    OTP sent to registered mobile
    OTP entry = valid electronic signature (IT Act)
    Timestamp + IP logged
    Mentee receives contract (48 hour window)
    Same OTP flow
    If mentee doesn't sign in 48hrs:
      Engagement void
      Mentor notified
      Mentor capacity restored
      Mentee escrow not collected until signing

- Contract PDF generation:
    Generated after both signatures
    SHA-256 hash stored in DB
    PDF stored in S3 — immutable
    Both parties receive copy via email
    Accessible from dashboard permanently

- Contract integrity check:
    Every access verifies hash against stored hash
    Mismatch → contract flagged
    Both parties notified
    Engagement suspended pending ops review

Prisma:
  MentorshipContract
  ContractSignature (per party per contract)
  ContractStatus enum:
    PENDING_MENTOR_SIGNATURE
    PENDING_MENTEE_SIGNATURE
    ACTIVE
    COMPLETED
    DISPUTED
    TERMINATED_BY_MENTOR
    TERMINATED_BY_MENTEE
    VOID
```

---

### M-6 — Escrow & Payment Infrastructure
**Zero Trust payment rails. No money moves without evidence.**

```
Deliverables:
- Payment collection on contract signing
    Full engagement fee collected from mentee
    Split into tranches — held in escrow
    Razorpay escrow / virtual account holding

- Standard tranche structure (90-day engagement):
    Tranche 1 (33%): held at contract signing
    Tranche 2 (33%): held, releases at mid-milestone
    Tranche 3 (34%): held, releases at final session

- Release triggers:
    Mentee confirms milestone → immediate release
    Mentee silent 7 days → auto-release
    Mentee disputes → freeze, ops review (48hrs)

- Platform fee (applied at each tranche release):
    RISING mentor:      20%
    ESTABLISHED mentor: 15%
    ELITE mentor:       10%
    Applied at release — not upfront
    Pilot period: fee waived, infrastructure runs

- Early termination logic:
    Mentee terminates:
      Completed session tranches → release to mentor
      Remaining escrow → refund to mentee
      Platform fee on completed tranches only
    Mentor terminates:
      All unreleased escrow → full refund to mentee
      Completed tranches → release to mentor
      Strike recorded against mentor

- Dispute abuse prevention:
    Mentee: 2 disputes rejected →
      loses dispute rights for remainder of engagement
    Mentee: 3 disputes rejected →
      banned from mentorship marketplace
    All records permanent

- Auto-release protection:
    Mentee cannot game by never confirming
    7-day window is contractual — both agreed upfront
    Framing to mentee at contract signing:
      "Your payment is held safely until your session
       is complete. You have 7 days to confirm or raise
       a concern. If we don't hear from you, payment
       releases automatically — this protects mentors
       who showed up."

- Payment audit log (immutable):
    Every movement logged:
      Amount, direction, reason code,
      contract reference, timestamp, triggered by
    No admin can alter
    No deletion path

- Payout to mentor:
    T+2 business days after release
    Monthly payout report (PDF, downloadable)
    Annual earnings summary (for tax / GST filing)

Prisma:
  MentorshipEscrow
  EscrowTranche
  PaymentMovement (audit log)
  EscrowStatus enum
  PaymentReasonCode enum
```

---

### M-7 — Meeting Room, Ascend Steno & Session Evidence
**If it didn't happen on Ascend, it didn't happen.**

```
Meeting Infrastructure:
- Daily.co embedded (third party, not native build)
    Platform generates room — not either party
    Unique room per session — expires after session
    Embedded inside Ascend UI
    Neither party can substitute external links
    Screen share built in

- Session join logging (via Daily.co webhooks):
    participant-joined (who, timestamp)
    participant-left (who, timestamp)
    Total duration per party
    All stored against MentorSession record

- Minimum duration enforcement:
    Under 20 minutes → INCOMPLETE_SESSION
    Cannot trigger milestone confirmation
    Both parties notified
    Mentor must reschedule — no charge to mentee
    No-show = not joining within 15 mins of start

─────────────────────────────────────────────────

Ascend Steno:
- Daily.co Transcription API (speaker-attributed)
    Deepgram integration (native to Daily.co)
    Produces: "Speaker 1 (Mentor): ... Speaker 2 (Mentee): ..."

- GPT-4o structured extraction on transcript:
    Discussion summary (3-5 paragraphs)
    Mentor commitments (extracted, attributed)
    Mentee commitments (extracted, attributed)
    Action items with owners
    Next session proposed focus
    Goal progress signal (On track / Needs attention / Off track)

- Session Record PDF (auto-generated):
    Ascend Steno header
    Engagement ID, mentor, mentee, date, duration
    Attendees confirmed (platform verified)
    Discussion summary
    Commitments per party
    Action items
    Goal progress
    Record integrity block:
      Generated by: Ascend AI
      Timestamp, SHA-256 hash
      "Neither party may edit this record"
    Stored in S3 — immutable
    Both parties notified and can access
    Ops access only on formal dispute

- Video not stored:
    Transcript is the evidence
    Video storage = cost + liability
    No additional evidentiary value
    Daily.co configured: transcribe, do not store video

- Replaces mentor manual summary entirely:
    No post-session filing obligation for mentor
    Steno is the record
    Stronger than any human-written summary

─────────────────────────────────────────────────

Consent & Privacy:
- Consent obtained at contract signing (explicit)
- Automated voice announcement at session start:
    "This session is being transcribed by Ascend
     for your session record."
- Visible recording indicator in meeting UI
    (red dot — cannot be dismissed)
- Transcripts never used for:
    AI model training
    Marketing
    Any purpose outside session documentation
    and dispute resolution
- Transcript access:
    Mentor: own sessions only
    Mentee: own sessions only
    Ops: only on formal dispute
    No other access path

─────────────────────────────────────────────────

Off-Platform Enforcement:
- Keyword monitor on all platform messages:
    Email addresses
    Phone numbers
    Zoom / Google Meet / Teams links
    WhatsApp / Telegram references
- First detection: warning to both, logged
- Second detection: engagement suspended
- Third detection: engagement terminated
    Mentor: strike + capacity restoration
    Mentee: escrow refunded for remaining sessions

─────────────────────────────────────────────────

Messaging role (async only):
  Pre-session: application Q&A, scheduling,
               goal alignment, contract queries
  Post-session: action item follow-up,
                resource sharing, check-ins
  NOT: the meeting, the call, the evidence

Prisma:
  SessionRoom
  SessionJoinLog
  SessionTranscript
  StenoRecord (links to SessionRoom, stores PDF URL + hash)
```

---

### M-8 — Session Rhythm & Milestone Framework
**Structure without rigidity. Predictable for both parties.**

```
Deliverables:
- Engagement structures (chosen at contract stage):
    Sprint  (30 days): 4 sessions, 1 milestone
    Standard(60 days): 6 sessions, 2 milestones
    Deep    (90 days): 8 sessions, 3 milestones

- Session 1 — Goal Setting (mandatory):
    Structured agenda enforced by platform
    Mentee: current situation
    Mentee: target outcome
    Both agree on engagement goal (written in platform)
    Both agree on session rhythm
    Both agree on what success looks like
    Output: Goal Document stored against contract
    Both parties sign off on Goal Document
    This becomes dispute resolution reference

- Mid-milestone review:
    Mentor files progress assessment (structured)
    Mentee files self-assessment (structured)
    System compares — flags significant misalignment
    If misaligned: platform suggests re-alignment
    session before proceeding

- Final session — Outcome Review:
    Review original Goal Document
    What was achieved
    What wasn't achieved (honest)
    Mentor's outcome claim
    Mentee's outcome acknowledgement
    Both sign off on Outcome Document
    Triggers final tranche release

- Rescheduling rules:
    Mentee can reschedule up to 2 sessions
    Mentor can reschedule up to 1 session
    No-show by mentor: session credit to mentee
    No-show by mentee: session forfeited, no refund
    No-show defined: not in platform room
    within 15 mins of scheduled start
```

---

### M-9 — Dispute Resolution Engine
**Evidence only. The platform is not a judge of stories.**

```
Deliverables:
- Dispute filing window:
    Only within 7 days of milestone
    After 7 days: auto-release occurred, window closed

- Dispute categories (structured selection):
    Session did not happen
    Session below minimum duration
    Mentor did not file summary [now: steno not generated]
    Agreed commitments not met
    Mentor solicited off-platform
    Other (requires evidence upload)

- Evidence assembly (automatic on dispute filing):
    Session join log
    Session duration log
    Ascend Steno record
    Messaging flag log
    Contract terms (relevant clauses)
    Goal Document
    Admin sees package — not parties' words

- Resolution rules (not discretionary):

    "Session did not happen"
      → Check join log
      → Both joined 20+ mins: dispute rejected
      → One or both didn't join: upheld → refund

    "Session below minimum duration"
      → Check duration log
      → Under 20 mins: upheld automatically
      → No admin review needed

    "Steno not generated"
      → Check StenoRecord
      → Not generated (technical failure):
        milestone frozen until resolved
        no strike to either party
      → Session too short to generate:
        treated as incomplete session

    "Commitments not met"
      → Check Steno record for commitment extraction
      → Commitment appears in record: mentor's word
        against mentee's — ops review required
      → Commitment not in record: dispute rejected
        (mentee cannot claim commitment not documented)

    "Mentor solicited off-platform"
      → Check message flag log
      → Flag exists: upheld
      → No flag: rejected

- Admin role:
    Cannot override rule-based resolutions
    Only reviews "Other" category
    Decision requires:
      Reason code (structured)
      Evidence reference
      Cannot be based on party statements alone
    Decision final — logged permanently

- Strike system:
    Mentee: 2 rejected → loses dispute rights
    Mentee: 3 rejected → banned from marketplace
    Mentor: 2 upheld → warning + mandatory review
    Mentor: 3 upheld → suspended pending review
    Mentor: 4 upheld → permanent removal
    All strike records permanent
    Cannot be appealed or removed by any admin
```

---

### M-10 — Outcome Verification & Attribution
**The transition record that becomes a credential.**

```
Deliverables:
- Outcome claim (system-prompted at engagement end):
    Did mentee achieve their stated goal? Y / Partial / N
    If partial: what was achieved (structured)
    Evidence (optional but weighted):
      Got the role: LinkedIn update URL
      Got the promotion: self-reported
      Made the switch: verified employment change

- Outcome acknowledgement (mentee):
    7-day window to confirm or dispute mentor's claim
    Confirmed → VERIFIED
    Disputed → DISPUTED, ops review
    Silent → UNACKNOWLEDGED
      (shown differently on mentor profile
       — not the same as verified)

- Long-term outcome tracking:
    6 months after close: platform check-in to mentee
    "Did you achieve your goal?"
    Optional — incentivised with profile badge
    Captures delayed outcomes

- Outcome on mentor profile:
    X verified outcomes
    Y unacknowledged (shown separately)
    Transition types achieved
    Avg time to outcome
    NOT shown: mentee names, mentee companies

- Outcome as platform data:
    Feeds matching engine
    Feeds M-17 analytics
    Feeds mentor tier calculation (M-11)
```

---

### M-11 — Mentor Reputation & Tier System
**Earned through evidence. Not self-declared.**

```
Tiers (system-calculated weekly, not applied for):

RISING (new mentor)
  Verified outcomes: 0-4
  Max active mentees: 2
  Circles: not available
  Platform fee: 20%
  Profile badge: none

ESTABLISHED
  Verified outcomes: 5-9
  Max active mentees: 4
  Circles: 1 allowed
  Platform fee: 15%
  Profile badge: Established Mentor ✓
  Priority in matching algorithm

ELITE
  Verified outcomes: 10+
  Max active mentees: 6
  Circles: 2 allowed
  Platform fee: 10%
  Profile badge: Elite Mentor ✓ (verified)
  Featured in platform marketing
  First access to new mentee cohorts

Tier calculation inputs:
  Verified outcomes (primary)
  Dispute record
  Session completion rate
  Steno generation rate (replaces summary filing)
  Re-verification status

Tier demotion:
  Dispute rate exceeds threshold
  Steno generation rate drops below 90%
    (technical failures don't count against mentor)
  Re-verification lapses
  Demotion affects new engagements only
  Active engagements unaffected

Public profile shows:
  Tier badge (platform verified)
  Verified outcomes count
  Transition types (what they've helped with)
  Avg engagement rating
  Member since
  Verification status

NOT shown:
  Earnings
  Applications received
  Decline rate
```

---

### M-12 — Mentorship Circles
**Small group. Same transition. One mentor.**

```
Deliverables:
- Circle structure:
    4-6 mentees per circle
    One mentor
    Same / similar transition goal
    Same engagement duration (90 days standard)

- Circle formation:
    Mentor creates circle:
      Transition type focus
      Max mentees (4-6)
      Start date (fixed — all start together)
      Price per mentee (lower than 1:1)
    Platform matches eligible mentees to circle
    Mentees apply (same application as 1:1)
    Mentor selects from applicants
    Circle locks when full or at start date

- Circle session format:
    Shared Daily.co room (all in one session)
    Ascend Steno runs for group session
    Speaker attribution captures each member
    Individual Goal Documents per mentee
    Shared milestone framework
    Optional 1:1 slot: 15 mins per mentee per session

- Circle contract:
    One contract per mentee — not one for all
    Each mentee signs individually
    Each mentee's escrow managed individually
    One mentee dropping out doesn't affect others

- Peer accountability layer:
    Mentees can see each other's Goal Documents
    (with explicit consent at contract signing)
    Optional peer check-in between sessions
    Async, platform messaging only
    This is what makes circles genuinely different from 1:1

- Circle pricing rules:
    Mentor sets price per mentee
    Platform floor: lower than 1:1
    Platform ceiling: max 60% of equivalent 1:1 price
    Circles must be accessible — not just cheaper 1:1

- Capacity counting:
    One circle = 1 mentor slot regardless of mentee count
    Mentor with 4 active mentees + 1 circle
    = at capacity for ESTABLISHED tier
```

---

### M-13 — Mentor Monetisation Unlock
**Capacity gates. Not a switch you flip.**

```
Deliverables:
- Free tier (all mentors start here):
    Can conduct mentorship
    Cannot charge mentees
    Builds verified outcome record
    Platform still takes 10%
    (covers infrastructure costs)

- Paid tier unlock (ALL conditions must be met):
    Minimum 3 verified outcomes
    Minimum 90% steno generation rate
    Zero upheld disputes
    Re-verification current
    Minimum 6 months on platform
    All conditions checked weekly by system
    Unlocks automatically when met
    Mentor notified with unlock details and pricing rules

- Pricing rules for paid mentors:
    Mentor sets own price within band
    Platform floor: ₹2,000 per session
    Platform ceiling: ₹25,000 per session
    Circle pricing: separate floor/ceiling
    Prevents race to bottom and exploitation

- Payout schedule:
    T+2 after each tranche release
    Monthly payout report (PDF, downloadable)
    Annual earnings summary (for GST filing)
    GST: mentor's own responsibility
    Platform provides transaction records for filing
```

---

### M-14 — Platform Fee & Revenue Layer

```
Deliverables:
- Fee calculation engine:
    Applied at tranche release
    Mentor tier at time of release determines %
    Not retroactive — tier up mid-engagement:
    remaining tranches use new % from next release

- Fee refund conditions:
    Refunded if: dispute upheld (mentee refund)
    Refunded if: mentor terminates early
    NOT refunded if: mentee terminates (completed sessions)
    NOT refunded if: auto-release after silent mentee

- Pilot period policy:
    Platform fee waived during pilot
    Both parties notified explicitly
    Fee structure communicated — no surprise at pilot end
    All infrastructure runs at full fidelity:
    escrow, contracts, steno, evidence layer
    Builds trust before platform takes money

- Revenue tracking:
    Per engagement, per mentor, per month
    Feeds M-17 analytics and Phase 16 platform analytics
```

---

### M-15 — Legal Framework & Compliance

```
Three legal documents:

1. Mentorship Marketplace Addendum
   Signed once at signup
   Governs all mentorship activity
   Zero Trust policy — explicit
   Off-platform prohibition — explicit
   Transcription consent — explicit
   Auto-release terms — explicit

2. Mentor Conduct Agreement
   Signed when becoming a mentor
   Capacity limits
   Fee structure and payout terms
   Verification requirements and re-verification
   Strike consequences
   Off-platform prohibition
   Steno consent and data retention

3. Engagement Contract (per engagement — M-5)
   Generated fresh for each mentor-mentee pair
   Both parties sign via OTP
   Immutable after signing

Governing law:
  Indian Contract Act, 1872
  Information Technology Act, 2000
  Consumer Protection Act, 2019
  Jurisdiction: Ascend's registered city

Data retention:
  Session transcripts: 3 years
  Contracts: 7 years
  Payment records: 7 years
  (Indian accounting requirements)

Transcription clause (explicit, prominent):
  "All sessions transcribed by Ascend AI.
   Transcripts used solely for session
   documentation and dispute resolution.
   Never used for AI training, marketing,
   or any other purpose.
   Ascend staff access transcripts only
   on formal dispute."

Zero Trust statement (shown before marketplace access):
  "Ascend Mentorship operates on a Zero Trust
   framework. No claims made by mentors or mentees
   are accepted at face value. All sessions,
   milestones, payments, and outcomes are governed
   exclusively by platform-generated evidence.
   Verbal agreements, off-platform communications,
   and self-reported activity carry no weight in
   any dispute or payment decision."

Post-pilot legal additions:
  Aadhaar eSign integration (stronger verification)
  GST invoice automation
  DPDP Act 2023 compliance audit
```

---

### M-16 — Admin & Ops Layer

```
Deliverables:
- Verification queue:
    Document viewer in admin panel
    Approve / Request more info / Reject
    Reason codes mandatory
    SLA: 48 hours (shown to mentor at submission)
    All decisions logged — immutable

- Dispute review queue:
    Rule-based: auto-resolved, no queue
    "Other" category: ops reviews
    Evidence package auto-assembled
    Decision form: structured, reason code mandatory
    SLA: 48 hours
    Decision logged permanently

- Mentor monitoring dashboard:
    Steno generation rate per mentor
    Dispute rate per mentor
    Session completion rate per mentor
    Tier eligibility status
    Re-verification due dates

- Audit log viewer:
    Every payment movement
    Every admin action
    Every contract event
    Every dispute resolution
    Filterable, exportable
    Immutable — no edit or delete path

- Platform health:
    Active engagements
    Escrow total held
    Disputes open / resolved
    Mentor tier distribution
    Outcome verification rate

Admin Zero Trust:
    Admins cannot manually release escrow
    without audit trail and reason code
    Admins cannot delete session logs
    Admins cannot modify signed contracts
    Admins cannot override rule-based dispute resolutions
    Every admin action requires reason code
    All logged permanently
```

---

### M-17 — Mentorship Analytics & Insights

```
Platform level (admin):
  Engagements started / completed / terminated
  Outcome verification rate
  Avg time to outcome by transition type
  Dispute rate by mentor tier
  Revenue by mentor tier
  Most common transition types
  Matching acceptance rate
    (mentee applies → mentor accepts %)
  Steno generation success rate

Mentor level (own dashboard):
  Applications received vs accepted
  Engagement completion rate
  Outcome verification rate
  Avg mentee rating
  Earnings (current month / all time)
  Tier progress (X more outcomes to next tier)
  Steno generation rate
  Upcoming sessions

Mentee level (own dashboard):
  Applications sent vs accepted
  Engagements completed
  Goals achieved vs set
  Amount spent
  Outcomes logged
  Action items pending (from Steno records)
```

---

## Build Sequence

**Release 1 — Trust & Engagement Infrastructure**
M-1 through M-9
Complete trust, contract, payment, meeting, and evidence layer.
Pilot runs on this release.

**Release 2 — Reputation, Scale & Intelligence**
M-10 through M-17
Outcome attribution, tiers, circles, monetisation, governance, analytics.
Full marketplace on this release.

---

## What This Is Not

- Not a booking system
- Not a LinkedIn feature
- Not a calendar with a mentor skin
- Not a coaching marketplace clone

## What This Is

A trust infrastructure. The first mentorship platform in India
where every session is evidenced, every rupee is protected,
every outcome is verified, and neither party can game the system.

---

## Ascend Steno — Feature Summary

```
What:    AI-powered session recorder and summariser
         built into every Ascend mentorship session

How:     Daily.co transcription (speaker-attributed)
         + GPT-4o structured extraction
         + Immutable PDF session record

Produces per session:
  Discussion summary
  Mentor commitments (extracted from transcript)
  Mentee commitments (extracted from transcript)
  Action items with owners
  Next session focus
  Goal progress signal
  Platform-verified attendee log

Evidence value:
  Replaces mentor manual summary (retired)
  Primary evidence in dispute resolution
  Immutable — neither party can edit
  Ops access only on formal dispute

Name: Ascend Steno
```

---
*Ascend Mentorship Roadmap v1.0 — 2026-03-01*
*Architecture decisions locked. Prompts pending.*
*Next step: M-1 through M-9 build prompt (Release 1)*
