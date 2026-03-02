import type { MentorTransition, MentorStyle, SessionFormat, MentorFocusArea } from "@prisma/client";

export const MENTOR_TRANSITION_LABELS: Record<MentorTransition, string> = {
  IC_TO_MANAGER: "IC → People Manager",
  MANAGER_TO_IC: "Manager → Back to IC",
  STARTUP_TO_LARGE: "Startup → Large company",
  LARGE_TO_STARTUP: "Large company → Startup",
  INDIA_TO_GLOBAL: "India → Global role",
  DOMAIN_SWITCH: "Domain switch (e.g. Eng → Product)",
  INDUSTRY_SWITCH: "Industry switch (e.g. IT → Fintech)",
  FIRST_JOB: "Helping freshers get started",
  LEVEL_UP: "Senior IC → Staff/Principal",
  RETURN_TO_WORK: "Returning after career break",
};

export const MENTOR_STYLE_LABELS: Record<MentorStyle, string> = {
  STRUCTURED: "Structured sessions",
  ASYNC: "Async Q&A",
  AD_HOC: "Ad-hoc check-ins",
};

export const SESSION_FORMAT_LABELS: Record<SessionFormat, string> = {
  VIDEO_CALL: "Video call",
  VOICE_CALL: "Voice call",
  ASYNC_CHAT: "Async chat",
  IN_PERSON: "In person",
};

export const MENTOR_FOCUS_LABELS: Record<MentorFocusArea, string> = {
  RESUME_REVIEW: "Resume review",
  INTERVIEW_PREP: "Interview prep",
  CAREER_PLANNING: "Career planning",
  SALARY_NEGOTIATION: "Salary negotiation",
  LEADERSHIP: "Leadership",
  TECHNICAL_GROWTH: "Technical growth",
  WORK_LIFE_BALANCE: "Work-life balance",
  NETWORKING: "Networking",
  ENTREPRENEURSHIP: "Entrepreneurship",
};

export const MENTOR_TRANSITIONS: MentorTransition[] = [
  "IC_TO_MANAGER",
  "MANAGER_TO_IC",
  "STARTUP_TO_LARGE",
  "LARGE_TO_STARTUP",
  "INDIA_TO_GLOBAL",
  "DOMAIN_SWITCH",
  "INDUSTRY_SWITCH",
  "FIRST_JOB",
  "LEVEL_UP",
  "RETURN_TO_WORK",
];

export const MENTOR_STYLES: MentorStyle[] = ["STRUCTURED", "ASYNC", "AD_HOC"];
export const SESSION_FORMATS: SessionFormat[] = ["VIDEO_CALL", "VOICE_CALL", "ASYNC_CHAT", "IN_PERSON"];
export const MENTOR_FOCUS_AREAS: MentorFocusArea[] = [
  "RESUME_REVIEW",
  "INTERVIEW_PREP",
  "CAREER_PLANNING",
  "SALARY_NEGOTIATION",
  "LEADERSHIP",
  "TECHNICAL_GROWTH",
  "WORK_LIFE_BALANCE",
  "NETWORKING",
  "ENTREPRENEURSHIP",
];
