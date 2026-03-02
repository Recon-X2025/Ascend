/**
 * Phase 5A: Extract structured seeker signal from DB for fit scoring.
 * No AI calls — pure data extraction.
 */

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma/client";
import type { SeekerSignal } from "./extractor-types";

const STOP_WORDS = new Set(
  [
    "the", "and", "for", "with", "that", "this", "from", "have", "has", "had",
    "were", "been", "being", "will", "would", "could", "should", "about", "into",
    "through", "during", "before", "after", "above", "below", "between", "under",
    "again", "further", "then", "once", "here", "there", "when", "where", "which",
    "while", "each", "some", "more", "most", "other", "such", "only", "same",
    "than", "too", "very", "just", "also", "both", "using", "used", "using",
  ]
);

/** Recursively collect all string values from a JSON-like object. */
function collectStrings(obj: unknown): string[] {
  const out: string[] = [];
  if (obj == null) return out;
  if (typeof obj === "string") {
    out.push(obj);
    return out;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) out.push(...collectStrings(item));
    return out;
  }
  if (typeof obj === "object") {
    for (const v of Object.values(obj)) out.push(...collectStrings(v));
  }
  return out;
}

/** Tokenise text to words 4+ chars, lowercased, deduped; return top 60 by frequency. */
function tokeniseToTopKeywords(text: string, limit: number = 60): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

/** Infer education level from degree string. */
function degreeToLevel(degree: string | null): string | null {
  if (!degree || !degree.trim()) return null;
  const d = degree.toLowerCase();
  if (/\b(phd|doctorate|dphil)\b/.test(d)) return "phd";
  if (/\b(master|m\.?s\.?|msc|mba|m\.?a\.?|ma|m\.?tech|mtech)\b/.test(d)) return "masters";
  if (/\b(bachelor|b\.?s\.?|bs|be|b\.?tech|btech|b\.?a\.?|ba|b\.?e\.?)\b/.test(d)) return "bachelors";
  if (/\b(diploma|associate)\b/.test(d)) return "diploma";
  if (/\b(high\s*school|secondary|12th|hsc)\b/.test(d)) return "high_school";
  return null;
}

const LEVEL_ORDER: Record<string, number> = {
  high_school: 1,
  diploma: 2,
  bachelors: 3,
  masters: 4,
  phd: 5,
};

/** Numeric level for comparison; higher = more educated. */
function levelNumeric(level: string | null): number {
  return level ? LEVEL_ORDER[level] ?? 0 : 0;
}

/** Months between two year/month pairs; end null = use today. */
function monthsBetween(
  startYear: number,
  startMonth: number,
  endYear: number | null,
  endMonth: number | null,
  isCurrent: boolean
): number {
  const end = isCurrent || endYear == null
    ? { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
    : { year: endYear, month: endMonth ?? 12 };
  return (end.year - startYear) * 12 + (end.month - startMonth);
}

export async function extractSeekerSignal(userId: string): Promise<SeekerSignal> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      jobSeekerProfile: {
        select: {
          id: true,
          experiences: { orderBy: { order: "asc" } },
          educations: { orderBy: { order: "asc" } },
          certifications: true,
          skills: { include: { skill: { select: { name: true } } } },
        },
      },
    },
  });

  const profile = user?.jobSeekerProfile;
  const emptySignal: SeekerSignal = {
    userId,
    skills: [],
    topSkills: [],
    jobTitles: [],
    totalYearsExperience: 0,
    currentRole: null,
    industries: [],
    educationLevel: null,
    educationFields: [],
    certifications: [],
    resumeKeywords: [],
    careerIntent: null,
    profileHash: "",
  };

  if (!profile) {
    emptySignal.profileHash = createHash("sha256")
      .update(JSON.stringify({ skills: [], totalYearsExperience: 0, educationLevel: null, certifications: [] }))
      .digest("hex");
    return emptySignal;
  }

  const skills = profile.skills.map((s) => s.skill.name.trim()).filter(Boolean);
  const topSkills = profile.skills
    .filter((s) => s.proficiency === "EXPERT")
    .map((s) => s.skill.name.trim())
    .filter(Boolean);

  const jobTitles = profile.experiences.map((e) => e.designation.trim()).filter(Boolean);
  let totalMonths = 0;
  for (const e of profile.experiences) {
    totalMonths += monthsBetween(
      e.startYear,
      e.startMonth,
      e.endYear ?? null,
      e.endMonth ?? null,
      e.isCurrent
    );
  }
  const totalYearsExperience = Math.round((totalMonths / 12) * 10) / 10;
  const currentRole = profile.experiences.length > 0
    ? profile.experiences[0].designation
    : null;

  const educationFields = profile.educations
    .map((e) => (e.fieldOfStudy ?? e.degree ?? "").trim())
    .filter(Boolean);
  const levels = profile.educations
    .map((e) => degreeToLevel(e.degree))
    .filter((l): l is string => l != null);
  const highestLevel = levels.length === 0
    ? null
    : levels.reduce((a, b) => (levelNumeric(a) >= levelNumeric(b) ? a : b));

  const certifications = profile.certifications.map((c) => c.name.trim()).filter(Boolean);

  let resumeKeywords: string[] = [];
  const latestResume = await prisma.resumeVersion.findFirst({
    where: { userId },
    orderBy: { lastUpdatedAt: "desc" },
    select: { contentSnapshot: true },
  });
  if (latestResume?.contentSnapshot && typeof latestResume.contentSnapshot === "object") {
    const allText = collectStrings(latestResume.contentSnapshot).join(" ");
    resumeKeywords = tokeniseToTopKeywords(allText, 60);
  }

  let careerIntent: SeekerSignal["careerIntent"] = null;
  const intent = await prisma.careerIntent.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { targetRole: true, targetIndustry: true, targetLevel: true },
  });
  if (intent) {
    const levelMap: Record<string, string> = {
      IC: "MID",
      TEAM_LEAD: "MID",
      MANAGER: "LEAD",
      DIRECTOR: "LEAD",
      VP: "EXECUTIVE",
      C_SUITE: "EXECUTIVE",
    };
    careerIntent = {
      targetRole: intent.targetRole,
      targetIndustry: intent.targetIndustry,
      targetLevel: levelMap[intent.targetLevel] ?? "MID",
    };
  }

  const profileHash = createHash("sha256")
    .update(
      JSON.stringify({
        skills,
        totalYearsExperience,
        educationLevel: highestLevel,
        certifications,
      })
    )
    .digest("hex");

  return {
    userId,
    skills,
    topSkills,
    jobTitles,
    totalYearsExperience,
    currentRole,
    industries: [],
    educationLevel: highestLevel,
    educationFields,
    certifications,
    resumeKeywords,
    careerIntent,
    profileHash,
  };
}
