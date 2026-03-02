import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const [activeJobs, recentApplications, pipelineSummary] = await Promise.all([
    prisma.jobPost.findMany({
      where: { recruiterId: session.user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        deadline: true,
        _count: { select: { jobApplications: true } },
      },
    }),

    prisma.jobApplication.findMany({
      where: { jobPost: { recruiterId: session.user.id } },
      orderBy: { submittedAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        submittedAt: true,
        applicant: { select: { name: true, image: true } },
        jobPost: { select: { id: true, title: true, slug: true } },
      },
    }),

    prisma.jobApplication.groupBy({
      by: ["status"],
      where: { jobPost: { recruiterId: session.user.id } },
      _count: { status: true },
    }),
  ]);

  const pipeline = Object.fromEntries(
    pipelineSummary.map((p) => [p.status, p._count.status])
  );

  const recentWithUser = recentApplications.map((app) => ({
    id: app.id,
    status: app.status,
    createdAt: app.submittedAt,
    user: app.applicant,
    jobPost: app.jobPost,
  }));

  const activeJobsWithCount = activeJobs.map((j) => ({
    ...j,
    applications: j._count.jobApplications,
  }));

  return NextResponse.json({
    activeJobs: activeJobsWithCount,
    recentApplications: recentWithUser,
    pipeline,
  });
}
