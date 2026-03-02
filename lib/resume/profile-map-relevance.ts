/**
 * Rule-based relevance scoring for profile items against a career intent.
 * Used by GET /api/resume/profile-map (no AI calls).
 */

const CURRENT_YEAR = new Date().getFullYear();

/** Normalize for keyword match: lowercase, collapse spaces. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenize into words (alphanumeric + allowed chars). */
function tokenize(s: string): string[] {
  return norm(s)
    .split(/\s+/)
    .filter(Boolean);
}

/** Overlap ratio: share of target words that appear in source. */
function wordOverlap(target: string, source: string): number {
  const tWords = new Set(tokenize(target));
  const sWords = new Set(tokenize(source));
  if (tWords.size === 0) return 0;
  const tArr = Array.from(tWords);
  let match = 0;
  for (const w of tArr) {
    if (sWords.has(w)) match++;
    else if (w.length > 2 && Array.from(sWords).some((sw) => sw.includes(w) || w.includes(sw))) match++;
  }
  return match / tArr.length;
}

/** Role titles that are "adjacent" to the target for skill scoring (simplified taxonomy). */
const ADJACENT_ROLE_KEYWORDS: Record<string, string[]> = {
  product: ["product", "pm", "roadmap", "agile", "stakeholder", "ux", "design", "analytics", "growth"],
  engineer: ["engineer", "developer", "software", "coding", "programming", "backend", "frontend", "fullstack", "devops", "sre", "api"],
  design: ["design", "ux", "ui", "figma", "prototype", "user", "research"],
  data: ["data", "analytics", "sql", "python", "machine", "learning", "ml", "statistics"],
  manager: ["manager", "lead", "team", "project", "program", "scrum", "agile"],
  marketing: ["marketing", "growth", "content", "seo", "campaign"],
  sales: ["sales", "account", "customer", "revenue", "crm"],
};

function getRoleKeywordGroups(targetRole: string): { exact: string[]; adjacent: string[] } {
  const words = tokenize(targetRole);
  const exact: string[] = [];
  const adjacentSet = new Set<string>();
  for (const w of words) {
    if (w.length > 1) exact.push(w);
    for (const [key, list] of Object.entries(ADJACENT_ROLE_KEYWORDS)) {
      if (w.includes(key) || key.includes(w)) list.forEach((k) => adjacentSet.add(k));
    }
  }
  return { exact: Array.from(new Set(exact)), adjacent: Array.from(adjacentSet) };
}

export interface ScoredSkill {
  id: string;
  skillId: string;
  name: string;
  proficiency: string;
  order: number;
  relevanceScore: number;
  suggested: boolean;
}

export function scoreSkills(
  userSkills: { id: string; skillId: string; skill: { name: string } | null; proficiency: string; order: number }[],
  targetRole: string
): ScoredSkill[] {
  const { exact, adjacent } = getRoleKeywordGroups(targetRole);
  const exactSet = new Set(exact.map((w) => w.toLowerCase()));
  const adjacentSet = new Set(adjacent.map((w) => w.toLowerCase()));

  return userSkills.map((us) => {
    const name = us.skill?.name ?? "";
    const nameNorm = norm(name);
    const nameWords = new Set(tokenize(name));
    let relevanceScore = 0.2;
    if (nameNorm && exactSet.size > 0) {
      const hasExact = Array.from(exactSet).some((e) => nameNorm.includes(e) || nameNorm.split(/\s+/).some((nw) => nw.includes(e)));
      const hasAdjacent = Array.from(adjacentSet).some((a) => nameNorm.includes(a) || Array.from(nameWords).some((nw) => nw.includes(a) || a.includes(nw)));
      if (hasExact) relevanceScore = 1.0;
      else if (hasAdjacent) relevanceScore = 0.6;
    }
    const suggested = relevanceScore >= 0.6;
    return {
      id: us.id,
      skillId: us.skillId,
      name,
      proficiency: us.proficiency,
      order: us.order,
      relevanceScore,
      suggested,
    };
  });
}

export interface ScoredExperience {
  id: string;
  company: string;
  designation: string;
  startYear: number;
  endYear: number | null;
  isCurrent: boolean;
  order: number;
  relevanceScore: number;
  suggested: boolean;
  condenseTip?: boolean;
}

export function scoreExperiences(
  experiences: { id: string; company: string; designation: string; startYear: number; endYear: number | null; isCurrent: boolean; order: number }[],
  targetRole: string
): ScoredExperience[] {
  const overlapWithRole = (designation: string) => wordOverlap(targetRole, designation);
  const sorted = [...experiences].sort((a, b) => {
    const aEnd = a.isCurrent ? CURRENT_YEAR : (a.endYear ?? a.startYear);
    const bEnd = b.isCurrent ? CURRENT_YEAR : (b.endYear ?? b.startYear);
    return bEnd - aEnd;
  });
  return sorted.map((exp, index) => {
    const roleBoost = overlapWithRole(exp.designation);
    const recencyWeight = 0.5 + 0.5 * (1 - index / Math.max(sorted.length, 1));
    const endYear = exp.isCurrent ? CURRENT_YEAR : (exp.endYear ?? exp.startYear);
    const yearsAgo = CURRENT_YEAR - endYear;
    const relevanceScore = Math.min(1, 0.3 + recencyWeight * 0.4 + roleBoost * 0.4);
    const suggested = relevanceScore >= 0.5 || index < 2;
    const oldExperience = yearsAgo > 10;
    const condenseTip = oldExperience && relevanceScore < 0.5;
    return {
      id: exp.id,
      company: exp.company,
      designation: exp.designation,
      startYear: exp.startYear,
      endYear: exp.endYear,
      isCurrent: exp.isCurrent,
      order: exp.order,
      relevanceScore,
      suggested,
      condenseTip,
    };
  });
}

export interface ScoredEducation {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  endYear: number | null;
  isCurrent: boolean;
  order: number;
  relevanceScore: number;
  suggested: boolean;
}

export function scoreEducations(
  educations: { id: string; institution: string; degree: string | null; fieldOfStudy: string | null; endYear: number | null; isCurrent: boolean; order: number }[],
  targetRole: string
): ScoredEducation[] {
  const sorted = [...educations].sort((a, b) => {
    const aY = a.endYear ?? (a.isCurrent ? CURRENT_YEAR : 0);
    const bY = b.endYear ?? (b.isCurrent ? CURRENT_YEAR : 0);
    return bY - aY;
  });
  return sorted.map((ed, index) => {
    const roleOverlap = wordOverlap(targetRole, [ed.degree, ed.fieldOfStudy].filter(Boolean).join(" "));
    const recency = index === 0 ? 1 : Math.max(0.3, 1 - index * 0.2);
    const relevanceScore = Math.min(1, 0.4 + recency * 0.3 + roleOverlap * 0.4);
    const suggested = relevanceScore >= 0.5 || index < 2;
    return {
      id: ed.id,
      institution: ed.institution,
      degree: ed.degree,
      fieldOfStudy: ed.fieldOfStudy,
      endYear: ed.endYear,
      isCurrent: ed.isCurrent,
      order: ed.order,
      relevanceScore,
      suggested,
    };
  });
}

export interface ScoredCertification {
  id: string;
  name: string;
  issuingOrg: string;
  issueYear: number | null;
  order: number;
  relevanceScore: number;
  suggested: boolean;
}

export function scoreCertifications(
  certifications: { id: string; name: string; issuingOrg: string; issueYear: number | null; order: number }[],
  targetRole: string
): ScoredCertification[] {
  const sorted = [...certifications].sort((a, b) => (b.issueYear ?? 0) - (a.issueYear ?? 0));
  return sorted.map((c, index) => {
    const roleOverlap = wordOverlap(targetRole, `${c.name} ${c.issuingOrg}`);
    const recency = index === 0 ? 1 : Math.max(0.3, 1 - index * 0.25);
    const relevanceScore = Math.min(1, 0.35 + recency * 0.35 + roleOverlap * 0.35);
    const suggested = relevanceScore >= 0.5 || index < 2;
    return {
      id: c.id,
      name: c.name,
      issuingOrg: c.issuingOrg,
      issueYear: c.issueYear,
      order: c.order,
      relevanceScore,
      suggested,
    };
  });
}

export interface ScoredProject {
  id: string;
  name: string;
  role: string | null;
  endYear: number | null;
  isCurrent: boolean;
  order: number;
  relevanceScore: number;
  suggested: boolean;
}

export function scoreProjects(
  projects: { id: string; name: string; role: string | null; endYear: number | null; isCurrent: boolean; order: number }[],
  targetRole: string
): ScoredProject[] {
  const sorted = [...projects].sort((a, b) => {
    const aY = a.isCurrent ? CURRENT_YEAR : (a.endYear ?? 0);
    const bY = b.isCurrent ? CURRENT_YEAR : (b.endYear ?? 0);
    return bY - aY;
  });
  return sorted.map((p, index) => {
    const roleOverlap = wordOverlap(targetRole, [p.name, p.role].filter(Boolean).join(" "));
    const recency = index === 0 ? 1 : Math.max(0.3, 1 - index * 0.2);
    const relevanceScore = Math.min(1, 0.4 + recency * 0.3 + roleOverlap * 0.35);
    const suggested = relevanceScore >= 0.5 || index < 2;
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      endYear: p.endYear,
      isCurrent: p.isCurrent,
      order: p.order,
      relevanceScore,
      suggested,
    };
  });
}

export interface ScoredAward {
  id: string;
  title: string;
  issuer: string | null;
  year: number | null;
  order: number;
  relevanceScore: number;
  suggested: boolean;
}

export function scoreAwards(
  awards: { id: string; title: string; issuer: string | null; year: number | null; order: number }[],
  targetRole: string
): ScoredAward[] {
  const sorted = [...awards].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  return sorted.map((a, index) => {
    const roleOverlap = wordOverlap(targetRole, [a.title, a.issuer].filter(Boolean).join(" "));
    const recency = index === 0 ? 1 : Math.max(0.3, 1 - index * 0.25);
    const relevanceScore = Math.min(1, 0.4 + recency * 0.3 + roleOverlap * 0.35);
    const suggested = relevanceScore >= 0.5 || index < 2;
    return {
      id: a.id,
      title: a.title,
      issuer: a.issuer,
      year: a.year,
      order: a.order,
      relevanceScore,
      suggested,
    };
  });
}
