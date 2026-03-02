/**
 * Shared types for resume templates. ATS-safe: single column, no tables, standard fonts only.
 */

import type { ContentSnapshot, ExperienceContent, ResumeSkills } from "@/store/resume-build";

export type TargetLevel = "IC" | "TEAM_LEAD" | "MANAGER" | "DIRECTOR" | "VP" | "C_SUITE";

export interface CareerIntentForTemplate {
  targetRole: string;
  targetIndustry: string;
  targetLevel: TargetLevel;
}

export interface ContactForTemplate {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
}

export interface TemplateProps {
  contentSnapshot: ContentSnapshot;
  careerIntent: CareerIntentForTemplate;
  contact?: ContactForTemplate;
}

export type { ContentSnapshot, ExperienceContent, ResumeSkills };

/** Section keys for ordering. */
export type SectionKey =
  | "summary"
  | "education"
  | "experience"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "board";

const ENTRY_LEVEL_ORDER: SectionKey[] = ["summary", "education", "experience", "skills", "projects", "certifications"];
const SENIOR_ORDER: SectionKey[] = ["summary", "experience", "skills", "education", "certifications"];
const TECH_ORDER: SectionKey[] = ["summary", "skills", "experience", "projects", "education"];
const EXECUTIVE_ORDER: SectionKey[] = ["summary", "experience", "achievements", "education", "board"];

export const TEMPLATE_IDS = [
  "classic",
  "modern",
  "executive",
  "tech",
  "creative-professional",
  "international",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/** Get section order for a template and level. */
export function getSectionOrder(templateId: TemplateId, targetLevel: TargetLevel): SectionKey[] {
  const isEntry = targetLevel === "IC";
  const isExecutive = targetLevel === "DIRECTOR" || targetLevel === "VP" || targetLevel === "C_SUITE";
  if (templateId === "executive" || isExecutive) return EXECUTIVE_ORDER;
  if (templateId === "tech") return TECH_ORDER;
  if (isEntry) return ENTRY_LEVEL_ORDER;
  return SENIOR_ORDER;
}

/** Recommended template(s) for target level (for "Recommended for your level" badge). */
export function getRecommendedTemplateIds(targetLevel: TargetLevel): TemplateId[] {
  if (targetLevel === "IC") return ["classic", "modern"];
  if (targetLevel === "TEAM_LEAD" || targetLevel === "MANAGER") return ["modern", "executive"];
  if (targetLevel === "DIRECTOR" || targetLevel === "VP" || targetLevel === "C_SUITE") return ["executive", "international"];
  return ["classic"];
}
