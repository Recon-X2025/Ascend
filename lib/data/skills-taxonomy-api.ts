/**
 * API layer for skills-taxonomy. Consumes SKILLS_BY_ROLE and exports
 * getTaxonomyForRole, getGroupForSkillName, getAllTaxonomySkillNames, SkillGroup
 * for use by resume/skills-suggestions and other consumers.
 */

import { SKILLS_BY_ROLE } from "./skills-taxonomy";

export type SkillGroup = "core" | "technical" | "tools" | "soft";

export interface PrioritisedUserSkill {
  id: string;
  skillId: string;
  name: string;
  proficiency: string;
  group: SkillGroup;
  relevance: "high" | "low";
}

export interface SuggestedSkill {
  name: string;
  group: SkillGroup;
}

export interface TaxonomyForRole {
  core: string[];
  technical: string[];
  tools: string[];
  soft: string[];
}

export function getTaxonomyForRole(role: string): TaxonomyForRole | null {
  const skills = SKILLS_BY_ROLE[role];
  if (!skills?.length) return null;
  const names = skills.map((s) => s.skill);
  return {
    core: [],
    technical: names,
    tools: [],
    soft: [],
  };
}

export function getGroupForSkillName(name: string, tax: TaxonomyForRole): SkillGroup {
  const n = name.toLowerCase().trim();
  if (tax.core.some((s) => s.toLowerCase() === n)) return "core";
  if (tax.technical.some((s) => s.toLowerCase() === n)) return "technical";
  if (tax.tools.some((s) => s.toLowerCase() === n)) return "tools";
  if (tax.soft.some((s) => s.toLowerCase() === n)) return "soft";
  return "technical";
}

export function getAllTaxonomySkillNames(tax: TaxonomyForRole): string[] {
  return [...tax.core, ...tax.technical, ...tax.tools, ...tax.soft];
}
