/**
 * Versioned prompts for resume content generation (GPT-4o).
 * Used by the resume BullMQ worker for experience bullet reframing.
 */

export const RESUME_CONTENT_PROMPT_VERSION = "resume-content-experience-v1";

export interface ExperienceBulletInput {
  experienceId: string;
  company: string;
  designation: string;
  industryContext?: string;
  bullets: string[];
  condenseToMaxBullets?: number;
  switchingIndustry?: boolean;
  fromIndustry?: string | null;
  toIndustry?: string | null;
  targetRole: string;
  targetIndustry: string;
}

export interface ExperienceBulletOutput {
  experienceId: string;
  rewrittenBullets: string[];
  actionVerbs: string[];
  transferableSkillSurfaced?: boolean;
}

function buildSystemPrompt(): string {
  return `You are an expert resume writer. Your task is to rewrite work experience bullet points so they are achievement-focused and aligned with the candidate's target role and industry.

Rules:
1. Never fabricate companies, job titles, dates, or credentials. Only reframe what is already stated.
2. Convert responsibility language into achievement language. Where the original implies a responsibility, phrase it as an outcome (e.g. "Responsible for X" → "Delivered X resulting in Y").
3. Add or suggest metrics where they strengthen the bullet. If the candidate did not provide a number, use a placeholder exactly in this form: [X% improvement — add your metric] or [N users — add your metric]. Do not invent specific numbers.
4. Use strong action verbs (Led, Architected, Drove, Reduced, Scaled, Launched, Implemented, Optimized, etc.). Avoid weak verbs like "Helped", "Worked on", "Responsible for".
5. Align terminology with the target role and target industry so the bullet is relevant to the job the candidate is targeting.
6. If the candidate is switching industries (switchingIndustry is true), surface transferable skills and reframe experience in a way that highlights relevance to the target industry. Set transferableSkillSurfaced to true for any bullet where you explicitly surfaced a transferable skill.
7. Output valid JSON only: { "rewrittenBullets": string[], "actionVerbs": string[], "transferableSkillSurfaced": boolean }.`;
}

function buildUserPrompt(input: ExperienceBulletInput): string {
  const lines: string[] = [
    `Target role: ${input.targetRole}`,
    `Target industry: ${input.targetIndustry}`,
    `Experience: ${input.designation} at ${input.company}`,
  ];
  if (input.industryContext) lines.push(`Industry context: ${input.industryContext}`);
  if (input.switchingIndustry && input.fromIndustry && input.toIndustry) {
    lines.push(`Candidate is switching from ${input.fromIndustry} to ${input.toIndustry}. Surface transferable skills where relevant.`);
  }
  if (input.condenseToMaxBullets) {
    lines.push(`Keep to a maximum of ${input.condenseToMaxBullets} bullet points (this experience is older or less relevant).`);
  }
  lines.push("Original bullets:");
  input.bullets.forEach((b, i) => lines.push(`${i + 1}. ${b}`));
  lines.push("\nRespond with JSON: { \"rewrittenBullets\": string[], \"actionVerbs\": string[], \"transferableSkillSurfaced\": boolean }");
  return lines.join("\n");
}

export function buildExperienceBulletPrompt(input: ExperienceBulletInput): {
  system: string;
  user: string;
} {
  return {
    system: buildSystemPrompt(),
    user: buildUserPrompt(input),
  };
}
