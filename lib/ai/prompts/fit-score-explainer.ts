/**
 * Phase 5A: AI prompt for enriching fit score gap suggestions.
 * Used by lib/fit-score/explainer.ts (GPT-4o, temperature 0.3).
 */

import type { FitGapItem } from "@/lib/fit-score/types";

export const FIT_SCORE_EXPLAINER_PROMPT_VERSION = "1.0.0";

export const FIT_SCORE_EXPLAINER_SYSTEM_PROMPT = `You are a career coach helping job seekers improve their applications.
Given a list of skill or experience gaps for a candidate applying to a specific role, rewrite each gap suggestion
to be specific, actionable, and encouraging. Keep suggestions concise (1–2 sentences max).
Respond with a JSON array only — no markdown, no explanation.
Each item must have: item (string), importance (string), suggestion (string).`;

export function buildFitScoreExplainerPrompt(
  gaps: FitGapItem[],
  jobTitle: string,
  currentRole: string | null
): string {
  return `Job title: ${jobTitle}
Candidate's current role: ${currentRole ?? "Not specified"}

Gaps to improve:
${JSON.stringify(gaps, null, 2)}

Rewrite each suggestion to be specific and actionable. Return JSON array only.`;
}
