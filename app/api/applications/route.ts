import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { ApplicationStatus } from "@prisma/client";

const VALID_STATUSES: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "OFFERED",
  "REJECTED",
  "WITHDRAWN",
];

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "JOB_SEEKER") {
    return NextResponse.json({ applications: [], total: 0, page: 1, totalPages: 0 });
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10)));

  const where: { applicantId: string; status?: ApplicationStatus } = {
    applicantId: session.user.id,
  };
  if (statusParam && VALID_STATUSES.includes(statusParam as ApplicationStatus)) {
    where.status = statusParam as ApplicationStatus;
  }

  const [applications, total, statusCounts] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        jobPost: {
          select: {
            id: true,
            title: true,
            slug: true,
            companyName: true,
            companyId: true,
            companyRef: { select: { id: true, name: true, logo: true } },
          },
        },
        resumeVersion: { select: { id: true, name: true } },
      },
    }),
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.groupBy({
      by: ["status"],
      where: { applicantId: session.user.id },
      _count: true,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const statusCountsMap: Record<string, number> = {};
  for (const s of statusCounts) {
    statusCountsMap[s.status] = s._count;
  }

  const data = applications.map((a) => ({
    id: a.id,
    jobPostId: a.jobPostId,
    jobTitle: a.jobPost.title,
    jobSlug: a.jobPost.slug,
    companyName: a.jobPost.companyRef?.name ?? a.jobPost.companyName ?? null,
    companyLogo: a.jobPost.companyRef?.logo ?? null,
    resumeVersion: a.resumeVersion ? { id: a.resumeVersion.id, name: a.resumeVersion.name } : null,
    submittedAt: a.submittedAt.toISOString(),
    status: a.status,
    fitScoreSnapshot: a.fitScoreSnapshot,
  }));

  return NextResponse.json({
    applications: data,
    total,
    page,
    totalPages,
    statusCounts: statusCountsMap,
  });
}
