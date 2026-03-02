import { prisma } from "@/lib/prisma/client";
import type { UserPersona } from "@prisma/client";

export const EVENTS = {
  USER_REGISTERED: "user_registered",
  PERSONA_SELECTED: "persona_selected",
  CONTEXT_COMPLETED: "context_completed",
  CONTEXT_SKIPPED: "context_skipped",

  JOB_VIEWED: "job_viewed",
  JOB_SAVED: "job_saved",
  JOB_APPLIED: "job_applied",
  JOB_SEARCH_PERFORMED: "job_search_performed",

  FIT_SCORE_VIEWED: "fit_score_viewed",
  RESUME_OPTIMISED: "resume_optimised",
  RESUME_BUILT: "resume_built",
  SALARY_PAGE_VIEWED: "salary_page_viewed",
  COMPANY_PAGE_VIEWED: "company_page_viewed",

  MENTOR_SEARCH_PERFORMED: "mentor_search_performed",
  MENTOR_PROFILE_VIEWED: "mentor_profile_viewed",
  MENTOR_SESSION_REQUESTED: "mentor_session_requested",
  MENTOR_SESSION_COMPLETED: "mentor_session_completed",

  CONTRACT_GENERATED: "contract_generated",
  CONTRACT_OTP_REQUESTED: "contract_otp_requested",
  CONTRACT_SIGNED_MENTOR: "contract_signed_mentor",
  CONTRACT_SIGNED_MENTEE: "contract_signed_mentee",
  CONTRACT_VOIDED: "contract_voided",
  CONTRACT_DOWNLOADED: "contract_downloaded",
  CONTRACT_FLAGGED: "contract_flagged",

  PROFILE_VIEWED: "profile_viewed",
  PROFILE_EDITED: "profile_edited",
  DASHBOARD_VISITED: "dashboard_visited",
  RETURN_VISIT: "return_visit",

  COVER_LETTER_GENERATED: "cover_letter_generated",
  COVER_LETTER_ATTACHED_TO_APPLICATION: "cover_letter_attached",
  INTERVIEW_PREP_GENERATED: "interview_prep_generated",
  PROFILE_OPTIMISER_RUN: "profile_optimiser_run",
  PROFILE_SUGGESTION_COPIED: "profile_suggestion_copied",
  JOB_RECOMMENDATION_DISMISSED: "job_recommendation_dismissed",
  JOB_RECOMMENDATION_APPLIED: "job_recommendation_applied",

  RECRUITER_INTELLIGENCE_VIEWED: "recruiter_intelligence_viewed",
  FUNNEL_VIEWED: "funnel_viewed",
  BENCHMARK_VIEWED: "benchmark_viewed",
  FIT_EXPLAINER_OPENED: "fit_explainer_opened",
  SCORECARD_SUBMITTED: "scorecard_submitted",
  DI_METRICS_ENABLED: "di_metrics_enabled",
  DI_METRICS_VIEWED: "di_metrics_viewed",

  UTM_VISIT: "UTM_VISIT",
} as const;

export type AnalyticsContext = {
  userId?: string;
  sessionId?: string;
  persona?: UserPersona | string;
  page?: string;
  referrer?: string;
  deviceType?: string;
};

/**
 * Lightweight server-side event tracker.
 * Call from API routes and server actions only — never from client.
 */
export async function track(
  event: string,
  properties: Record<string, unknown> = {},
  context?: AnalyticsContext
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        event,
        properties: properties as object,
        userId: context?.userId ?? null,
        sessionId: context?.sessionId ?? null,
        persona: (context?.persona as UserPersona) ?? null,
        page: context?.page ?? null,
        referrer: context?.referrer ?? null,
        deviceType: context?.deviceType ?? null,
      },
    });
  } catch {
    // Non-blocking: do not throw; analytics must not break app
  }
}
