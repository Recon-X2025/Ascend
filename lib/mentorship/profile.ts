import { z } from "zod";

const currentYear = new Date().getFullYear();

export const mentorCompanyTypeValues = [
  "STARTUP_SEED",
  "STARTUP_SERIES_A_B",
  "STARTUP_LATE_STAGE",
  "MNC",
  "INDIAN_LARGE_CORP",
  "SME",
  "GOVERNMENT_PSU",
  "FREELANCE_CONSULTING",
  "NGO_NONPROFIT",
  "ACADEMIA",
] as const;

export const engagementLengthValues = ["SPRINT_30", "STANDARD_60", "DEEP_90"] as const;
export const sessionFrequencyValues = ["WEEKLY", "FORTNIGHTLY"] as const;
export const m2FocusAreaValues = [
  "CAREER_PIVOT",
  "FIRST_JOB",
  "IC_TO_MANAGEMENT",
  "MANAGEMENT_TO_IC",
  "DOMAIN_SWITCH",
  "GEOGRAPHY_MOVE",
  "STARTUP_TO_ENTERPRISE",
  "ENTERPRISE_TO_STARTUP",
  "SALARY_NEGOTIATION",
  "INTERVIEW_PREP",
  "PORTFOLIO_BUILDING",
  "GRADUATE_SCHOOL",
  "ENTREPRENEURSHIP",
] as const;

export const geographyScopeValues = ["INDIA_ONLY", "INDIA_TO_GLOBAL", "SPECIFIC_COUNTRIES"] as const;
export const dayOfWeekValues = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

const keyFactorSchema = z.string().min(20, "Min 20 characters").max(200, "Max 200 characters");
const statementSchema = z.string().min(50, "Min 50 characters").max(400, "Max 400 characters");

const availabilityWindowSchema = z.object({
  dayOfWeek: z.enum(dayOfWeekValues),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Use HH:MM 24hr"),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Use HH:MM 24hr"),
});

const mentorProfileBaseSchema = z.object({
  fromRole: z.string().min(1).max(120),
  fromCompanyType: z.enum(mentorCompanyTypeValues),
  fromIndustry: z.string().min(1).max(100),
  fromCity: z.string().min(1).max(100),
  toRole: z.string().min(1).max(120),
  toCompanyType: z.enum(mentorCompanyTypeValues),
  toIndustry: z.string().min(1).max(100),
  toCity: z.string().min(1).max(100),
  transitionDurationMonths: z.number().int().min(1).max(120),
  transitionYear: z.number().int().min(2000).max(currentYear),
  keyFactor1: keyFactorSchema,
  keyFactor2: keyFactorSchema,
  keyFactor3: keyFactorSchema,
  statementTransitionMade: statementSchema,
  statementWishIKnew: statementSchema,
  statementCanHelpWith: statementSchema,
  statementCannotHelpWith: statementSchema,
  maxActiveMentees: z.number().int().min(1).max(6).default(2),
  engagementPreference: z.array(z.enum(engagementLengthValues)).min(1, "Select at least one"),
  sessionFrequency: z.enum(sessionFrequencyValues),
  timezone: z.string().max(60).default("Asia/Kolkata"),
  m2FocusAreas: z.array(z.enum(m2FocusAreaValues)).min(1, "Select at least one").max(5),
  languages: z.array(z.string().min(1).max(50)).min(1).default(["English"]),
  geographyScope: z.enum(geographyScopeValues),
  geographyCountries: z.array(z.string().max(100)).default([]),
  availabilityWindows: z.array(availabilityWindowSchema).min(1, "Add at least one availability window"),
});

export const mentorProfileCreateSchema = mentorProfileBaseSchema.refine(
  (data) =>
    data.geographyScope !== "SPECIFIC_COUNTRIES" || data.geographyCountries.length > 0,
  { message: "Select at least one country when scope is Specific countries", path: ["geographyCountries"] }
);

export const mentorProfileUpdateSchema = mentorProfileBaseSchema.partial();

export const availabilityWindowsPutSchema = z.object({
  windows: z.array(availabilityWindowSchema).min(1, "At least one window required"),
});

export type MentorProfileCreateInput = z.infer<typeof mentorProfileCreateSchema>;
export type MentorProfileUpdateInput = z.infer<typeof mentorProfileUpdateSchema>;
export type AvailabilityWindowInput = z.infer<typeof availabilityWindowSchema>;
