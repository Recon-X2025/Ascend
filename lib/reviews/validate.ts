/**
 * Phase 7: Shared Zod schemas for company review, interview review, and salary submission.
 */

import { z } from "zod";

const employmentTypeEnum = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]);
const employmentStatusEnum = z.enum(["CURRENT", "FORMER"]);
const ceoApprovalEnum = z.enum(["APPROVE", "DISAPPROVE", "NO_OPINION"]);
const rating1to5 = z.number().int().min(1).max(5);

// YYYY-MM
const yearMonth = z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM format");

export const companyReviewSchema = z.object({
  companyId: z.string().cuid(),
  jobTitle: z.string().min(1).max(200),
  department: z.string().max(200).optional().nullable(),
  employmentType: employmentTypeEnum,
  employmentStatus: employmentStatusEnum,
  employmentStart: yearMonth,
  employmentEnd: yearMonth.optional().nullable(),
  overallRating: rating1to5,
  workLifeBalance: rating1to5,
  culture: rating1to5,
  careerGrowth: rating1to5,
  compensation: rating1to5,
  management: rating1to5,
  headline: z.string().min(1).max(80),
  pros: z.string().min(50).max(1500),
  cons: z.string().min(50).max(1500),
  advice: z.string().max(1500).optional().nullable(),
  wouldRecommend: z.boolean(),
  ceoApproval: ceoApprovalEnum,
});

export const interviewReviewSchema = z.object({
  companyId: z.string().cuid(),
  jobTitle: z.string().min(1).max(200),
  interviewYear: z.number().int().min(2019).max(new Date().getFullYear()),
  interviewResult: z.enum(["OFFER", "REJECTED", "WITHDREW", "PENDING"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]),
  experience: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  overallRating: rating1to5,
  headline: z.string().min(1).max(80),
  processDesc: z.string().min(50).max(1500),
  questions: z.string().max(1500).optional().nullable(),
  tips: z.string().max(1500).optional().nullable(),
  roundCount: z.number().int().min(1).max(20).optional().nullable(),
  durationWeeks: z.number().int().min(1).max(52).optional().nullable(),
  applicationId: z.string().cuid().optional().nullable(),
});

export const salarySubmissionSchema = z.object({
  companyId: z.string().cuid(),
  jobTitle: z.string().min(1).max(200),
  department: z.string().max(200).optional().nullable(),
  employmentType: employmentTypeEnum,
  location: z.string().min(1).max(200),
  yearsExp: z.number().int().min(0).max(70),
  year: z.number().int().min(new Date().getFullYear() - 3).max(new Date().getFullYear()),
  salaryAmount: z.number().positive(),
  currency: z.string().max(10).optional().default("INR"),
  baseSalary: z.number().nonnegative().optional().nullable(),
  bonus: z.number().nonnegative().optional().nullable(),
  stocks: z.number().nonnegative().optional().nullable(),
});

export const voteSchema = z.object({
  helpful: z.boolean(),
});

export type CompanyReviewInput = z.infer<typeof companyReviewSchema>;
export type InterviewReviewInput = z.infer<typeof interviewReviewSchema>;
export type SalarySubmissionInput = z.infer<typeof salarySubmissionSchema>;
