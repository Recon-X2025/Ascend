import type { JobSeekerProfile, Experience, Education, Certification, Project, Award, ProfileLanguage, VolunteerWork, Publication, UserSkill, Resume } from "@prisma/client";

export type FullProfile = JobSeekerProfile & {
  experiences: Experience[];
  educations: Education[];
  certifications: Certification[];
  projects: Project[];
  awards: Award[];
  languages: ProfileLanguage[];
  volunteerWork: VolunteerWork[];
  publications: Publication[];
  skills: (UserSkill & { skill: { name: string } })[];
  resumes: Resume[];
};

export interface CompletionBreakdown {
  personalInfo: number;
  experience: number;
  education: number;
  skills: number;
  resume: number;
  preferences: number;
  extras: number;
}

export interface CompletionResult {
  total: number;
  breakdown: CompletionBreakdown;
  missing: string[];
  nextStep: string;
}

const WEIGHTS = {
  personalInfo: 20,
  experience: 25,
  education: 10,
  skills: 15,
  resume: 15,
  preferences: 10,
  extras: 5,
} as const;

export function calculateCompletionScore(profile: FullProfile): CompletionResult {
  const missing: string[] = [];
  const breakdown: CompletionBreakdown = {
    personalInfo: 0,
    experience: 0,
    education: 0,
    skills: 0,
    resume: 0,
    preferences: 0,
    extras: 0,
  };

  // Personal info: 5 pts each for headline, summary, location (city+country = 1), avatarUrl. Max 20.
  if (profile.headline?.trim()) {
    breakdown.personalInfo += 5;
  } else {
    missing.push("Add a headline");
  }
  if (profile.summary?.trim()) {
    breakdown.personalInfo += 5;
  } else {
    missing.push("Write a short summary / About");
  }
  const hasLocation = !!(profile.city?.trim() || profile.country?.trim());
  if (hasLocation) {
    breakdown.personalInfo += 5;
  } else {
    missing.push("Add your location (city and country)");
  }
  if (profile.avatarUrl?.trim()) {
    breakdown.personalInfo += 5;
  } else {
    missing.push("Upload a profile photo");
  }
  breakdown.personalInfo = Math.min(breakdown.personalInfo, WEIGHTS.personalInfo);

  // Experience: 25 if at least 1; 0 otherwise
  if (profile.experiences.length >= 1) {
    breakdown.experience = WEIGHTS.experience;
  } else {
    missing.push("Add at least one work experience");
  }

  // Education: 10 if at least 1; 0 otherwise
  if (profile.educations.length >= 1) {
    breakdown.education = WEIGHTS.education;
  } else {
    missing.push("Add your education");
  }

  // Skills: 5 per skill, max 15 (3 skills)
  const skillPts = Math.min(profile.skills.length * 5, WEIGHTS.skills);
  breakdown.skills = skillPts;
  if (profile.skills.length < 3) {
    missing.push("Add at least 3 skills");
  }

  // Resume: 15 if at least 1; 0 otherwise
  if (profile.resumes.length >= 1) {
    breakdown.resume = WEIGHTS.resume;
  } else {
    missing.push("Upload at least one resume");
  }

  // Preferences: noticePeriod(3) + workMode(3) + currentCTC(2) + expectedCTC(2) = 10
  if (profile.noticePeriod != null) breakdown.preferences += 3;
  else missing.push("Set your notice period");
  if (profile.workMode != null) breakdown.preferences += 3;
  else missing.push("Set preferred work mode");
  if (profile.currentCTC != null && profile.currentCTC > 0) breakdown.preferences += 2;
  if (profile.expectedCTC != null && profile.expectedCTC > 0) breakdown.preferences += 2;
  breakdown.preferences = Math.min(breakdown.preferences, WEIGHTS.preferences);

  // Extras: 1 pt each for any of certifications, projects, awards, languages, volunteerWork, publications (max 5)
  let extrasCount = 0;
  if (profile.certifications.length > 0) extrasCount++;
  if (profile.projects.length > 0) extrasCount++;
  if (profile.awards.length > 0) extrasCount++;
  if (profile.languages.length > 0) extrasCount++;
  if (profile.volunteerWork.length > 0) extrasCount++;
  if (profile.publications.length > 0) extrasCount++;
  breakdown.extras = Math.min(extrasCount, WEIGHTS.extras);

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // Single most impactful next step: first missing item
  const nextStep =
    missing.length > 0
      ? missing[0]
      : "Your profile is complete. Keep it updated!";

  return {
    total: Math.min(100, total),
    breakdown,
    missing,
    nextStep,
  };
}
