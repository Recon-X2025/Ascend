import { z } from "zod";

export const applyFormSchema = z.object({
  resumeVersionId: z.string().nullable(),
  coverLetter: z.string().max(2000).optional(),
  coverLetterId: z.string().nullable().optional(),
  responses: z.array(
    z.object({
      questionId: z.string(),
      question: z.string(),
      type: z.enum(["TEXT", "YES_NO", "MULTIPLE_CHOICE"]),
      answer: z.string(),
    })
  ).optional().default([]),
});

export type ApplyFormValues = z.infer<typeof applyFormSchema>;

export function buildApplySchema(requiredQuestionIds: string[]) {
  return applyFormSchema.refine(
    (data) => {
      const byId = new Map((data.responses ?? []).map((r) => [r.questionId, r.answer]));
      return requiredQuestionIds.every((id) => (byId.get(id) ?? "").trim().length > 0);
    },
    { message: "All required questions must be answered", path: ["responses"] }
  );
}
