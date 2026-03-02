/**
 * Phase 5A: Extract structured job signal from JobPost and optional ParsedJD.
 */

import { prisma } from "@/lib/prisma/client";
import type { JobSignal } from "./job-extractor-types";

const STOP_WORDS = new Set(
  [
    "the", "and", "for", "with", "that", "this", "from", "have", "has", "had",
    "were", "been", "being", "will", "would", "could", "should", "about", "into",
    "through", "during", "before", "after", "above", "below", "between", "under",
    "again", "further", "then", "once", "here", "there", "when", "where", "which",
    "while", "each", "some", "more", "most", "other", "such", "only", "same",
    "than", "too", "very", "just", "also", "both", "using", "used",
  ]
);

function tokeniseDescription(description: string, limit: number = 60): string[] {
  const text = (description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^\w\s]/g, " ")
    .toLowerCase();
  const words = text
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

function dedupLower(arr: string[]): string[] {
  return Array.from(new Set(arr.map(normalise).filter(Boolean)));
}

export async function extractJobSignal(jobPostId: string): Promise<JobSignal | null> {
  const id = typeof jobPostId === "string" ? parseInt(jobPostId, 10) : jobPostId;
  if (Number.isNaN(id)) return null;

  const job = await prisma.jobPost.findUnique({
    where: { id },
    include: { skills: { include: { skill: { select: { name: true } } } } },
  });
  if (!job) return null;

  const mustHaveSkills = job.skills
    .filter((s) => s.required)
    .map((s) => s.skill.name.trim())
    .filter(Boolean);
  const niceToHaveSkills = job.skills
    .filter((s) => !s.required)
    .map((s) => s.skill.name.trim())
    .filter(Boolean);

  let parsedSkills: { mustHave: string[]; niceToHave: string[] } | null = null;
  let keywords: string[] = [];
  let seniority: string | null = null;

  const parsedJD = await prisma.parsedJD.findFirst({
    where: {
      title: { contains: job.title.split(/\s+/)[0] ?? "", mode: "insensitive" },
    },
    orderBy: { parsedAt: "desc" },
  });

  if (parsedJD) {
    seniority = parsedJD.seniority;
    const raw = parsedJD.skills as unknown;
    if (raw && typeof raw === "object" && "mustHave" in raw && "niceToHave" in raw) {
      const must = Array.isArray((raw as { mustHave: unknown }).mustHave)
        ? ((raw as { mustHave: string[] }).mustHave.map((s) => String(s).trim()).filter(Boolean))
        : [];
      const nice = Array.isArray((raw as { niceToHave: unknown }).niceToHave)
        ? ((raw as { niceToHave: string[] }).niceToHave.map((s) => String(s).trim()).filter(Boolean))
        : [];
      parsedSkills = { mustHave: must, niceToHave: nice };
    }
    if (Array.isArray(parsedJD.keywords)) {
      keywords = parsedJD.keywords.map((k) => String(k).trim()).filter(Boolean);
    }
  }

  const mergedMust = dedupLower([...mustHaveSkills, ...(parsedSkills?.mustHave ?? [])]);
  const mergedNice = dedupLower([...niceToHaveSkills, ...(parsedSkills?.niceToHave ?? [])]);

  if (keywords.length === 0) {
    keywords = tokeniseDescription(job.description, 60);
  }

  const educationLevelMap: Record<string, string> = {
    HIGH_SCHOOL: "high_school",
    DIPLOMA: "diploma",
    BACHELORS: "bachelors",
    MASTERS: "masters",
    PHD: "phd",
  };
  const educationLevel =
    job.educationLevel === "ANY" ? null : educationLevelMap[job.educationLevel] ?? job.educationLevel.toLowerCase();

  return {
    jobPostId: String(job.id),
    title: job.title,
    mustHaveSkills: mergedMust,
    niceToHaveSkills: mergedNice,
    parsedSkills,
    keywords,
    experienceMin: job.experienceMin,
    experienceMax: job.experienceMax,
    educationLevel,
    jobTitle: job.title,
    seniority,
  };
}
