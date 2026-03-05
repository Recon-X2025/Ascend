/**
 * Typesense sync: indexJob, removeJob, reindexAllJobs.
 * indexJob/removeJob: JobPost table (API routes).
 * reindexAllJobs: ParsedJD table (bulk reindex).
 */

import { prisma } from "@/lib/prisma/client";
import { getCompanyRatingAggregate } from "@/lib/companies/ratings";
import { typesenseClient } from "../client";
import { JOBS_COLLECTION, type TypesenseJobDocument } from "../schemas/jobs";
import { invalidateJobSearchCache } from "../cache";

type PrismaJob = {
  id: number;
  slug: string;
  title: string;
  description: string;
  type: string;
  workMode: string;
  locations: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryVisible: boolean;
  experienceMin: number | null;
  experienceMax: number | null;
  educationLevel: string;
  tags: string[];
  status: string;
  easyApply: boolean;
  viewCount: number;
  applicationCount: number;
  companyId: string | null;
  companyName: string | null;
  publishedAt: Date | null;
  skills?: { skill: { name: string } }[];
  companyRef?: { slug: string; verified?: boolean } | null;
};

type ParsedJDRecord = {
  id: string;
  title: string;
  company: string | null;
  seniority: string | null;
  location: string | null;
  workMode: string | null;
  skills: unknown;
  keywords: string[];
  responsibilities: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  parsedAt: Date;
};

function parseSkillsJson(skills: unknown): string[] {
  if (!skills || typeof skills !== "object") return [];
  const obj = skills as { mustHave?: string[]; niceToHave?: string[] };
  const mustHave = Array.isArray(obj.mustHave) ? obj.mustHave : [];
  const niceToHave = Array.isArray(obj.niceToHave) ? obj.niceToHave : [];
  return Array.from(new Set([...mustHave, ...niceToHave]));
}

function parsedJdToTypesenseDoc(job: ParsedJDRecord): TypesenseJobDocument {
  const description = job.responsibilities?.length
    ? job.responsibilities.join("\n\n")
    : job.title;
  const skills = parseSkillsJson(job.skills);
  const hasSalary = job.salaryMin != null || job.salaryMax != null;
  return {
    id: job.id,
    title: job.title,
    description,
    companyName: job.company ?? undefined,
    companySlug: undefined,
    companyVerified: undefined,
    location: job.location ? [job.location] : [],
    workMode: job.workMode ?? "Onsite",
    jobType: job.seniority ?? "Full-time",
    skills,
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    salaryVisible: hasSalary,
    experienceMin: undefined,
    experienceMax: undefined,
    educationLevel: "ANY",
    tags: job.keywords ?? [],
    status: "ACTIVE",
    easyApply: true,
    companyRating: undefined,
    publishedAt: job.parsedAt ? Math.floor(new Date(job.parsedAt).getTime() / 1000) : 0,
    viewCount: 0,
    applicationCount: 0,
  };
}

function toTypesenseDoc(job: PrismaJob, companyRating?: number | null): TypesenseJobDocument {
  return {
    id: String(job.id),
    title: job.title,
    description: job.description,
    companyName: job.companyName ?? undefined,
    companySlug: job.companyRef?.slug ?? undefined,
    companyVerified: job.companyRef?.verified ?? undefined,
    location: job.locations ?? [],
    workMode: job.workMode,
    jobType: job.type,
    skills: (job.skills ?? []).map((s) => s.skill.name),
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    salaryVisible: job.salaryVisible,
    experienceMin: job.experienceMin ?? undefined,
    experienceMax: job.experienceMax ?? undefined,
    educationLevel: job.educationLevel,
    tags: job.tags ?? [],
    status: job.status,
    easyApply: job.easyApply,
    companyRating: companyRating ?? undefined,
    publishedAt: job.publishedAt ? Math.floor(job.publishedAt.getTime() / 1000) : 0,
    viewCount: job.viewCount,
    applicationCount: job.applicationCount,
  };
}

export function indexJob(job: PrismaJob, companyRating?: number | null): void {
  const doc = toTypesenseDoc(job, companyRating);
  typesenseClient
    .collections(JOBS_COLLECTION)
    .documents()
    .upsert(doc)
    .then(() => {
      invalidateJobSearchCache().catch((err) => console.error("[search] invalidateJobSearchCache error:", err));
    })
    .catch((err) => console.error("[Typesense] indexJob error:", err));
}

export function removeJob(jobId: number): void {
  typesenseClient
    .collections(JOBS_COLLECTION)
    .documents(String(jobId))
    .delete()
    .then(() => {
      invalidateJobSearchCache().catch((err) => console.error("[search] invalidateJobSearchCache error:", err));
    })
    .catch((err) => console.error("[Typesense] removeJob error:", err));
}

const BATCH_SIZE = 100;

export async function reindexAllJobs(): Promise<{ indexed: number; errors: number }> {
  let indexed = 0;
  let errors = 0;

  /* 1. Index JobPost (Prisma) - recruiter-posted jobs */
  let offset = 0;
  while (true) {
    const jobs = await prisma.jobPost.findMany({
      where: { visibility: "PUBLIC" },
      include: { skills: { include: { skill: { select: { name: true } } } }, companyRef: { select: { slug: true, verified: true } } },
      skip: offset,
      take: BATCH_SIZE,
    });
    if (jobs.length === 0) break;
    const companyIds = Array.from(new Set(jobs.map((j) => j.companyId).filter(Boolean))) as string[];
    const ratings = await Promise.all(companyIds.map((id) => getCompanyRatingAggregate(id)));
    const ratingByCompany = Object.fromEntries(companyIds.map((id, i) => [id, ratings[i]?.overallAvg ?? null]));
    const docs = jobs.map((j) =>
      toTypesenseDoc(
        { ...j, companyRef: j.companyRef ?? undefined, skills: j.skills },
        j.companyId ? ratingByCompany[j.companyId] ?? null : null
      )
    );
    try {
      const result = await typesenseClient.collections(JOBS_COLLECTION).documents().import(docs, { action: "upsert" });
      const failed = (Array.isArray(result) ? result : [result]).filter((r: { success?: boolean }) => !r.success);
      indexed += docs.length - failed.length;
      errors += failed.length;
    } catch (e) {
      console.error("[Typesense] reindexAllJobs JobPost batch error:", e);
      errors += jobs.length;
    }
    offset += jobs.length;
    if (jobs.length < BATCH_SIZE) break;
  }

  /* 2. Index ParsedJD - ingested job descriptions */
  offset = 0;
  while (true) {
    const jobs = await prisma.parsedJD.findMany({
      select: {
        id: true,
        title: true,
        company: true,
        seniority: true,
        location: true,
        workMode: true,
        skills: true,
        keywords: true,
        responsibilities: true,
        salaryMin: true,
        salaryMax: true,
        parsedAt: true,
      },
      skip: offset,
      take: BATCH_SIZE,
    });
    if (jobs.length === 0) break;
    const docs = jobs.map((j) => parsedJdToTypesenseDoc(j as ParsedJDRecord));
    try {
      const result = await typesenseClient.collections(JOBS_COLLECTION).documents().import(docs, { action: "upsert" });
      const failed = (Array.isArray(result) ? result : [result]).filter((r: { success?: boolean }) => !r.success);
      indexed += docs.length - failed.length;
      errors += failed.length;
    } catch (e) {
      console.error("[Typesense] reindexAllJobs ParsedJD batch error:", e);
      errors += jobs.length;
    }
    offset += jobs.length;
    if (jobs.length < BATCH_SIZE) break;
  }
  try {
    await invalidateJobSearchCache();
  } catch (e) {
    console.error("[search] invalidateJobSearchCache error:", e);
  }
  return { indexed, errors };
}
