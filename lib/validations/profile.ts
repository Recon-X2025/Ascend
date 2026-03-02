import { z } from "zod";

// Enums matching Prisma
export const noticePeriodValues = ["IMMEDIATE", "FIFTEEN_DAYS", "THIRTY_DAYS", "SIXTY_DAYS", "NINETY_DAYS", "MORE_THAN_NINETY"] as const;
export const workModeValues = ["REMOTE", "HYBRID", "ONSITE", "FLEXIBLE"] as const;
export const employmentTypeValues = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE", "TEMPORARY"] as const;
export const languageProficiencyValues = ["ELEMENTARY", "CONVERSATIONAL", "PROFESSIONAL", "NATIVE"] as const;
export const skillProficiencyValues = ["BEGINNER", "INTERMEDIATE", "EXPERT"] as const;
export const profileVisibilityValues = ["PUBLIC", "CONNECTIONS_ONLY", "RECRUITERS_ONLY", "PRIVATE"] as const;
export const openToWorkVisibilityValues = ["ALL", "RECRUITERS_ONLY"] as const;
export const resumeVisibilityValues = ["PUBLIC", "RECRUITERS_ONLY", "PRIVATE"] as const;

// Profile (PATCH /api/profile/me)
export const profileUpdateSchema = z.object({
  headline: z.string().max(120).optional().nullable(),
  summary: z.string().max(2000).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  pinCode: z.string().max(20).optional().nullable(),
  currentCompany: z.string().max(200).optional().nullable(),
  currentRole: z.string().max(120).optional().nullable(),
  totalExpYears: z.number().min(0).max(70).optional().nullable(),
  noticePeriod: z.enum(noticePeriodValues).optional().nullable(),
  currentCTC: z.number().min(0).optional().nullable(),
  expectedCTC: z.number().min(0).optional().nullable(),
  ctcCurrency: z.string().max(10).optional().nullable(),
  workMode: z.enum(workModeValues).optional().nullable(),
  visibility: z.enum(profileVisibilityValues).optional(),
  hideFromCompanies: z.array(z.string()).optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Experience
export const experienceSchema = z.object({
  company: z.string().min(1, "Company is required").max(200),
  designation: z.string().min(1, "Job title is required").max(200),
  employmentType: z.enum(employmentTypeValues),
  location: z.string().max(200).optional().nullable(),
  workMode: z.enum(workModeValues).optional().nullable(),
  startMonth: z.number().min(1).max(12),
  startYear: z.number().int().min(1900).max(2100),
  endMonth: z.number().min(1).max(12).optional().nullable(),
  endYear: z.number().int().min(1900).max(2100).optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(5000).optional().nullable(),
  achievements: z.array(z.string().max(500)).default([]),
});
export type ExperienceInput = z.infer<typeof experienceSchema>;

// Education
export const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required").max(300),
  degree: z.string().max(200).optional().nullable(),
  fieldOfStudy: z.string().max(200).optional().nullable(),
  startYear: z.number().int().min(1900).max(2100).optional().nullable(),
  endYear: z.number().int().min(1900).max(2100).optional().nullable(),
  isCurrent: z.boolean().default(false),
  grade: z.string().max(50).optional().nullable(),
  activities: z.string().max(1000).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});
export type EducationInput = z.infer<typeof educationSchema>;

// Certification
export const certificationSchema = z.object({
  name: z.string().min(1, "Certificate name is required").max(300),
  issuingOrg: z.string().min(1, "Issuing organization is required").max(300),
  issueMonth: z.number().min(1).max(12).optional().nullable(),
  issueYear: z.number().int().min(1900).max(2100).optional().nullable(),
  expiryMonth: z.number().min(1).max(12).optional().nullable(),
  expiryYear: z.number().int().min(1900).max(2100).optional().nullable(),
  doesNotExpire: z.boolean().default(false),
  credentialId: z.string().max(200).optional().nullable(),
  credentialUrl: z.string().url().max(500).optional().nullable(),
});
export type CertificationInput = z.infer<typeof certificationSchema>;

// Project
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(300),
  description: z.string().max(3000).optional().nullable(),
  role: z.string().max(200).optional().nullable(),
  technologies: z.array(z.string().max(100)).default([]),
  projectUrl: z.string().url().max(500).optional().nullable(),
  repoUrl: z.string().url().max(500).optional().nullable(),
  startMonth: z.number().min(1).max(12).optional().nullable(),
  startYear: z.number().int().min(1900).max(2100).optional().nullable(),
  endMonth: z.number().min(1).max(12).optional().nullable(),
  endYear: z.number().int().min(1900).max(2100).optional().nullable(),
  isCurrent: z.boolean().default(false),
  associatedWith: z.string().max(200).optional().nullable(),
});
export type ProjectInput = z.infer<typeof projectSchema>;

// Award
export const awardSchema = z.object({
  title: z.string().min(1, "Award title is required").max(300),
  issuer: z.string().max(200).optional().nullable(),
  month: z.number().min(1).max(12).optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});
export type AwardInput = z.infer<typeof awardSchema>;

// Language
export const profileLanguageSchema = z.object({
  language: z.string().min(1, "Language is required").max(100),
  proficiency: z.enum(languageProficiencyValues),
});
export type ProfileLanguageInput = z.infer<typeof profileLanguageSchema>;

// Volunteer
export const volunteerWorkSchema = z.object({
  organization: z.string().min(1, "Organization is required").max(300),
  role: z.string().min(1, "Role is required").max(200),
  cause: z.string().max(200).optional().nullable(),
  startMonth: z.number().min(1).max(12).optional().nullable(),
  startYear: z.number().int().min(1900).max(2100).optional().nullable(),
  endMonth: z.number().min(1).max(12).optional().nullable(),
  endYear: z.number().int().min(1900).max(2100).optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(2000).optional().nullable(),
});
export type VolunteerWorkInput = z.infer<typeof volunteerWorkSchema>;

// Publication
export const publicationSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  publisher: z.string().max(200).optional().nullable(),
  month: z.number().min(1).max(12).optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  url: z.string().url().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});
export type PublicationInput = z.infer<typeof publicationSchema>;

// Skill (add to profile)
export const addSkillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required").max(100),
  proficiency: z.enum(skillProficiencyValues).default("INTERMEDIATE"),
});
export type AddSkillInput = z.infer<typeof addSkillSchema>;

// Resume (PATCH)
export const resumeUpdateSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  visibility: z.enum(resumeVisibilityValues).optional(),
  isDefault: z.boolean().optional(),
});
export type ResumeUpdateInput = z.infer<typeof resumeUpdateSchema>;

// Open to work
export const openToWorkSchema = z.object({
  openToWork: z.boolean(),
  visibility: z.enum(openToWorkVisibilityValues),
});
export type OpenToWorkInput = z.infer<typeof openToWorkSchema>;

// Privacy
export const privacyUpdateSchema = z.object({
  visibility: z.enum(profileVisibilityValues).optional(),
  hideFromCompanies: z.array(z.string()).optional(),
  defaultResumeVisibility: z.enum(resumeVisibilityValues).optional(),
});
export type PrivacyUpdateInput = z.infer<typeof privacyUpdateSchema>;
