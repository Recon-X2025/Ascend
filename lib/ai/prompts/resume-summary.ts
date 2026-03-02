/**
 * Versioned prompts for AI-generated professional summary (GPT-4o).
 * Forward-focused: open with target role, never "I am currently a [past title]".
 */

export const RESUME_SUMMARY_PROMPT_VERSION = "resume-summary-v1";

export interface SummaryPromptInput {
  targetRole: string;
  targetIndustry: string;
  careerGoal: string;
  switchingIndustry: boolean;
  fromIndustry: string | null;
  toIndustry: string | null;
  /** Top 2–3 value props extracted from rewritten experience bullets. */
  valueProps: string[];
}

function buildSystemPrompt(): string {
  return `You are an expert resume writer. Generate exactly 3 alternative professional summary paragraphs for a resume.

Rules:
1. Forward-focused: ALWAYS open with the TARGET role the candidate is pursuing, e.g. "Experienced Product Manager..." or "Results-driven engineer transitioning into product...". NEVER open with their current or past job title as if it is their identity.
2. Each summary must be 3–5 sentences.
3. Include the candidate's career goal (provided) and the top 2–3 value propositions (provided) woven in naturally.
4. Tone: professional, confident. First-person implied but do not use "I" or "my".
5. If the candidate is switching industries: acknowledge the transition positively and lead with transferable strengths. Do not apologise or sound defensive.
6. Do not fabricate companies, titles, or metrics. Use only the information provided.
7. Respond with valid JSON only: { "summaries": [string, string, string] }. No markdown, no explanation.`;
}

function buildUserPrompt(input: SummaryPromptInput): string {
  const lines: string[] = [
    `Target role: ${input.targetRole}`,
    `Target industry: ${input.targetIndustry}`,
    `Career goal: ${input.careerGoal}`,
  ];
  if (input.switchingIndustry && input.fromIndustry && input.toIndustry) {
    lines.push(`Candidate is switching from ${input.fromIndustry} to ${input.toIndustry}. Acknowledge positively and lead with transferable strengths.`);
  }
  lines.push("Top value propositions to include (use 2–3):");
  input.valueProps.forEach((v, i) => lines.push(`${i + 1}. ${v}`));
  lines.push("\nRespond with JSON: { \"summaries\": [string, string, string] }");
  return lines.join("\n");
}

export function buildSummaryPrompt(input: SummaryPromptInput): { system: string; user: string } {
  return {
    system: buildSystemPrompt(),
    user: buildUserPrompt(input),
  };
}
