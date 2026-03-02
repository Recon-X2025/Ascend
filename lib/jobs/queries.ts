/**
 * Job post queries for listing, detail, and similar jobs.
 */

import { prisma } from "@/lib/prisma/client";
import { getCompanyRatingAggregate } from "@/lib/companies/ratings";

export const jobListInclude = {
  companyRef: { select: { id: true, slug: true, name: true, logo: true, verified: true } },
  recruiter: { select: { name: true } },
  skills: { include: { skill: { select: { id: true, name: true } } } },
} as const;

export const jobDetailInclude = {
  companyRef: { select: { id: true, slug: true, name: true, logo: true, verified: true, industry: true, size: true, website: true } },
  recruiter: { select: { name: true } },
  skills: { include: { skill: { select: { id: true, name: true } } } },
  screeningQuestions: { orderBy: { order: "asc" } },
} as const;

export type JobWithRelations = Awaited<ReturnType<typeof getJobBySlug>>;

export async function getJobBySlug(slug: string) {
  const job = await prisma.jobPost.findUnique({
    where: { slug },
    include: jobDetailInclude,
  });
  return job;
}

export async function getSimilarJobs(jobId: number, limit: number = 6) {
  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    select: { companyId: true, title: true, skills: { select: { skillId: true } } },
  });
  if (!job) return [];

  const titleWords = job.title.split(/\s+/).filter((w) => w.length > 2).slice(0, 3);
  const skillIds = job.skills.map((s) => s.skillId);

  const candidates = await prisma.jobPost.findMany({
    where: {
      id: { not: jobId },
      status: "ACTIVE",
      visibility: "PUBLIC",
      OR: [
        ...(job.companyId ? [{ companyId: job.companyId }] : []),
        ...(titleWords.length ? [{ title: { contains: titleWords[0], mode: "insensitive" as const } }] : []),
        ...(skillIds.length ? [{ skills: { some: { skillId: { in: skillIds } } } }] : []),
      ],
    },
    take: limit * 2,
    include: jobListInclude,
  });

  const seen = new Set(candidates.map((c) => c.id));
  const deduped = candidates.filter((c) => seen.has(c.id));
  return deduped.slice(0, limit);
}

export interface JobListFilters {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  jobType?: string[];
  workMode?: string[];
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  includeNotDisclosed?: boolean;
  datePosted?: "24h" | "7d" | "30d";
  easyApplyOnly?: boolean;
  companySlug?: string;
  recruiterId?: string;
  status?: string;
  sort?: "recent" | "salary";
  similar?: number;
}

export async function getJobsForListing(filters: JobListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters.status) where.status = filters.status;
  else where.status = "ACTIVE";
  where.visibility = "PUBLIC";

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.location) where.locations = { has: filters.location };
  if (filters.jobType?.length) where.type = { in: filters.jobType };
  if (filters.workMode?.length) where.workMode = { in: filters.workMode };
  if (filters.experienceMin != null) where.experienceMax = { gte: filters.experienceMin };
  if (filters.experienceMax != null) where.experienceMin = { lte: filters.experienceMax };
  if (filters.salaryMin != null) where.salaryMax = { gte: filters.salaryMin };
  if (filters.salaryMax != null) where.salaryMin = { lte: filters.salaryMax };
  if (!filters.includeNotDisclosed) {
    where.salaryVisible = true;
  }
  if (filters.easyApplyOnly) where.easyApply = true;
  if (filters.recruiterId) where.recruiterId = filters.recruiterId;
  if (filters.companySlug) {
    where.companyRef = { slug: filters.companySlug };
  }

  if (filters.datePosted) {
    const since = new Date();
    if (filters.datePosted === "24h") since.setDate(since.getDate() - 1);
    else if (filters.datePosted === "7d") since.setDate(since.getDate() - 7);
    else if (filters.datePosted === "30d") since.setDate(since.getDate() - 30);
    where.publishedAt = { gte: since };
  }

  const orderBy =
    filters.sort === "salary"
      ? [{ salaryMax: "desc" as const }, { publishedAt: "desc" as const }]
      : { publishedAt: "desc" as const };

  if (filters.similar != null) {
    const similar = await getSimilarJobs(filters.similar, limit);
    const [total, jobs] = await Promise.all([
      prisma.jobPost.count({ where: { id: { in: similar.map((j) => j.id) } } }),
      Promise.resolve(similar),
    ]);
    return { jobs, total, nextCursor: null };
  }

  const [jobs, total] = await Promise.all([
    prisma.jobPost.findMany({
      where,
      skip,
      take: limit + 1,
      orderBy,
      include: jobListInclude,
    }),
    prisma.jobPost.count({ where }),
  ]);

  const hasMore = jobs.length > limit;
  const data = hasMore ? jobs.slice(0, limit) : jobs;
  const nextCursor = hasMore ? String(page + 1) : null;

  return { jobs: data, total, nextCursor };
}

export async function getCompanyRatingForJob(companyId: string | null) {
  if (!companyId) return null;
  return getCompanyRatingAggregate(companyId);
}

/** Fetch jobs by IDs preserving order (for Phase 5 search hydration). */
export async function getJobsByIdsOrdered(ids: number[]) {
  if (ids.length === 0) return [];
  const jobs = await prisma.jobPost.findMany({
    where: { id: { in: ids } },
    include: jobListInclude,
  });
  const byId = new Map(jobs.map((j) => [j.id, j]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as Awaited<ReturnType<typeof getJobsForListing>>["jobs"];
}
