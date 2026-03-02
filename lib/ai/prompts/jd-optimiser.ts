/**
 * JD Resume Optimiser — Phase 6A
 * All AI prompt strings for tailoring a candidate's resume to a specific job description.
 * Constraint: Only rewrite/reorder/rephrase existing profile content; never invent or add.
 */

export const JD_OPTIMISER_SYSTEM_PROMPT = `
You are an expert resume strategist and ATS optimisation specialist.
Your task is to tailor a candidate's existing resume content to better match a specific job description.

CRITICAL RULES — YOU MUST FOLLOW ALL OF THESE WITHOUT EXCEPTION:
1. You may ONLY rewrite, reorder, or rephrase content that is explicitly present in the candidate's profile data given to you.
2. You must NEVER invent, fabricate, infer, or hallucinate any skill, responsibility, achievement, technology, or experience that is not explicitly stated in the input profile data.
3. You must NEVER add bullet points, skills, or sentences that have no direct source in the provided profile data.
4. If a keyword from the JD has no evidence in the candidate's profile, you MUST list it under "missingKeywords" — you may not fill it in.
5. For every rewritten bullet, you MUST include a "sourceRef" field indicating exactly which part of the profile it came from (e.g., "experience[1].bullets[2]").
6. You must include a "fabricationRisk": false assertion on every item you output. If you cannot make that assertion honestly, omit the item entirely.
7. Improving the fit score is only valid if it reflects genuine alignment. Do not rewrite to game the score.

Your job is to:
- Surface and front-load existing skills and experience that are relevant to this specific JD
- Rewrite bullet points to use the JD's language where the underlying experience genuinely supports it
- Identify which JD keywords are already present vs. which are genuine gaps the candidate should address
- Rewrite the professional summary to align with this specific role
- Re-order skills sections to prioritise the most JD-relevant ones

Output must be a valid JSON object matching the OptimiserOutput schema below.
`.trim();

export interface JdOptimiserProfileInput {
  summary: string;
  experience: Array<{
    index: number;
    title: string;
    company: string;
    bullets: Array<{ index: number; text: string }>;
  }>;
  skills: string[];
  education: Array<{ index: number; degree: string; institution: string }>;
  projects: Array<{ index: number; name: string; description: string }>;
}

export interface JdOptimiserUserPromptInput {
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  profileData: JdOptimiserProfileInput;
  baseResumeSections: Record<string, unknown>;
}

export function JD_OPTIMISER_USER_PROMPT(input: JdOptimiserUserPromptInput): string {
  return `
Here is the job posting to optimise for:

JOB TITLE: ${input.jobTitle}

JOB DESCRIPTION:
${input.jobDescription}

REQUIRED SKILLS FROM JD:
${input.requiredSkills.join(", ")}

---

Here is the candidate's full profile data (this is the ONLY source you may draw from):

CURRENT SUMMARY:
${input.profileData.summary}

EXPERIENCE:
${JSON.stringify(input.profileData.experience, null, 2)}

SKILLS:
${input.profileData.skills.join(", ")}

EDUCATION:
${JSON.stringify(input.profileData.education, null, 2)}

PROJECTS:
${JSON.stringify(input.profileData.projects, null, 2)}

---

Return a JSON object with this exact structure:

{
  "rewrittenSummary": {
    "text": "string — rewritten summary for this specific role",
    "sourceRef": "profileData.summary",
    "fabricationRisk": false
  },
  "rewrittenBullets": [
    {
      "experienceIndex": 0,
      "bulletIndex": 0,
      "originalText": "string",
      "rewrittenText": "string — rephrased using JD language where the experience supports it",
      "sourceRef": "experience[0].bullets[0]",
      "keywordsAdded": ["array of JD keywords now surfaced in this bullet"],
      "fabricationRisk": false
    }
  ],
  "prioritisedSkills": {
    "jdRelevant": ["skills from profile that match JD — ordered by relevance"],
    "other": ["remaining skills from profile"],
    "fabricationRisk": false
  },
  "presentKeywords": ["JD keywords found in candidate's existing profile"],
  "missingKeywords": [
    {
      "keyword": "string",
      "suggestion": "string — honest advice e.g. 'Add to profile if you have this experience'"
    }
  ],
  "optimisationSummary": {
    "bulletsRewritten": 0,
    "keywordsCovered": 0,
    "keywordsGapped": 0,
    "fabricationBlockedCount": 0,
    "notes": "string — brief plain-English summary of what was changed and why"
  }
}

REMINDER: fabricationRisk must be false on every object. If you cannot honestly mark it false, omit that item.
`.trim();
}
