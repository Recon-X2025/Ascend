# DPDP Act 2023 — Compliance Audit

**Date:** March 2026  
**Scope:** Ascend Career Navigation Platform — data handling against Digital Personal Data Protection Act 2023 (India)

---

## 1. Data Inventory

| Category | Data | Retention | Purpose |
|----------|------|-----------|---------|
| User account | email, name, passwordHash | Until deletion | Authentication |
| Profile | JobSeekerProfile, Resume, Experience, etc. | Until deletion | Job seeking, mentorship |
| Applications | JobApplication, screening responses | 2 years post-hire/reject | Hiring pipeline |
| Mentorship | Contracts, outcomes, escrow | 7 years (tax/legal) | Engagements |
| Payments | PaymentEvent, Invoice | 7 years | GST, audits |
| Audit log | AuditLog (actor, action, entity) | 2 years | Security, compliance |
| Analytics | OutcomeEvent, FitScore | 90 days | Product insights |

## 2. Consent Mechanisms

- **Terms acceptance:** `termsAcceptedAt` at registration
- **Marketing consent:** `marketingConsent` (email, push)
- **Contract consent:** Explicit at signing (M-5)
- **Profile visibility:** `ProfileVisibility`, `OpenToWorkVisibility`

## 3. Data Subject Rights (DPDP Section 11)

| Right | Implementation |
|-------|----------------|
| Access | DataRequest model; user can request export |
| Correction | Profile/edit flows |
| Erasure | Soft delete (`deletedAt`); anonymisation on request |
| Portability | Export JSON (via DataRequest) |

## 4. Phase 17 Trust & Safety (Existing)

- **AuditLog:** All material actions logged
- **DataRequest:** User-initiated access/erasure requests
- **Soft delete:** `User.deletedAt`; PII anonymised on purge
- **Processor DPAs:** Razorpay, Resend, Vercel — review pending

## 5. Gaps

- [ ] Formal DPO appointment
- [ ] Processor DPAs signed and filed
- [ ] Privacy policy update for DPDP-specific language
- [ ] Consent audit for legacy users

---

*Full audit to be completed with legal review. Phase 17 provides base infrastructure.*
