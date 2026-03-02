/**
 * Phase 5A: Types for seeker and job signal extraction.
 */

export interface SeekerSignal {
  userId: string;
  skills: string[];
  topSkills: string[];
  jobTitles: string[];
  totalYearsExperience: number;
  currentRole: string | null;
  industries: string[];
  educationLevel: string | null; // "high_school" | "diploma" | "bachelors" | "masters" | "phd"
  educationFields: string[];
  certifications: string[];
  resumeKeywords: string[];
  careerIntent: {
    targetRole: string | null;
    targetIndustry: string | null;
    targetLevel: string | null; // JUNIOR | MID | SENIOR | LEAD | EXECUTIVE
  } | null;
  profileHash: string;
}
