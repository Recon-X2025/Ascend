import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/prisma/client";
import { checkJobPostLimit } from "@/lib/payments/gate";
import { logAudit } from "@/lib/audit/log";
import { jobSlug } from "@/lib/jobs/slug";
import { queueWebhookDeliveries } from "@/lib/api/webhooks";

const querySchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "DRAFT"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  location: z.string().optional(),
  department: z.string().optional(),
});

const statusMap = { OPEN: ["ACTIVE"], CLOSED: ["CLOSED"], DRAFT: ["DRAFT"] } as const;

export async function GET(request: Request) {
  return withApiAuth(request, "jobs:read", async (req, { apiKey }) => {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
      search: searchParams.get("search") ?? undefined,
      location: searchParams.get("location") ?? undefined,
      department: searchParams.get("department") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { status, page, limit, search, location, department } = parsed.data;

    const where: Record<string, unknown> = { companyId: apiKey.companyId };
    if (status) {
      const statuses = statusMap[status];
      where.status = { in: statuses };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (location) {
      where.locations = { has: location };
    }
    if (department) {
      where.tags = { has: department };
    }

    const [jobs, total] = await Promise.all([
      prisma.jobPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          type: true,
          workMode: true,
          locations: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.jobPost.count({ where }),
    ]);

    return NextResponse.json({
      data: jobs,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  });
}

const createBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  location: z.string().optional(),
  department: z.string().optional(),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE", "TEMPORARY"]).default("FULL_TIME"),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  currency: z.string().default("INR"),
});

export async function POST(request: Request) {
  return withApiAuth(request, "jobs:write", async (req, { apiKey }) => {
    const { allowed, current, limit } = await checkJobPostLimit(apiKey.companyId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Job post limit exceeded", current, limit },
        { status: 402 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = createBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;

    // Get first company admin as recruiter (required by JobPost)
    const admin = await prisma.companyAdmin.findFirst({
      where: { companyId: apiKey.companyId },
      select: { userId: true },
    });
    if (!admin) {
      return NextResponse.json({ error: "No company admin found" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: apiKey.companyId },
      select: { name: true },
    });

    const tempSlug = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const job = await prisma.jobPost.create({
      data: {
        slug: tempSlug,
        title: input.title,
        description: input.description,
        type: input.type,
        workMode: "HYBRID",
        locations: input.location ? [input.location] : [],
        salaryMin: input.salaryMin ?? null,
        salaryMax: input.salaryMax ?? null,
        salaryCurrency: input.currency,
        companyId: apiKey.companyId,
        companyName: company?.name ?? null,
        recruiterId: admin.userId,
        tags: input.department ? [input.department] : [],
        status: "DRAFT",
        visibility: "PUBLIC",
      },
    });

    await prisma.jobPost.update({
      where: { id: job.id },
      data: { slug: jobSlug(job.title, job.id) },
    });

    const updated = await prisma.jobPost.findUnique({
      where: { id: job.id },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        type: true,
        workMode: true,
        locations: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        status: true,
        createdAt: true,
      },
    });

    await logAudit({
      actorId: admin.userId,
      category: "DATA_MUTATION",
      action: "API_JOB_CREATED",
      targetType: "JobPost",
      targetId: String(job.id),
      metadata: { companyId: apiKey.companyId, source: "api_v1" },
    });

    queueWebhookDeliveries(apiKey.companyId, "job.created", {
      jobId: updated?.id,
      slug: updated?.slug,
      title: updated?.title,
    }).catch(() => {});

    return NextResponse.json({ data: updated });
  });
}
