/**
 * M-5: Contract content structure (snapshot at generation — immutable after both signatures).
 */

export interface ContractContent {
  mentor: {
    fullName: string;
    verifiedRole: string;
    verifiedCompany: string;
    verifiedIndustry: string;
    verificationDate: string;
    email: string;
  };
  mentee: {
    fullName: string;
    targetRole: string;
    currentRole: string;
    email: string;
  };
  engagementScope: {
    goal: string;
    commitment: string;
    timeline: string;
    engagementType: string;
    sessionCount: number;
    sessionFrequency: string;
    sessionDurationMins: number;
  };
  financial: {
    totalFeeINR: number | null;
    trancheStructure: Array<{
      trancheNumber: number;
      pctOfTotal: number;
      releaseCondition: string;
    }> | null;
    platformFeePct: number | null;
    pilotFeeWaived: boolean;
  };
  clauses: {
    offPlatformProhibition: string;
    earlyTerminationMentor: string;
    earlyTerminationMentee: string;
    transcriptionConsent: string;
    zeroTrustAcknowledgement: string;
    autoReleaseTerms: string;
    disputeResolutionProcess: string;
    dataRetention: string;
  };
  governingLaw: {
    acts: string[];
    jurisdiction: string;
  };
  tcVersion: string;
  generatedAt: string;
}

export const CONTRACT_TC_VERSION = "1.0.0";

export const CONTRACT_CLAUSES = {
  offPlatformProhibition: `All mentorship sessions must take place exclusively within the Ascend platform.
Communicating, meeting, or transacting outside the Ascend platform in connection
with this engagement constitutes a material breach of this contract and may result
in immediate termination of the engagement, forfeiture of fees, and suspension from
the Ascend Mentorship Marketplace.`,

  earlyTerminationMentor: `The mentor may terminate this engagement early by providing written notice through the Ascend platform. Any fees already released to the mentor are non-refundable. Fees held in escrow for uncompleted sessions will be returned to the mentee in accordance with platform policy.`,

  earlyTerminationMentee: `The mentee may terminate this engagement early by providing written notice through the Ascend platform. Any fees already released to the mentor are non-refundable. Fees held in escrow for uncompleted sessions will be returned to the mentee in accordance with platform policy.`,

  transcriptionConsent: `Both parties acknowledge and consent to all sessions within this engagement being
transcribed by Ascend AI. Transcripts are used solely for the purpose of generating
the session record and, if applicable, dispute resolution. Transcripts are never used
for AI model training, marketing, or any other purpose. Ascend staff may access
transcripts only in the event of a formally filed dispute. Transcripts are retained
for three years from the date of each session.`,

  zeroTrustAcknowledgement: `Both parties acknowledge that Ascend Mentorship operates on a Zero Trust framework.
No claims, verbal agreements, or communications outside the Ascend platform carry
any weight in payment decisions, dispute resolution, or outcome attribution. All
sessions, milestones, payments, and outcomes are governed exclusively by
platform-generated evidence.`,

  autoReleaseTerms: `Payment tranches held in escrow are released upon the mentee confirming session
completion. If the mentee does not confirm or raise a dispute within 7 calendar days
of a session, the tranche releases automatically. Both parties agree that this
automatic release mechanism is fair and contractually binding.`,

  disputeResolutionProcess: `Any dispute arising from this engagement must be raised through the Ascend platform within 14 days of the relevant session or event. Ascend will review platform evidence (transcripts, session records, payment history) and issue a determination. Both parties agree to accept Ascend's determination as final and binding, subject to applicable law.`,

  dataRetention: `This contract and all associated session records, transcripts, and payment movements
are retained by Ascend for a period of 7 years from the date of contract activation,
in accordance with Indian accounting and legal requirements.`,
} as const;

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***@***";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***@${domain}`;
}
