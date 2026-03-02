import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { canManageJob } from "@/lib/jobs/permissions";
import type { ApplicationStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

const STATUSES: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "OFFERED",
  "REJECTED",
  "WITHDRAWN",
];

export async function GET(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = parseId((await params).id);
  if (jobId == null) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }
  const canManage = await canManageJob(session.user.id, jobId);
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const sort = url.searchParams.get("sort") === "fitScore" ? "fitScore" : "date";

  const where: { jobPostId: number; status?: ApplicationStatus } = { jobPostId: jobId };
  if (statusParam && STATUSES.includes(statusParam as ApplicationStatus)) {
    where.status = statusParam as ApplicationStatus;
  }

  const orderBy =
    sort === "fitScore"
      ? [{ fitScoreSnapshot: "desc" as const }, { submittedAt: "desc" as const }]
      : { submittedAt: "desc" as const };

  const [applications, total, statusCounts] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
            jobSeekerProfile: {
              select: {
                headline: true,
                city: true,
                state: true,
                country: true,
                username: true,
              },
            },
          },
        },
        resumeVersion: { select: { id: true, name: true } },
      },
    }),
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.groupBy({
      by: ["status"],
      where: { jobPostId: jobId },
      _count: true,
    }),
  ]);

  const statusCountsMap: Record<string, number> = {};
  for (const s of statusCounts) {
    statusCountsMap[s.status] = s._count;
  }
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const revealStatuses: ApplicationStatus[] = ["SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFERED"];
  const applicationsList = applications.map((a) => {
    const isAnonymous = (a as { isAnonymous?: boolean }).isAnonymous ?? false;
    const shouldMask = isAnonymous && !revealStatuses.includes(a.status);
    return {
      id: a.id,
      applicantId: a.applicantId,
      applicantName: shouldMask ? "Anonymous Applicant" : (a.applicant.name ?? "Applicant"),
      applicantAvatar: shouldMask ? null : a.applicant.image,
      applicantHeadline: shouldMask ? null : (a.applicant.jobSeekerProfile?.headline ?? null),
      applicantLocation: shouldMask
        ? null
        : [a.applicant.jobSeekerProfile?.city, a.applicant.jobSeekerProfile?.state, a.applicant.jobSeekerProfile?.country]
            .filter(Boolean)
            .join(", ") || null,
      applicantProfileUrl: shouldMask ? null : (a.applicant.jobSeekerProfile?.username ? `/profile/${a.applicant.jobSeekerProfile.username}` : null),
      resumeVersion: a.resumeVersion,
      coverLetter: a.coverLetter,
      responses: a.responses,
      fitScoreSnapshot: a.fitScoreSnapshot,
      submittedAt: a.submittedAt.toISOString(),
      status: a.status,
      statusUpdatedAt: a.statusUpdatedAt.toISOString(),
      recruiterNotes: a.recruiterNotes,
      isAnonymous,
    };
  });

  return NextResponse.json({
    applications: applicationsList,
    total,
    found: applicationsList.length,
    page,
    totalPages,
    statusCounts: statusCountsMap,
  });
}
