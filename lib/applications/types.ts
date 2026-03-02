/**
 * Phase 6: Application types. ScreeningResponse stored as JSON in JobApplication.
 */

export interface ScreeningResponse {
  questionId: string;
  question: string;
  type: "TEXT" | "YES_NO" | "MULTIPLE_CHOICE";
  answer: string;
}

export type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "OFFERED"
  | "REJECTED"
  | "WITHDRAWN";
