export const JD_PARSE_PROMPT_VERSION = "1.0.0"

export const JD_PARSE_SYSTEM_PROMPT = `You are an expert job description analyser. Extract structured data from job descriptions accurately and consistently. Always respond with valid JSON only — no preamble, no markdown fences, no explanation.`

export const buildJDParsePrompt = (rawText: string): string => `
Analyse the following job description and extract structured data.

Return ONLY a valid JSON object with this exact schema:
{
  "title": "string — normalised job title (e.g. 'Senior Product Manager', not 'Sr. PM')",
  "company": "string — employer/company name as stated in the JD, or null if not stated",
  "seniority": "one of: Junior | Mid | Senior | Lead | Manager | Director | VP | C-Suite | null",
  "industry": "string — primary industry (e.g. 'Fintech', 'E-commerce', 'SaaS', 'Healthcare') or null",
  "location": "string — primary city name, normalised (e.g. 'Bangalore', 'Mumbai') or 'Remote' or null",
  "workMode": "one of: Remote | Hybrid | Onsite | null",
  "skills": {
    "mustHave": ["array of must-have skills/technologies — exact names, max 15"],
    "niceToHave": ["array of nice-to-have skills — exact names, max 10"]
  },
  "keywords": ["array of important domain/role keywords from the JD, max 20 — include role-specific terminology, methodologies, tools"],
  "responsibilities": ["array of key responsibility bullet points, max 8 — concise, action-verb led"],
  "salaryMin": "integer in INR per annum or null if not mentioned",
  "salaryMax": "integer in INR per annum or null if not mentioned",
  "currency": "currency code if mentioned, default INR",
  "tone": "one of: formal | startup | technical | creative | null",
  "companySize": "one of: startup | sme | enterprise | null — infer from context if not stated",
  "functionalArea": "string — e.g. Engineering, Product, Design, Sales, Marketing, Operations, or null"
}

Rules:
- Normalise all job titles (expand abbreviations, fix capitalisation)
- Normalise all city names to their standard English spelling
- Extract salary only if explicitly stated — do not infer
- Skills must be exact technology/tool names where possible (e.g. 'React' not 'React.js' or 'ReactJS')
- If a field cannot be determined, use null
- Never fabricate information not present in the JD

Job Description:
---
${rawText.slice(0, 6000)}
---`
