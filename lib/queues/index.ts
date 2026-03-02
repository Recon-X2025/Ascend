import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const resumeQueue = new Queue("resume", { connection });
export const fitScoreQueue = new Queue("fit-score", { connection });
export const optimiserQueue = new Queue("optimiser", { connection });
export const emailQueue = new Queue("email", { connection });
export const salaryAggregateQueue = new Queue("salary-aggregate", { connection });
export const mentorshipExpiryQueue = new Queue("mentorship-expiry", { connection });
export const candidateIntelligenceQueue = new Queue("compute-candidate-intelligence", {
  connection,
});
export const weeklyDigestQueue = new Queue("weekly-digest", { connection });
export const mentorshipMatchQueue = new Queue("mentorship-match", { connection });
export const coverLetterQueue = new Queue("cover-letter", { connection });
export const interviewPrepQueue = new Queue("interview-prep", { connection });
export const profileOptimiseQueue = new Queue("profile-optimise", { connection });
export const contractPdfQueue = new Queue("contract-pdf", { connection });
export const dataExportQueue = new Queue("data-export", { connection });
export const accountDeletionQueue = new Queue("account-deletion", { connection });
export const outcomeAcknowledgementQueue = new Queue("outcome-acknowledgement", { connection });
export const outcomeCheckinQueue = new Queue("outcome-checkin", { connection });
// Phase 18: B2B / Enterprise
export const bulkImportQueue = new Queue("bulk-import", { connection });
export const webhookDeliveryQueue = new Queue("webhook-delivery", { connection });
export const atsWebhookProcessorQueue = new Queue("ats-webhook-processor", { connection });
export const invoicePdfQueue = new Queue("invoice-pdf", { connection });
// M-7: Session Steno & Evidence
export const stenoExtractionQueue = new Queue("steno-extraction", { connection });
export const sessionRecordQueue = new Queue("session-record", { connection });
export const sessionFinaliseQueue = new Queue("session-finalise", { connection });
export const dailyCoWebhookQueue = new Queue("dailyco-webhook", { connection });
// M-13: Mentor reports
export const monthlyMentorReportQueue = new Queue("monthly-mentor-report", { connection });
export const annualMentorSummaryQueue = new Queue("annual-mentor-summary", { connection });
// M-9: Dispute Resolution Engine
export const disputeEvidenceQueue = new Queue("dispute-evidence", { connection });
export const disputeAutoResolveQueue = new Queue("dispute-auto-resolve", { connection });

export interface ResumeJobData {
  userId: string;
  profileId: string;
  careerIntentId: string;
  templateId: string;
  promptVersion: string;
}

export const RESUME_JOB_GENERATE_CONTENT = "generate-content";
export const RESUME_JOB_GENERATE_SUMMARY = "generate-summary";

export interface ResumeGenerateSummaryPayload {
  jobType: typeof RESUME_JOB_GENERATE_SUMMARY;
  userId: string;
  careerIntentId: string;
}

export interface ResumeGenerateContentPayload {
  jobType: typeof RESUME_JOB_GENERATE_CONTENT;
  userId: string;
  careerIntentId: string;
  selectedItems: {
    experiences: string[];
    skills: string[];
    education: string[];
    certs: string[];
    projects: string[];
  };
  /** Experience IDs to limit to max 2 bullets (condense). */
  condenseExperienceIds?: string[];
  /** When set, only regenerate this experience and merge into existing snapshot. */
  regenerateExperienceId?: string;
  /** For regenerate: current regeneration count for this item (max 3 per session). */
  regenerationCount?: number;
}

export interface FitScoreJobData {
  userId: string;
  profileId: string;
  jobId: string;
  jobDescription: string;
  promptVersion: string;
}

export interface OptimiserJobData {
  userId: string;
  profileId: string;
  resumeId: string;
  jobDescription: string;
  promptVersion: string;
}

export interface EmailJobData {
  to: string;
  template: string;
  data: Record<string, unknown>;
}

export interface SalaryAggregateJobData {
  role: string;
  city?: string | null;
  year?: number | null;
}

export interface CandidateIntelligenceJobData {
  userId: string;
}

export interface WeeklyDigestJobData {
  userId: string;
}

export interface MentorshipMatchJobData {
  menteeUserId: string;
}

export interface CoverLetterJobData {
  userId: string;
  jobPostId: number;
  resumeVersionId?: string | null;
  optionalNote?: string | null;
}

export interface InterviewPrepJobData {
  userId: string;
  jobPostId: number;
}

export interface ProfileOptimiseJobData {
  userId: string;
}

export interface ContractPdfJobData {
  contractId: string;
}

export interface DataExportJobData {
  dataRequestId: string;
  userId: string;
}

export interface AccountDeletionJobData {
  dataRequestId: string;
  userId: string;
}

export interface OutcomeAcknowledgementJobData {
  outcomeId: string;
}

export interface OutcomeCheckinJobData {
  outcomeId: string;
}

export interface BulkImportJobData {
  importJobId: string;
}

export interface WebhookDeliveryJobData {
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
}

export interface AtsWebhookProcessorJobData {
  eventId: string;
}

export interface InvoicePdfJobData {
  invoiceId: string;
}

export interface StenoExtractionJobData {
  sessionId: string;
}

export interface SessionRecordJobData {
  sessionId: string;
}

export interface SessionFinaliseJobData {
  sessionId: string;
}

export interface DailyCoWebhookJobData {
  payload: object;
  eventType: string;
}

export interface MonthlyMentorReportJobData {
  mentorUserId: string;
}

export interface AnnualMentorSummaryJobData {
  mentorUserId: string;
}

export interface DisputeEvidenceJobData {
  disputeId: string;
}

export interface DisputeAutoResolveJobData {
  disputeId: string;
}
