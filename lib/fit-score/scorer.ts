/**
 * Phase 5A: Pure fit score computation. No DB, no AI.
 */

import type { SeekerSignal } from "./extractor-types";
import type { JobSignal } from "./job-extractor-types";
import type { FitGapItem } from "./types";

function dedupLower(arr: string[]): string[] {
  return Array.from(new Set(arr.map((s) => s.trim().toLowerCase()).filter(Boolean)));
}

export interface FitScoreResult {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  keywordsScore: number;
  skillGaps: FitGapItem[];
  experienceGaps: FitGapItem[];
  keywordGaps: FitGapItem[];
  strengths: string[];
}

function hasSkill(seekerSkills: string[], skill: string): boolean {
  const lower = skill.toLowerCase();
  return seekerSkills.some((s) => s.toLowerCase() === lower);
}

function wordOverlap(a: string, b: string): boolean {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 1));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 1));
  for (const w of Array.from(setA)) if (setB.has(w)) return true;
  return false;
}

const EDU_LEVEL_ORDER: Record<string, number> = {
  none: 0,
  high_school: 1,
  diploma: 2,
  bachelors: 3,
  masters: 4,
  phd: 5,
};

function educationNumeric(level: string | null): number {
  return level ? EDU_LEVEL_ORDER[level] ?? 0 : 0;
}

export function computeFitScore(seeker: SeekerSignal, job: JobSignal): FitScoreResult {
  // —— Skills (weight 40%) ——
  const totalMust = job.mustHaveSkills.length;
  const totalNice = job.niceToHaveSkills.length;
  const matchedMust = job.mustHaveSkills.filter((s) => hasSkill(seeker.skills, s)).length;
  const matchedNice = job.niceToHaveSkills.filter((s) => hasSkill(seeker.skills, s)).length;
  const mustHaveMatch = totalMust > 0 ? matchedMust / totalMust : 1;
  const niceToHaveMatch = totalNice > 0 ? matchedNice / totalNice : 1;
  const skillsScore = Math.round((mustHaveMatch * 0.8 + niceToHaveMatch * 0.2) * 100);

  const skillGaps: FitGapItem[] = [];
  for (const s of job.mustHaveSkills) {
    if (!hasSkill(seeker.skills, s))
      skillGaps.push({
        item: s,
        importance: "critical",
        suggestion: `Add ${s} to your skills and gain experience with it.`,
      });
  }
  for (const s of job.niceToHaveSkills) {
    if (skillGaps.length >= 5) break;
    if (!hasSkill(seeker.skills, s))
      skillGaps.push({
        item: s,
        importance: "important",
        suggestion: `Consider adding ${s} to strengthen your profile.`,
      });
  }
  skillGaps.splice(5);

  // —— Experience (weight 30%) ——
  let experienceScore = 85;
  const experienceGaps: FitGapItem[] = [];
  if (job.experienceMin != null) {
    const min = job.experienceMin;
    const max = job.experienceMax;
    const years = seeker.totalYearsExperience;
    if (years >= min && (max == null || years <= max + 2)) experienceScore = 100;
    else if (years >= min * 0.75) experienceScore = 75;
    else if (years >= min * 0.5) experienceScore = 50;
    else experienceScore = 20;

    if (years < min) {
      experienceGaps.push({
        item: `${min} years of experience required`,
        importance: "critical",
        suggestion: `The role requires at least ${min} years of experience; you have ${years.toFixed(1)} years. Gain more relevant experience or highlight transferable achievements.`,
      });
    }
  }
  const relevantTitleMatch = seeker.jobTitles.some((t) => wordOverlap(t, job.jobTitle));
  if (relevantTitleMatch) experienceScore = Math.min(100, experienceScore + 10);

  // —— Education (weight 10%) ——
  let educationScore = 90;
  const jobEduLevel = educationNumeric(job.educationLevel);
  if (jobEduLevel > 0) {
    const seekerLevel = educationNumeric(seeker.educationLevel);
    if (seekerLevel >= jobEduLevel) educationScore = 100;
    else if (seekerLevel === jobEduLevel - 1) educationScore = 65;
    else educationScore = 30;

    if (seekerLevel < jobEduLevel) {
      const required = job.educationLevel ?? "higher education";
      experienceGaps.push({
        item: `Education: ${required} preferred or required`,
        importance: "important",
        suggestion: `This role typically requires ${required}. Consider upskilling or highlighting equivalent experience.`,
      });
    }
  }

  // —— Keywords (weight 20%) ——
  const jobKeywords = dedupLower([...job.keywords, ...job.mustHaveSkills]);
  const seekerKeywords = new Set([
    ...seeker.resumeKeywords.map((k) => k.toLowerCase()),
    ...seeker.skills.map((s) => s.toLowerCase()),
  ]);
  const intersection = jobKeywords.filter((k) => seekerKeywords.has(k.toLowerCase()));
  const keywordsMatch = jobKeywords.length > 0 ? intersection.length / jobKeywords.length : 0;
  const keywordsScore =
    jobKeywords.length === 0 ? 70 : Math.min(100, Math.round(keywordsMatch * 100 * 1.2));

  const keywordGaps: FitGapItem[] = [];
  const unmatched = jobKeywords.filter((k) => !seekerKeywords.has(k.toLowerCase()));
  for (let i = 0; i < Math.min(5, unmatched.length); i++) {
    const kw = unmatched[i];
    keywordGaps.push({
      item: kw,
      importance: "minor",
      suggestion: `Add '${kw}' to your resume or skills section to improve match.`,
    });
  }

  // —— Overall ——
  const overallScore = Math.round(
    skillsScore * 0.4 + experienceScore * 0.3 + educationScore * 0.1 + keywordsScore * 0.2
  );

  // —— Strengths (cap 5) ——
  const strengths: string[] = [];
  for (const s of job.mustHaveSkills) {
    if (hasSkill(seeker.skills, s)) strengths.push(s);
  }
  if (experienceScore >= 75 && seeker.totalYearsExperience > 0) {
    strengths.push(`${seeker.totalYearsExperience.toFixed(1)} years of relevant experience`);
  }
  const matchingTitles = seeker.jobTitles.filter((t) => wordOverlap(t, job.jobTitle));
  for (const t of matchingTitles) {
    if (strengths.length >= 5) break;
    if (!strengths.includes(t)) strengths.push(t);
  }
  strengths.splice(5);

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    skillsScore,
    experienceScore,
    educationScore,
    keywordsScore,
    skillGaps,
    experienceGaps,
    keywordGaps,
    strengths,
  };
}
