/**
 * M-15: Single source of truth for legal document content.
 * Full text as TypeScript constants; [effectiveAt date] is replaced at display time from LegalDocument.effectiveAt.
 */

export const MENTORSHIP_MARKETPLACE_ADDENDUM_V1 = {
  type: "MENTORSHIP_MARKETPLACE_ADDENDUM" as const,
  version: "1.0.0",
  title: "Mentorship Marketplace Addendum",
  content: `MENTORSHIP MARKETPLACE ADDENDUM
Version 1.0.0 | Effective: [effectiveAt date]

This Addendum supplements Ascend's Terms of Service and governs your use of the Ascend Mentorship Marketplace. By signing, you agree to be bound by these terms in addition to the main Terms of Service.

1. ZERO TRUST POLICY
All mentorship activity must occur exclusively on the Ascend platform. Neither mentors nor mentees may conduct sessions, exchange contact details for session purposes, or share materials outside of Ascend's platform tools. "If it didn't happen on Ascend, it didn't happen."

2. OFF-PLATFORM PROHIBITION
You agree not to:
(a) Move sessions to WhatsApp, Zoom, Google Meet, phone calls, or any channel not provided by Ascend;
(b) Share personal contact information (phone number, personal email, social media handles) with the intent of conducting mentorship activity outside Ascend;
(c) Solicit or accept payments for mentorship services outside of Ascend's payment infrastructure.
Violation results in immediate account suspension and forfeiture of any funds held in escrow.

3. TRANSCRIPTION CONSENT
All sessions conducted on Ascend are transcribed by Ascend Steno, our AI-assisted transcription system. Transcripts are:
(a) Speaker-attributed and stored securely for 3 years;
(b) Used solely for session evidence, dispute resolution, and outcome verification;
(c) Never shared with third parties except as required by law or for dispute adjudication.
You consent to this transcription by accessing the Mentorship Marketplace.

4. PAYMENT AUTO-RELEASE
For paid engagements: if you (as mentee) do not confirm or dispute a milestone within 7 days of it being marked complete, payment for that tranche will be automatically released to the mentor. You waive any claim to funds auto-released under this clause.

5. STRIKE SYSTEM
(a) Mentees: 2 rejected dispute filings result in loss of dispute rights.
(b) Mentors: 3 upheld disputes result in account suspension.
Details of the strike system are published in Ascend's Community Guidelines.

6. GOVERNING LAW
This Addendum is governed by the Indian Contract Act 1872, the Information Technology Act 2000, and the Consumer Protection Act 2019. Disputes shall be subject to the jurisdiction of courts in Bengaluru, Karnataka.

7. CHANGES TO THIS ADDENDUM
Ascend may update this Addendum. You will be notified and required to re-sign if material changes are made. Continued use after the notice period constitutes acceptance.`,
};

export const MENTOR_CONDUCT_AGREEMENT_V1 = {
  type: "MENTOR_CONDUCT_AGREEMENT" as const,
  version: "1.0.0",
  title: "Mentor Conduct Agreement",
  content: `MENTOR CONDUCT AGREEMENT
Version 1.0.0 | Effective: [effectiveAt date]

This Agreement governs your conduct as a mentor on the Ascend platform. You must sign this Agreement before your mentor profile is created.

1. VERIFICATION REQUIREMENTS
(a) You agree to provide accurate identity and employment verification documents as requested by Ascend;
(b) You agree to re-verify your identity every 12 months or upon a role change;
(c) Your mentor profile is not discoverable until verification is approved by Ascend Operations;
(d) Providing false or misleading verification documents results in permanent ban.

2. CAPACITY LIMITS
(a) You agree to honour the maximum mentee capacity you declare on your profile;
(b) You will not accept engagement applications that would exceed your declared capacity;
(c) Ascend enforces capacity limits server-side. You acknowledge this enforcement is correct.

3. SESSION COMMITMENTS
(a) You agree to attend all scheduled sessions or provide 24 hours' notice of cancellation;
(b) Sessions must be conducted within Ascend's platform meeting room — not on external tools;
(c) A session under 20 minutes in duration is automatically marked INCOMPLETE_SESSION;
(d) You agree that Ascend Steno will transcribe all sessions.

4. FEE STRUCTURE (PAID TIER — POST-PILOT)
(a) Session pricing must be within the platform floor (₹2,000/session) and ceiling (₹25,000/session);
(b) Platform fees apply at tranche release: RISING tier 20%, ESTABLISHED tier 15%, ELITE tier 10%;
(c) Fees are deducted automatically — you will receive the net amount;
(d) You may not charge mentees outside the platform or request additional payments of any kind.

5. CONDUCT STANDARDS
(a) You will not solicit personal or professional relationships outside the scope of mentorship;
(b) You will not share mentee information with third parties;
(c) You will not discriminate on the basis of gender, caste, religion, region, or disability;
(d) Violation of conduct standards results in immediate suspension and may result in legal action.

6. STRIKE CONSEQUENCES
3 upheld disputes against you will result in mandatory account suspension. Ascend's dispute resolution is evidence-based and final for rule-based categories.

7. DATA & CONFIDENTIALITY
Session transcripts and mentee information shared during engagements are confidential. You may not use, reproduce, or disclose mentee information beyond the scope of the engagement.

8. GOVERNING LAW
This Agreement is governed by the Indian Contract Act 1872 and the Information Technology Act 2000. Disputes shall be subject to the jurisdiction of courts in Bengaluru, Karnataka.`,
};

export type LegalDocumentType = "MENTORSHIP_MARKETPLACE_ADDENDUM" | "MENTOR_CONDUCT_AGREEMENT";

export function formatContentWithEffectiveDate(content: string, effectiveAt: Date): string {
  return content.replace(
    /\[effectiveAt date\]/g,
    effectiveAt.toISOString().slice(0, 10)
  );
}
