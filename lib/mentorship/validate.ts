import { z } from "zod";

export const wordCount = (str: string): number =>
  str
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

export const wordRange = (min: number, max: number) =>
  z.string().refine(
    (val) => {
      const n = wordCount(val);
      return n >= min && n <= max;
    },
    { message: `Must be between ${min} and ${max} words` }
  );

export const MentorApplicationSchema = z.object({
  mentorProfileId: z.string().cuid(),
  matchReason: z.string().min(1),
  whyThisMentor: wordRange(100, 200),
  goalStatement: wordRange(50, 150),
  commitment: wordRange(50, 150),
  timeline: wordRange(30, 100),
  whatAlreadyTried: wordRange(50, 150),
});

export const TargetTransitionSchema = z.object({
  targetFromRole: z.string().min(1),
  targetFromIndustry: z.string().min(1),
  targetToRole: z.string().min(1),
  targetToIndustry: z.string().min(1),
  targetCity: z.string(),
  targetTimelineMonths: z.number().int().min(1).max(24),
});

export const MentorQuestionSchema = z.object({
  question: z.string().min(1).max(300),
});

export const MenteeAnswerSchema = z.object({
  answer: wordRange(50, 500),
});

export const MentorRespondSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE", "ASK"]),
  question: z.string().max(300).optional(),
  declineReason: z.string().max(500).optional(),
});

export type MentorApplicationInput = z.infer<typeof MentorApplicationSchema>;
export type TargetTransitionInput = z.infer<typeof TargetTransitionSchema>;
