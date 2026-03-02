/**
 * API layer for keywords-by-role. Consumes KEYWORDS_BY_ROLE and exports
 * getKeywordsForRole, getAllKeywordsForRole, RoleKeywords for use by
 * keyword-optimizer and other consumers.
 */

import { KEYWORDS_BY_ROLE } from "./keywords-by-role";

export interface RoleKeywords {
  mustHave: string[];
  industryTerms: string[];
  actionVerbs: string[];
  softSkills: string[];
}

export function getKeywordsForRole(role: string): RoleKeywords | null {
  const list = KEYWORDS_BY_ROLE[role];
  if (!list?.length) return null;
  const keywords = list.map((k) => k.keyword);
  return {
    mustHave: keywords,
    industryTerms: [],
    actionVerbs: [],
    softSkills: [],
  };
}

export function getAllKeywordsForRole(kw: RoleKeywords): string[] {
  return [...kw.mustHave, ...kw.industryTerms, ...kw.actionVerbs, ...kw.softSkills];
}
