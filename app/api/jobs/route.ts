import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getJobsForListing, getJobsByIdsOrdered } from "@/lib/jobs/queries";
import { jobSlug } from "@/lib/jobs/slug";
import { sanitizeRichText } from "@/lib/html/sanitize";
import { createJobSchema } from "@/lib/validations/job";
import { logAudit } from "@/lib/audit/log";
import { getRequestContext } from "@/lib/audit/context";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { searchJobs } from "@/lib/search/queries/jobs";
import { getCachedSearch, setCachedSearch, searchCacheKey } from "@/lib/search/cache";
import { indexJob } from "@/lib/search/sync/jobs";

function serializeJob(
  row: {
    id: number;
    slug: string;
    title: string;
    type: string;
    workMode: string;
    locations: string[];
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string;
    salaryVisible: boolean;
    experienceMin: number | null;
    experienceMax: number | null;
    educationLevel: string;
    openings: number;
    deadline: Date | null;
    easyApply: boolean;
    applicationUrl: string | null;
    tags: string[];
    status: string;
    viewCount: number;
    applicationCount: number;
    companyId: string | null;
    companyName: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    companyRef?: { id: string; slug: string; name: string; logo: string | null; verified: boolean } | null;
    recruiter?: { name: string | null } | null;
    skills: { skill: { id: string; name: string }; required: boolean }[];
  }
) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    workMode: row.workMode,
    locations: row.locations,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    salaryCurrency: row.salaryCurrency,
    salaryVisible: row.salaryVisible,
    experienceMin: row.experienceMin,
    experienceMax: row.experienceMax,
    educationLevel: row.educationLevel,
    openings: row.openings,
    deadline: row.deadline,
    easyApply: row.easyApply,
    applicationUrl: row.applicationUrl,
    tags: row.tags,
    status: row.status,
    viewCount: row.viewCount,
    applicationCount: row.applicationCount,
    companyId: row.companyId,
    companyName: row.companyName,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    company: row.companyRef ? { id: row.companyRef.id, slug: row.companyRef.slug, name: row.companyRef.name, logo: row.companyRef.logo, verified: row.companyRef.verified } : null,
    recruiter: row.recruiter ? { name: row.recruiter.name } : null,
    skills: row.skills.map((s) => ({ skillId: s.skill.id, name: s.skill.name, required: s.required })),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const search = searchParams.get("search")?.trim();
  const location = searchParams.get("location")?.trim();
  const jobType = searchParams.get("jobType")?.split(",").filter(Boolean);
  const workMode = searchParams.get("workMode")?.split(",").filter(Boolean);
  const skills = searchParams.get("skills")?.split(",").filter(Boolean);
  const experienceMin = searchParams.get("experienceMin") != null ? parseInt(searchParams.get("experienceMin")!, 10) : undefined;
  const experienceMax = searchParams.get("experienceMax") != null ? parseInt(searchParams.get("experienceMax")!, 10) : undefined;
  const salaryMin = searchParams.get("salaryMin") != null ? parseInt(searchParams.get("salaryMin")!, 10) : undefined;
  const salaryMax = searchParams.get("salaryMax") != null ? parseInt(searchParams.get("salaryMax")!, 10) : undefined;
  const includeNotDisclosed = searchParams.get("includeNotDisclosed") === "true";
  const datePosted = (searchParams.get("datePosted") as "24h" | "7d" | "30d") || undefined;
  const easyApplyOnly = searchParams.get("easyApplyOnly") === "true";
  const companySlug = searchParams.get("companySlug")?.trim();
  const recruiterId = searchParams.get("recruiterId")?.trim();
  const minRating = searchParams.get("minRating") != null ? parseFloat(searchParams.get("minRating")!) : undefined;
  const verifiedOnly = searchParams.get("verifiedOnly") === "true";
  const sortParam = searchParams.get("sort");
  const sort = (sortParam === "salary" ? "salary" : sortParam === "relevance" ? "relevance" : "recent") as "recent" | "salary" | "relevance";
  let status = searchParams.get("status")?.trim();
  const similar = searchParams.get("similar") != null ? parseInt(searchParams.get("similar")!, 10) : undefined;

  if (status && status !== "ACTIVE" && !recruiterId) status = "ACTIVE";

  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user?.id;

  const searchParamsForCache = {
    page,
    limit,
    search: search ?? "",
    location: location ?? "",
    jobType: jobType ?? [],
    workMode: workMode ?? [],
    skills: skills ?? [],
    experienceMin,
    experienceMax,
    salaryMin,
    salaryMax,
    includeNotDisclosed,
    datePosted: datePosted ?? "",
    easyApplyOnly,
    companySlug: companySlug ?? "",
    minRating,
    verifiedOnly,
    sort,
    status: status ?? "",
    similar,
  };

  if (!isAuthenticated) {
    const cacheKey = searchCacheKey(searchParamsForCache);
    const cached = await getCachedSearch(cacheKey);
    if (cached && typeof cached === "object" && "data" in cached && "found" in cached) {
      return NextResponse.json({ success: true, ...(cached as { data: unknown; found: number; facets: unknown; page: number; totalPages: number }) });
    }
  }

  try {
    const result = await searchJobs({
      q: search ?? undefined,
      page,
      limit,
      location: location ?? undefined,
      jobType: jobType?.length ? jobType : undefined,
      workMode: workMode?.length ? workMode : undefined,
      skills: skills?.length ? skills : undefined,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      includeNotDisclosed,
      datePosted,
      easyApplyOnly,
      companySlug: companySlug ?? undefined,
      minRating,
      sort,
      verifiedOnly,
    });
    const ids = result.hits.map((h) => parseInt(h.id, 10));
    const jobs = ids.length > 0 ? await getJobsByIdsOrdered(ids) : [];
    const data = jobs.map((j) => serializeJob(j as Parameters<typeof serializeJob>[0]));
    const response = { success: true, data, found: result.found, facets: result.facets, page: result.page, totalPages: result.totalPages };
    if (!isAuthenticated) {
      const cacheKey = searchCacheKey(searchParamsForCache);
      setCachedSearch(cacheKey, { data, found: result.found, facets: result.facets, page: result.page, totalPages: result.totalPages }).catch(() => {});
    }
    return NextResponse.json(response);
  } catch (err) {
    console.warn("Typesense error, falling back to Prisma", err);
  }

  const filters: Parameters<typeof getJobsForListing>[0] = {
    page,
    limit,
    search: search ?? undefined,
    location: location ?? undefined,
    jobType: jobType?.length ? jobType : undefined,
    workMode: workMode?.length ? workMode : undefined,
    experienceMin,
    experienceMax,
    salaryMin,
    salaryMax,
    includeNotDisclosed,
    datePosted,
    easyApplyOnly,
    companySlug: companySlug ?? undefined,
    recruiterId: recruiterId ?? undefined,
    status: status || undefined,
    sort: sort === "relevance" ? "recent" : sort,
    similar,
  };
  const { jobs, total, nextCursor } = await getJobsForListing(filters);
  type JobWithInclude = (typeof jobs)[number] & {
    companyRef?: { id: string; slug: string; name: string; logo: string | null; verified: boolean } | null;
    recruiter?: { name: string | null } | null;
    skills: { skill: { id: string; name: string }; required: boolean }[];
  };
  const data = jobs.map((j) => serializeJob(j as JobWithInclude));
  const totalPages = Math.ceil(total / limit) || 1;
  return NextResponse.json({
    success: true,
    data,
    found: total,
    facets: {},
    page,
    totalPages,
    nextCursor,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role as string;
  if (role !== "RECRUITER" && role !== "COMPANY_ADMIN") {
    return NextResponse.json({ success: false, error: "RECRUITER or COMPANY_ADMIN role required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const input = parsed.data;

  if (input.status === "ACTIVE" && input.companyId) {
    const { checkJobPostLimit } = await import("@/lib/payments/gate");
    const { allowed, current, limit } = await checkJobPostLimit(input.companyId);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Active job post limit reached for your plan",
          code: "JOB_LIMIT_EXCEEDED",
          current,
          limit,
        },
        { status: 402 }
      );
    }
  }

  const description = sanitizeRichText(input.description) || input.description;

  const job = await prisma.jobPost.create({
    data: {
      title: input.title,
      slug: "temp",
      description,
      type: input.type,
      workMode: input.workMode,
      locations: input.locations,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      salaryCurrency: input.salaryCurrency ?? "INR",
      salaryVisible: input.salaryVisible ?? true,
      experienceMin: input.experienceMin ?? null,
      experienceMax: input.experienceMax ?? null,
      educationLevel: input.educationLevel ?? "ANY",
      openings: input.openings ?? 1,
      deadline: input.deadline ? new Date(input.deadline) : null,
      easyApply: input.easyApply ?? true,
      applicationUrl: input.easyApply ? null : (input.applicationUrl || null),
      tags: input.tags ?? [],
      status: input.status ?? "DRAFT",
      visibility: input.visibility ?? "PUBLIC",
      internalFirstDays: input.internalFirstDays ?? null,
      allowAnonymousApply: input.allowAnonymousApply ?? false,
      companyId: input.companyId || null,
      companyName: input.companyName || null,
      recruiterId: session.user.id,
    },
  });

  const slug = jobSlug(job.title, job.id);
  await prisma.jobPost.update({
    where: { id: job.id },
    data: { slug },
  });

  if (input.status === "ACTIVE") {
    await prisma.jobPost.update({
      where: { id: job.id },
      data: { publishedAt: new Date() },
    });
  }

  try {
    const { actorIp, actorAgent } = getRequestContext(req);
    await logAudit({
      actorId: session.user.id,
      actorRole: role,
      actorIp: actorIp ?? undefined,
      actorAgent: actorAgent ?? undefined,
      category: "DATA_MUTATION",
      action: AUDIT_ACTIONS.JOB_POST_CREATED,
      severity: "INFO",
      targetType: "JobPost",
      targetId: String(job.id),
      metadata: { jobId: job.id, status: input.status ?? "DRAFT" },
    });
  } catch {
    // non-blocking
  }
  if (input.skills?.length) {
    await prisma.jobPostSkill.createMany({
      data: input.skills.map((s) => ({ jobPostId: job.id, skillId: s.skillId, required: s.required })),
    });
  }
  if (input.screeningQuestions?.length) {
    await prisma.jobScreeningQuestion.createMany({
      data: input.screeningQuestions.map((q, i) => ({
        jobPostId: job.id,
        question: q.question,
        type: q.type,
        options: q.options ?? [],
        required: q.required ?? true,
        order: q.order ?? i,
      })),
    });
  }

  const full = await prisma.jobPost.findUnique({
    where: { id: job.id },
    include: { companyRef: { select: { slug: true, verified: true } }, skills: { include: { skill: { select: { name: true } } } }, screeningQuestions: true },
  });
  if (input.status === "ACTIVE" && full && (full as { visibility?: string }).visibility === "PUBLIC") {
    const companyRating = full.companyId ? (await import("@/lib/companies/ratings").then((m) => m.getCompanyRatingAggregate(full.companyId!))) : null;
    indexJob(
      {
        ...full,
        companyRef: full.companyRef ?? undefined,
        skills: full.skills,
      },
      companyRating?.overallAvg ?? null
    );
    if (full.companyId) {
      const { emitSignal } = await import("@/lib/signals/emit");
      const followers = await prisma.companyFollow.findMany({
        where: { companyId: full.companyId },
        select: { userId: true },
      });
      await emitSignal({
        type: "NEW_JOB_AT_FOLLOW",
        companyId: full.companyId,
        jobPostId: full.id,
        audienceUserIds: followers.map((f) => f.userId),
        metadata: { jobTitle: full.title, companyName: full.companyName ?? undefined },
      });
    }
  }
  return NextResponse.json({ success: true, data: { ...full, slug } }, { status: 201 });
}
