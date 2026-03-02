/**
 * Typesense sync: indexJob, removeJob, reindexAllJobs.
 * Fire-and-forget from API routes; do not await in HTTP response path.
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
  /** Phase 18B: not used in Typesense doc; allows callers to pass full job after visibility switch */
  visibility?: string;
  internalFirstDays?: number | null;
};

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
  const client = typesenseClient;
  if (!client) return;
  const doc = toTypesenseDoc(job, companyRating);
  client
    .collections(JOBS_COLLECTION)
    .documents()
    .upsert(doc)
    .then(() => {
      invalidateJobSearchCache().catch((err) => console.error("[search] invalidateJobSearchCache error:", err));
    })
    .catch((err) => console.error("[Typesense] indexJob error:", err));
}

export function removeJob(jobId: number): void {
  const client = typesenseClient;
  if (!client) return;
  client
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
  const client = typesenseClient;
  if (!client) {
    console.warn("[Typesense] reindexAllJobs: no client");
    return { indexed: 0, errors: 0 };
  }
  let indexed = 0;
  let errors = 0;
  let offset = 0;
  while (true) {
    const jobs = await prisma.jobPost.findMany({
      where: { status: "ACTIVE", visibility: "PUBLIC" },
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
      const result = await client.collections(JOBS_COLLECTION).documents().import(docs, { action: "upsert" });
      const failed = (Array.isArray(result) ? result : [result]).filter((r: { success?: boolean }) => !r.success);
      indexed += docs.length - failed.length;
      errors += failed.length;
    } catch (e) {
      console.error("[Typesense] reindexAllJobs batch error:", e);
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
