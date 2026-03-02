/**
 * Common job titles for resume builder target-role autocomplete.
 * Can be replaced later by /api/jobs/titles or a taxonomy service.
 */
export const JOB_TITLES = [
  "Product Manager",
  "Senior Product Manager",
  "Associate Product Manager",
  "Lead Product Manager",
  "Director of Product",
  "VP of Product",
  "Chief Product Officer",
  "Software Engineer",
  "Senior Software Engineer",
  "Staff Software Engineer",
  "Software Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Data Engineer",
  "Site Reliability Engineer",
  "Engineering Manager",
  "Technical Lead",
  "Director of Engineering",
  "VP of Engineering",
  "CTO",
  "Data Scientist",
  "Data Analyst",
  "Machine Learning Engineer",
  "Product Designer",
  "UX Designer",
  "UI Designer",
  "Project Manager",
  "Program Manager",
  "Scrum Master",
  "Business Analyst",
  "Marketing Manager",
  "Content Writer",
  "Sales Manager",
  "Account Executive",
  "Customer Success Manager",
  "HR Manager",
  "Recruiter",
  "Financial Analyst",
  "Operations Manager",
  "Consultant",
  "Intern",
] as const;

const TITLES_LOWER = JOB_TITLES.map((t) => t.toLowerCase());

export function searchJobTitles(query: string, limit = 15): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return JOB_TITLES.slice(0, limit);
  const exact: string[] = [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (let i = 0; i < TITLES_LOWER.length; i++) {
    const title = TITLES_LOWER[i];
    if (title === q) exact.push(JOB_TITLES[i]);
    else if (title.startsWith(q)) starts.push(JOB_TITLES[i]);
    else if (title.includes(q)) contains.push(JOB_TITLES[i]);
  }
  return [...exact, ...starts, ...contains].slice(0, limit);
}
