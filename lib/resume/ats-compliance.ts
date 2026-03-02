/**
 * ATS Compliance Engine — rule-based checks for resume parseability.
 * Synchronous, no AI. Used by POST /api/resume/ats-score.
 *
 * Score breakdown: Format & Parsability 30 | Keyword 25 | Completeness 25 | Impact 20 = 100.
 */

/** Minimal shape of content snapshot for compliance checks (matches store ContentSnapshot). */
export interface ContentSnapshotForATS {
  status?: string;
  experiences?: Record<string, { rewrittenBullets?: string[]; actionVerbs?: string[] }>;
  summaries?: string[];
  selectedSummaryIndex?: number;
  skills?: {
    core?: string[];
    technical?: string[];
    soft?: string[];
    tools?: string[];
    hidden?: string[];
  };
}

export interface ATSComplianceIssue {
  rule: string;
  severity: "error" | "warning";
  suggestion: string;
}

export interface ATSComplianceResult {
  score: number;
  issues: ATSComplianceIssue[];
  /** Per-category scores (0–100 scale for each). */
  categoryScores: {
    format: number;
    keyword: number;
    completeness: number;
    impact: number;
  };
}

/** Contact block for rule 3 (plain text at top). */
export interface ContactContext {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
}

/** Optional context for checks that need profile/export data. */
export interface ATSComplianceContext {
  contact?: ContactContext;
  /** Date strings to validate (e.g. "January 2020 – March 2023"). */
  dateStrings?: string[];
  /** Template font if known (must be Arial, Calibri, or Times New Roman). */
  templateFont?: string | null;
}

const STANDARD_SECTION_KEYS = new Set([
  "experiences",
  "education",
  "skills",
  "certifications",
  "projects",
  "summary",
  "summaries",
  "selectedSummaryIndex",
  "status",
  "missingSkillNames",
]);

/** Month Year – Month Year or "Present" */
const DATE_RANGE_REGEX =
  /^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s*[–\-]\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s*[–\-]\s*Present$/i;

const ALLOWED_FONTS = new Set(["arial", "calibri", "times new roman"]);

function addIssue(
  issues: ATSComplianceIssue[],
  rule: string,
  severity: "error" | "warning",
  suggestion: string
): void {
  issues.push({ rule, severity, suggestion });
}

/** Format & Parsability: 30 pts — rules 1–6. */
function checkFormatCategory(
  snapshot: ContentSnapshotForATS,
  context: ATSComplianceContext | undefined,
  issues: ATSComplianceIssue[]
): number {
  let score = 30;

  const keys = Object.keys(snapshot);
  const badKeys = keys.filter((k) => !STANDARD_SECTION_KEYS.has(k));
  if (badKeys.length > 0) {
    addIssue(issues, "format_parsability", "warning", "Use only standard section keys. Non-standard keys may affect parsing.");
    score -= 3;
  }
  for (const v of Object.values(snapshot)) {
    if (typeof v === "string" && (v.includes("<table") || v.includes("<div") || v.includes("text-box"))) {
      addIssue(issues, "format_parsability", "error", "No tables, columns, or text boxes in resume content.");
      score -= 15;
      break;
    }
  }

  const font = context?.templateFont?.trim().toLowerCase();
  if (font && !ALLOWED_FONTS.has(font)) {
    addIssue(issues, "font_safety", "error", "Use only Arial, Calibri, or Times New Roman.");
    score -= 5;
  }

  const c = context?.contact;
  if (c) {
    if (!c.name?.trim()) {
      addIssue(issues, "contact_block", "error", "Include your name in plain text at the top.");
      score -= 2;
    }
    if (!c.email?.trim()) {
      addIssue(issues, "contact_block", "error", "Include your email in plain text at the top.");
      score -= 2;
    }
    if (!c.location?.trim()) addIssue(issues, "contact_block", "warning", "Include location for better ATS matching.");
    if (!c.phone?.trim()) addIssue(issues, "contact_block", "warning", "Phone in plain text is recommended.");
  }

  const nonStandard = keys.filter((k) => !STANDARD_SECTION_KEYS.has(k));
  if (nonStandard.length > 0) {
    addIssue(issues, "section_headings", "warning", "Use standard headings only: Experience, Education, Skills, Certifications, Projects, Summary.");
    score -= 2;
  }

  const dateStrings = context?.dateStrings ?? [];
  for (const d of dateStrings) {
    if (!DATE_RANGE_REGEX.test(String(d).trim())) {
      addIssue(issues, "date_format", "warning", "Use \"Month Year – Month Year\" or \"Month Year – Present\".");
      score -= 1;
      break;
    }
  }

  const experiences = snapshot.experiences ?? {};
  for (const exp of Object.values(experiences)) {
    const bullets = exp?.rewrittenBullets ?? [];
    for (const b of bullets) {
      if (typeof b !== "string") continue;
      if (/[\u2022\u2023\u2043\u2219\u25aa\u25cf\u25e6]/.test(b) && !/^[\s\-–•*]/.test(b.trim())) {
        addIssue(issues, "bullets", "warning", "Use plain hyphens or bullet (•) only. No custom glyphs.");
        score -= 2;
        break;
      }
    }
  }

  return Math.max(0, score);
}

/** Completeness: key sections present and filled (25 pts). */
function checkCompleteness(snapshot: ContentSnapshotForATS, issues: ATSComplianceIssue[]): number {
  let score = 25;
  const hasExperience = snapshot.experiences && Object.keys(snapshot.experiences).length > 0;
  const hasSummary = (snapshot.summaries?.length ?? 0) > 0 || snapshot.selectedSummaryIndex !== undefined;
  const hasSkills =
    snapshot.skills &&
    (snapshot.skills.core?.length ||
      snapshot.skills.technical?.length ||
      snapshot.skills.soft?.length ||
      snapshot.skills.tools?.length);

  if (!hasExperience) {
    addIssue(issues, "completeness", "error", "Experience section is required.");
    score -= 8;
  }
  if (!hasSummary) {
    addIssue(issues, "completeness", "warning", "A professional summary improves ATS match.");
    score -= 5;
  }
  if (!hasSkills) {
    addIssue(issues, "completeness", "warning", "Skills section is recommended.");
    score -= 4;
  }

  if (hasExperience && snapshot.experiences) {
    let anyEmpty = false;
    for (const exp of Object.values(snapshot.experiences)) {
      const bullets = exp?.rewrittenBullets ?? [];
      if (bullets.length === 0) anyEmpty = true;
    }
    if (anyEmpty) {
      addIssue(issues, "completeness", "warning", "Ensure each experience has at least one bullet.");
      score -= 3;
    }
  }
  return Math.max(0, score);
}

/** Impact: action verbs + metrics vs passive/responsibility language (20 pts). */
function checkImpact(snapshot: ContentSnapshotForATS, issues: ATSComplianceIssue[]): number {
  const experiences = snapshot.experiences ?? {};
  let totalBullets = 0;
  let withActionVerb = 0;
  let withMetric = 0;
  const metricPattern = /\d+%|\d+x|\$\d|€\d|\d+\+|\d+\.\d+|\d{1,3}(,\d{3})*(\.\d+)?/;

  for (const exp of Object.values(experiences)) {
    const bullets = exp?.rewrittenBullets ?? [];
    const verbs = new Set((exp?.actionVerbs ?? []).map((v) => v.toLowerCase()));
    for (const b of bullets) {
      if (typeof b !== "string" || !b.trim()) continue;
      totalBullets++;
      const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/, "") ?? "";
      if (verbs.has(firstWord) || /^(led|managed|built|increased|delivered|achieved|developed|drove|implemented|launched|reduced|improved|created|established|executed|owned|scaled|optimized|grew)/i.test(firstWord)) {
        withActionVerb++;
      }
      if (metricPattern.test(b)) withMetric++;
    }
  }

  if (totalBullets === 0) return 0;
  const actionRatio = withActionVerb / totalBullets;
  const metricRatio = withMetric / totalBullets;
  let score = 20;
  if (actionRatio < 0.5) {
    addIssue(issues, "impact", "warning", "Start more bullets with action verbs (Led, Delivered, Increased, etc.).");
    score -= 5;
  }
  if (metricRatio < 0.3) {
    addIssue(issues, "impact", "warning", "Add numbers and metrics where possible (%, $, growth, scale).");
    score -= 5;
  }
  return Math.max(0, score);
}

/**
 * Keyword match score (25 pts). Computed separately in 2A.7; stub here.
 */
export function getKeywordScore(): number {
  return 25;
}

/**
 * Run full ATS compliance check on content snapshot.
 * Returns score 0–100 and list of issues.
 */
export function checkATSCompliance(
  contentSnapshot: ContentSnapshotForATS,
  context?: ATSComplianceContext
): ATSComplianceResult {
  const issues: ATSComplianceIssue[] = [];

  const formatScore = checkFormatCategory(contentSnapshot, context, issues);
  const keywordScore = 25;
  const completenessScore = checkCompleteness(contentSnapshot, issues);
  const impactScore = checkImpact(contentSnapshot, issues);
  const score = formatScore + keywordScore + completenessScore + impactScore;

  return {
    score: Math.min(100, Math.max(0, score)),
    issues,
    categoryScores: {
      format: formatScore,
      keyword: keywordScore,
      completeness: completenessScore,
      impact: impactScore,
    },
  };
}

/**
 * Full ATS result (for API). Optionally pass keyword score from 2A.7.
 */
export function getFullATSResult(
  contentSnapshot: ContentSnapshotForATS,
  context?: ATSComplianceContext,
  keywordScoreOverride?: number
): ATSComplianceResult {
  const result = checkATSCompliance(contentSnapshot, context);
  const keywordScore = keywordScoreOverride ?? result.categoryScores.keyword;
  const score =
    result.categoryScores.format +
    keywordScore +
    result.categoryScores.completeness +
    result.categoryScores.impact;
  return {
    score: Math.min(100, Math.max(0, score)),
    issues: result.issues,
    categoryScores: {
      format: result.categoryScores.format,
      keyword: keywordScore,
      completeness: result.categoryScores.completeness,
      impact: result.categoryScores.impact,
    },
  };
}
