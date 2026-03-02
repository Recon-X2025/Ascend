import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/prisma/client";
import { queueWebhookDeliveries } from "@/lib/api/webhooks";

const updateBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  location: z.string().optional(),
  department: z.string().optional(),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE", "TEMPORARY"]).optional(),
  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().min(0).optional().nullable(),
  currency: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "CLOSED"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, "jobs:read", async (_req, { apiKey }) => {
    const { id } = await params;
    const jobId = parseInt(id, 10);
    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const job = await prisma.jobPost.findFirst({
      where: { id: jobId, companyId: apiKey.companyId },
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

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ data: job });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, "jobs:write", async (req, { apiKey }) => {
    const { id } = await params;
    const jobId = parseInt(id, 10);
    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const existing = await prisma.jobPost.findFirst({
      where: { id: jobId, companyId: apiKey.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = updateBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (parsed.data.title != null) update.title = parsed.data.title;
    if (parsed.data.description != null) update.description = parsed.data.description;
    if (parsed.data.type != null) update.type = parsed.data.type;
    if (parsed.data.salaryMin !== undefined) update.salaryMin = parsed.data.salaryMin;
    if (parsed.data.salaryMax !== undefined) update.salaryMax = parsed.data.salaryMax;
    if (parsed.data.currency != null) update.salaryCurrency = parsed.data.currency;
    if (parsed.data.status != null) update.status = parsed.data.status;
    if (parsed.data.location != null) update.locations = [parsed.data.location];
    if (parsed.data.department != null) update.tags = [parsed.data.department];

    const prevStatus = existing.status;
    const job = await prisma.jobPost.update({
      where: { id: jobId },
      data: update,
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

    if (parsed.data.status === "CLOSED" && prevStatus !== "CLOSED") {
      queueWebhookDeliveries(apiKey.companyId, "job.closed", {
        jobId,
        slug: job.slug,
        title: job.title,
      }).catch(() => {});
    }

    return NextResponse.json({ data: job });
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, "jobs:write", async (_req, { apiKey }) => {
    const { id } = await params;
    const jobId = parseInt(id, 10);
    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const existing = await prisma.jobPost.findFirst({
      where: { id: jobId, companyId: apiKey.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.jobPost.update({
      where: { id: jobId },
      data: { status: "CLOSED" },
    });

    queueWebhookDeliveries(apiKey.companyId, "job.closed", {
      jobId,
      slug: existing.slug,
      title: existing.title,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  });
}
