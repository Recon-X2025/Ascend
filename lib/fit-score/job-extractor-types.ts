/**
 * Phase 5A: Job signal type for fit scoring.
 */

export interface JobSignal {
  jobPostId: string;
  title: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  parsedSkills: {
    mustHave: string[];
    niceToHave: string[];
  } | null;
  keywords: string[];
  experienceMin: number | null;
  experienceMax: number | null;
  educationLevel: string | null;
  jobTitle: string;
  seniority: string | null;
}
