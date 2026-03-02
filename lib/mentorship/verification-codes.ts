/**
 * M-1: Mentor verification reason codes.
 * Mandatory for every admin decision; used in VerificationAuditLog and decide API.
 */
export const VERIFICATION_REASON_CODES = {
  // Approval
  APPROVED_FULL: "Identity and employment verified",
  APPROVED_PARTIAL: "Identity verified — employment on trust for pilot",

  // More info
  ID_UNCLEAR: "Government ID unclear or expired",
  EMPLOYMENT_MISMATCH: "Employment document does not match stated role or company",
  LINKEDIN_MISMATCH: "LinkedIn profile does not match stated experience",
  ADDITIONAL_PROOF_REQUIRED: "Additional proof of employment required",

  // Rejection
  FAKE_DOCUMENTS: "Documents appear inauthentic",
  INELIGIBLE_EXPERIENCE: "Does not meet minimum experience requirement",
  DUPLICATE_ACCOUNT: "Duplicate mentor application detected",
  POLICY_VIOLATION: "Application violates platform policy",
} as const;

export type VerificationReasonCode = keyof typeof VERIFICATION_REASON_CODES;

export const VERIFICATION_REASON_CODE_VALUES = Object.keys(
  VERIFICATION_REASON_CODES
) as VerificationReasonCode[];

export function isValidReasonCode(code: string): code is VerificationReasonCode {
  return code in VERIFICATION_REASON_CODES;
}
