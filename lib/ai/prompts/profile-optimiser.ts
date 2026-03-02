/**
 * Phase 11: Profile strength analyser prompt.
 * Headline, summary, skill gaps, bullet suggestions — specific to target role.
 */

export const PROMPT_VERSION = "v1";

export interface ProfileOptimiserPromptInputs {
  targetRole: string;
  currentHeadline: string | null;
  currentSummary: string | null;
  /** Skills appearing in 60%+ of target role JDs that are absent on profile */
  topSkillGaps: Array<{ skill: string; frequencyPct: number }>;
  /** Aggregate of what top candidates for this role include */
  jdInsightSummary: string;
  /** 2 weakest bullet points (role + company + bullets) */
  weakBullets: Array<{ role: string; company: string; bullet: string }>;
  /** Current fit score average if any */
  avgFitScore: number | null;
}

export function buildPrompt(inputs: ProfileOptimiserPromptInputs): { system: string; user: string } {
  const system = `You are an expert career coach and resume reviewer. Analyse this profile for the target role and return valid JSON only. No markdown, no explanation.

Output format (exact keys):
{
  "headline": {
    "isForwardFacing": boolean,
    "suggestion": "rewritten headline opening with target role, 1 line",
    "reason": "one line why"
  },
  "summary": {
    "opensWithTargetRole": boolean,
    "achievementFocused": boolean,
    "suggestion": "rewritten summary 2-4 sentences",
    "reason": "one line why"
  },
  "skillGaps": [
    { "skill": "string", "frequencyPct": number, "suggestion": "Consider adding [X] if you have this — it appears in N% of [Role] job descriptions." }
  ],
  "bulletSuggestions": [
    { "originalBullet": "string", "suggestedBullet": "string", "reason": "one line" }
  ]
}

Rules:
- Headline: Forward-facing = leads with target role, not current/past title. Suggest a single line.
- Summary: Should open with target role; achievement-focused. Suggest 2-4 sentences.
- skillGaps: One line per gap from the list provided; use the exact frequency in the suggestion text.
- bulletSuggestions: Rewrite the 2 weakest bullets to be achievement-focused, quantified where possible. Do not fabricate.`;

  const userContent = [
    `Target role: ${inputs.targetRole}`,
    `Current headline: ${inputs.currentHeadline ?? "(empty)"}`,
    `Current summary: ${(inputs.currentSummary ?? "(empty)").slice(0, 600)}`,
    "",
    "JD insight (what top candidates for this role include):",
    inputs.jdInsightSummary.slice(0, 500),
    "",
    "Top skill gaps (absent on profile, high in JDs):",
    ...inputs.topSkillGaps.slice(0, 5).map((s) => `- ${s.skill} (${s.frequencyPct}% of JDs)`),
    "",
    "Weakest experience bullets to improve:",
    ...inputs.weakBullets.map(
      (b) => `- ${b.role} at ${b.company}: ${b.bullet}`
    ),
    inputs.avgFitScore != null ? `Current average fit score (saved/applied jobs): ${inputs.avgFitScore}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user: userContent };
}
