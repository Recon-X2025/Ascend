import { z } from "zod";

const jobTypeEnum = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE", "TEMPORARY"]);
const workModeEnum = z.enum(["ONSITE", "REMOTE", "HYBRID"]);
const educationLevelEnum = z.enum(["ANY", "HIGH_SCHOOL", "DIPLOMA", "BACHELORS", "MASTERS", "PHD"]);
const jobStatusEnum = z.enum(["DRAFT", "ACTIVE", "PAUSED", "CLOSED"]);
const jobVisibilityEnum = z.enum(["PUBLIC", "INTERNAL", "UNLISTED"]);
const screeningTypeEnum = z.enum(["TEXT", "YES_NO", "MULTIPLE_CHOICE"]);

const jobBaseSchema = z.object({
  title: z.string().min(1).max(100),
  companyId: z.string().optional().nullable(),
  companyName: z.string().max(200).optional().nullable(),
  type: jobTypeEnum,
  workMode: workModeEnum,
  locations: z.array(z.string().max(100)).min(0).max(20),
  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().min(0).optional().nullable(),
  salaryCurrency: z.string().max(10).default("INR"),
  salaryVisible: z.boolean().default(true),
  experienceMin: z.number().int().min(0).max(50).optional().nullable(),
  experienceMax: z.number().int().min(0).max(50).optional().nullable(),
  educationLevel: educationLevelEnum.default("ANY"),
  openings: z.number().int().min(1).max(1000).default(1),
  deadline: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
  easyApply: z.boolean().default(true),
  applicationUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  description: z.string().min(100),
  tags: z.array(z.string().max(50)).default([]),
  status: jobStatusEnum.default("DRAFT"),
  visibility: jobVisibilityEnum.default("PUBLIC"),
  internalFirstDays: z.number().int().min(1).max(30).optional().nullable(),
  allowAnonymousApply: z.boolean().default(false),
  skills: z.array(
    z.object({ skillId: z.string(), required: z.boolean() })
  ).max(40).default([]),
  screeningQuestions: z.array(
    z.object({
      question: z.string().min(1).max(500),
      type: screeningTypeEnum,
      options: z.array(z.string().max(200)).optional().default([]),
      required: z.boolean().default(true),
      order: z.number().int().min(0).default(0),
    })
  ).default([]),
});

export const createJobSchema = jobBaseSchema.refine(
  (d) => d.workMode === "REMOTE" || d.locations.length > 0,
  { message: "Locations required when not Remote", path: ["locations"] }
).refine(
  (d) => d.easyApply || (!!d.applicationUrl && d.applicationUrl.length > 0),
  { message: "Application URL required when Easy Apply is off", path: ["applicationUrl"] }
);

export const updateJobSchema = jobBaseSchema.partial().extend({
  status: jobStatusEnum.optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
