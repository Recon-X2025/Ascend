/**
 * Keyword optimisation — rule-based analysis (no AI).
 * Surfaces present/missing keywords and coverage score for ATS.
 */

import {
  getKeywordsForRole,
  getAllKeywordsForRole,
  type RoleKeywords,
} from "@/lib/data/keywords-by-role-api";

/** Minimal content snapshot shape for keyword extraction. */
export interface ContentSnapshotForKeywords {
  experiences?: Record<string, { rewrittenBullets?: string[]; company?: string; designation?: string }>;
  summaries?: string[];
  selectedSummaryIndex?: number;
  skills?: {
    core?: string[];
    technical?: string[];
    soft?: string[];
    tools?: string[];
  };
}

export interface MissingKeywordSuggestion {
  keyword: string;
  suggestion: string;
}

export interface KeywordAnalysis {
  present: string[];
  missing: string[];
  coverageScore: number;
  missingWithSuggestions: MissingKeywordSuggestion[];
  totalKeywords: number;
}

/** Simple stem: lowercase, strip trailing -ing, -ed, -s, -ly for fuzzy match. */
function stem(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.length <= 2) return w;
  if (w.endsWith("ing") && w.length > 4) return w.slice(0, -3);
  if (w.endsWith("ed") && w.length > 3) return w.slice(0, -2);
  if (w.endsWith("ly") && w.length > 3) return w.slice(0, -2);
  if (w.endsWith("s") && w.length > 2 && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

/** Check if keyword appears in text (word or stem match). */
function keywordInText(keyword: string, text: string): boolean {
  const textLower = text.toLowerCase();
  if (textLower.includes(keyword.toLowerCase())) return true;
  const words = textLower.split(/\s+/).map(stem);
  const keywordWords = keyword.toLowerCase().split(/\s+/);
  for (const kw of keywordWords) {
    const kwStem = stem(kw);
    if (words.some((w) => w.includes(kwStem) || kwStem.includes(w))) return true;
  }
  return false;
}

/** Extract all resume text from snapshot for matching. */
function extractResumeText(snapshot: ContentSnapshotForKeywords): string {
  const parts: string[] = [];
  const idx = snapshot.selectedSummaryIndex ?? 0;
  const summaries = snapshot.summaries ?? [];
  if (summaries[idx]) parts.push(summaries[idx]);
  const experiences = snapshot.experiences ?? {};
  for (const exp of Object.values(experiences)) {
    for (const b of exp?.rewrittenBullets ?? []) {
      if (typeof b === "string") parts.push(b);
    }
  }
  const skills = snapshot.skills ?? {};
  for (const arr of [skills.core, skills.technical, skills.soft, skills.tools]) {
    for (const s of arr ?? []) parts.push(s);
  }
  return parts.join(" ");
}

/** Build integration suggestion for a missing keyword (templated). */
function suggestionForMissing(
  keyword: string,
  category: keyof RoleKeywords,
  firstCompany?: string
): string {
  if (category === "actionVerbs") {
    return firstCompany
      ? `Add '${keyword}' to your Experience at ${firstCompany}`
      : `Add '${keyword}' to your Experience bullets`;
  }
  if (category === "softSkills") {
    return `Add '${keyword}' to your Summary or Skills`;
  }
  return firstCompany
    ? `Add '${keyword}' to your Skills or Experience at ${firstCompany}`
    : `Add '${keyword}' to your Skills`;
}

/**
 * Analyze keywords: present, missing, coverage score, top 5 missing with suggestions.
 */
export function analyzeKeywords(
  contentSnapshot: ContentSnapshotForKeywords,
  targetRole: string
): KeywordAnalysis {
  const kw = getKeywordsForRole(targetRole);
  const allKeywords = kw ? getAllKeywordsForRole(kw) : [];
  const text = extractResumeText(contentSnapshot);

  const present: string[] = [];
  const missing: string[] = [];
  for (const k of allKeywords) {
    if (keywordInText(k, text)) present.push(k);
    else missing.push(k);
  }

  const totalKeywords = allKeywords.length;
  const coverageScore = totalKeywords > 0 ? Math.round((present.length / totalKeywords) * 100) : 100;

  const firstCompany = contentSnapshot.experiences
    ? Object.values(contentSnapshot.experiences)[0]?.company
    : undefined;

  const categories: (keyof RoleKeywords)[] = ["mustHave", "industryTerms", "actionVerbs", "softSkills"];
  const missingWithSuggestions: MissingKeywordSuggestion[] = [];
  const added = new Set<string>();
  for (const cat of categories) {
    if (!kw) break;
    const list = kw[cat] ?? [];
    for (const k of list) {
      if (missing.includes(k) && !added.has(k) && missingWithSuggestions.length < 5) {
        missingWithSuggestions.push({
          keyword: k,
          suggestion: suggestionForMissing(k, cat, firstCompany),
        });
        added.add(k);
      }
    }
  }
  for (const k of missing) {
    if (missingWithSuggestions.length >= 5) break;
    if (!added.has(k)) {
      missingWithSuggestions.push({
        keyword: k,
        suggestion: suggestionForMissing(k, "mustHave", firstCompany),
      });
      added.add(k);
    }
  }

  return {
    present,
    missing,
    coverageScore,
    missingWithSuggestions,
    totalKeywords,
  };
}

/**
 * Keyword match score 0–25 for ATS (coverageScore/100 * 25).
 */
export function getKeywordScoreFromAnalysis(analysis: KeywordAnalysis): number {
  return Math.round((analysis.coverageScore / 100) * 25);
}
