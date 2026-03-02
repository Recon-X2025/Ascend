/**
 * Phase 11: Cover letter generator prompt.
 * Forward-focused, contextual to JD; never fabricates.
 */

export const PROMPT_VERSION = "v1";

export interface CoverLetterPromptInputs {
  candidateName: string;
  targetRole: string;
  companyName: string;
  roleTitle: string;
  keyResponsibilities: string[];
  jdTone: string;
  topExperiences: Array<{ title: string; company: string; bullets: string[] }>;
  topMatchedSkills: string[];
  optionalNote?: string;
}

export function buildPrompt(inputs: CoverLetterPromptInputs): string {
  const system = `You are an expert cover letter writer. Generate a single cover letter (approx 250 words, 3 paragraphs).

Rules:
1. Forward-focused: Open with the TARGET ROLE and a concise value proposition. Never open with "I am applying for..." or "I am writing to apply...".
2. Bridge what the candidate has done to what this company needs. Use only the experiences and skills provided — never fabricate.
3. If there is no relevant experience for a requirement, focus on what IS present; do not apologise or invent.
4. Match tone to the JD: startup = direct and energetic; enterprise = formal and measured; technical = precise.
5. Close with genuine enthusiasm for this company and a clear call to action.
6. Output ONLY the cover letter text. No subject line, no salutation ("Dear Hiring Manager" is fine to include once at the start), no sign-off beyond a professional closing. No JSON, no markdown.`;

  const expBlock = inputs.topExperiences
    .map(
      (e) =>
        `- ${e.title} at ${e.company}: ${e.bullets.slice(0, 3).join("; ")}`
    )
    .join("\n");

  const user = [
    `Candidate name: ${inputs.candidateName}`,
    `Target role (candidate's goal): ${inputs.targetRole}`,
    `Company: ${inputs.companyName}`,
    `Role title in this JD: ${inputs.roleTitle}`,
    `JD tone: ${inputs.jdTone}`,
    "",
    "Key responsibilities from JD:",
    ...inputs.keyResponsibilities.slice(0, 6).map((r) => `- ${r}`),
    "",
    "Top matched skills (use these):",
    inputs.topMatchedSkills.slice(0, 8).join(", "),
    "",
    "Relevant experience (use only this):",
    expBlock,
  ].join("\n");

  const userWithNote =
    inputs.optionalNote?.trim() ?
      `${user}\n\nCandidate note to include if possible: ${inputs.optionalNote.trim().slice(0, 500)}`
    : user;
  return `${system}\n\n---\n\n${userWithNote}`;
}

/** Split into system and user for API call. */
export function buildCoverLetterMessages(inputs: CoverLetterPromptInputs): { system: string; user: string } {
  const full = buildPrompt(inputs);
  const idx = full.indexOf("\n\n---\n\n");
  if (idx === -1) return { system: full, user: "" };
  return {
    system: full.slice(0, idx).trim(),
    user: full.slice(idx + 7).trim(),
  };
}
