import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/prisma/client";

const querySchema = z.object({
  jobId: z.coerce.number().int().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: Request) {
  return withApiAuth(request, "applications:read", async (req, { apiKey }) => {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      jobId: searchParams.get("jobId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { jobId, status, page, limit } = parsed.data;

    const where: Record<string, unknown> = {
      jobPost: { companyId: apiKey.companyId },
    };
    if (jobId) where.jobPostId = jobId;
    if (status) where.status = status;

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          jobPostId: true,
          status: true,
          submittedAt: true,
          updatedAt: true,
          applicant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          jobPost: {
            select: { title: true },
          },
        },
      }),
      prisma.jobApplication.count({ where }),
    ]);

    const data = applications.map((a) => ({
      id: a.id,
      jobPostId: a.jobPostId,
      jobTitle: a.jobPost.title,
      status: a.status,
      submittedAt: a.submittedAt,
      updatedAt: a.updatedAt,
      candidateName: a.applicant.name,
      candidateEmail: a.applicant.email,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  });
}
