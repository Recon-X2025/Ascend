/**
 * Phase 11: Interview question generator prompt.
 * Questions to prepare for + questions to ask the interviewer.
 */

export const PROMPT_VERSION = "v1";

export interface InterviewPrepPromptInputs {
  roleTitle: string;
  seniority: string | null;
  responsibilities: string[];
  mustHaveSkills: string[];
  companyType?: string | null;
  /** Fit score dimension gaps — e.g. ["Experience Match is low", "Skill X is missing"] */
  fitGaps: string[];
  /** Single biggest skill gap for this role */
  biggestSkillGap: string | null;
  /** Candidate experience summary for experience-based questions */
  experienceSummary: string;
}

export function buildPrompt(inputs: InterviewPrepPromptInputs): { system: string; user: string } {
  const system = `You are an expert interview coach. Generate two lists in valid JSON only. No markdown, no explanation.

Output format (exact keys):
{
  "expectQuestions": [
    { "question": "string", "category": "technical" | "experience" | "culture" | "skill_gap", "why": "one line explaining why they might ask this" }
  ],
  "askQuestions": [
    { "question": "string" }
  ]
}

Rules for expectQuestions (8-12 total):
- 3-4 role-specific technical/functional questions based on JD responsibilities.
- 2-3 experience-based questions targeting the candidate's profile (e.g. if experience match is low: "Tell me about a time you took on responsibilities outside your defined role").
- 1-2 culture/fit questions based on company type.
- 1 question targeting the most significant skill gap (if provided).
- Each item must have "why" in one short line.

Rules for askQuestions (4-6 total):
- Role clarity, team dynamics, success metrics, growth path.
- Specific to this role/company — not generic LinkedIn questions.`;

  const userContent = [
    `Role: ${inputs.roleTitle}${inputs.seniority ? ` (${inputs.seniority})` : ""}`,
    `Company type: ${inputs.companyType ?? "unknown"}`,
    "",
    "Key responsibilities:",
    ...inputs.responsibilities.slice(0, 6).map((r) => `- ${r}`),
    "",
    "Must-have skills:",
    inputs.mustHaveSkills.slice(0, 10).join(", "),
    "",
    "Candidate profile / fit gaps (use for experience-based questions):",
    inputs.fitGaps.length ? inputs.fitGaps.join("; ") : "None specified.",
    inputs.biggestSkillGap ? `Biggest skill gap: ${inputs.biggestSkillGap}` : "",
    "",
    "Candidate experience summary:",
    inputs.experienceSummary.slice(0, 800),
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user: userContent };
}
