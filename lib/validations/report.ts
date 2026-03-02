import { z } from "zod";

const REPORT_DESCRIPTION_MAX = 500;

export const reportTargetTypeEnum = z.enum([
  "JOB_POST",
  "COMPANY_REVIEW",
  "USER_PROFILE",
  "MESSAGE",
  "MENTOR_PROFILE",
]);

export const reportReasonEnum = z.enum([
  "SPAM",
  "MISLEADING",
  "INAPPROPRIATE",
  "FAKE",
  "HARASSMENT",
  "OTHER",
]);

export const createReportSchema = z.object({
  targetType: reportTargetTypeEnum,
  targetId: z.string().min(1).max(200),
  reason: reportReasonEnum,
  description: z.string().max(REPORT_DESCRIPTION_MAX).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export { REPORT_DESCRIPTION_MAX };
