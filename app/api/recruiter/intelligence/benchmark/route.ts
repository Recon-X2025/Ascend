import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireRecruiterSession } from "@/lib/recruiter-intelligence/auth";
import { canManageJob } from "@/lib/jobs/permissions";

export async function GET(req: Request) {
  const auth = await requireRecruiterSession();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const jobPostIdParam = url.searchParams.get("jobPostId");
  if (!jobPostIdParam) {
    return NextResponse.json({ error: "jobPostId is required" }, { status: 400 });
  }
  const jobPostId = parseInt(jobPostIdParam, 10);
  if (Number.isNaN(jobPostId)) {
    return NextResponse.json({ error: "Invalid jobPostId" }, { status: 400 });
  }
  const canManage = await canManageJob(auth.userId, jobPostId);
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: jobPostId },
    select: {
      id: true,
      title: true,
      salaryMin: true,
      salaryMax: true,
      workMode: true,
      companyId: true,
      _count: { select: { skills: true } },
    },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const [appStats, platformJobs] = await Promise.all([
    prisma.jobApplication.aggregate({
      where: { jobPostId },
      _count: true,
      _avg: { fitScoreSnapshot: true },
    }),
    prisma.jobPost.findMany({
      where: {
        title: { equals: job.title, mode: "insensitive" },
        companyId: { not: job.companyId },
        status: "ACTIVE",
        updatedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        companyId: true,
        salaryMin: true,
        salaryMax: true,
        workMode: true,
        _count: { select: { skills: true } },
      },
    }),
  ]);

  const companyIds = new Set(platformJobs.map((j) => j.companyId).filter(Boolean));
  const benchmarkAvailable = platformJobs.length >= 5 && companyIds.size >= 3;

  const thisJob = {
    applicantCount: appStats._count,
    avgApplicantFitScore: appStats._avg.fitScoreSnapshot ?? 0,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    requirementCount: job._count.skills,
    workMode: job.workMode,
  };

  if (!benchmarkAvailable) {
    return NextResponse.json({
      thisJob,
      platformAvg: null,
      differentials: [],
      benchmarkAvailable: false,
    });
  }

  const platformAppCounts = await Promise.all(
    platformJobs.slice(0, 50).map((j) =>
      prisma.jobApplication.aggregate({
        where: { jobPostId: j.id },
        _count: true,
        _avg: { fitScoreSnapshot: true },
      })
    )
  );
  const avgApplicantCount =
    platformAppCounts.reduce((s, a) => s + a._count, 0) / platformAppCounts.length;
  const avgFit =
    platformAppCounts.reduce((s, a) => s + (a._avg.fitScoreSnapshot ?? 0), 0) /
    platformAppCounts.length;
  const avgSalaryMin =
    platformJobs.reduce((s, j) => s + (j.salaryMin ?? 0), 0) /
    platformJobs.filter((j) => j.salaryMin != null).length || null;
  const avgSalaryMax =
    platformJobs.reduce((s, j) => s + (j.salaryMax ?? 0), 0) /
    platformJobs.filter((j) => j.salaryMax != null).length || null;
  const avgReqCount =
    platformJobs.reduce((s, j) => s + j._count.skills, 0) / platformJobs.length;
  const workModeCounts: Record<string, number> = {};
  for (const j of platformJobs) {
    workModeCounts[j.workMode] = (workModeCounts[j.workMode] ?? 0) + 1;
  }
  const topWorkMode = Object.entries(workModeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "HYBRID";

  const platformAvg = {
    applicantCount: Math.round(avgApplicantCount),
    avgApplicantFitScore: Math.round(avgFit),
    salaryMin: avgSalaryMin != null ? Math.round(avgSalaryMin) : null,
    salaryMax: avgSalaryMax != null ? Math.round(avgSalaryMax) : null,
    requirementCount: Math.round(avgReqCount),
    workMode: topWorkMode,
  };

  const differentials: Array<{ metric: string; pctDifference: number; suggestion: string | null }> = [];
  const pct = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / b) * 100);
  if (platformAvg.applicantCount > 0) {
    const diff = pct(thisJob.applicantCount, platformAvg.applicantCount);
    differentials.push({
      metric: "applicantCount",
      pctDifference: diff,
      suggestion:
        diff <= -30
          ? "Applicant count is 30%+ below platform average. Check salary, location, and requirement count."
          : null,
    });
  }
  if (platformAvg.avgApplicantFitScore > 0) {
    const diff = pct(thisJob.avgApplicantFitScore, platformAvg.avgApplicantFitScore);
    differentials.push({
      metric: "avgApplicantFitScore",
      pctDifference: diff,
      suggestion:
        diff <= -15
          ? "Avg fit score of applicants is 15+ pts below platform. JD may be unclear or requirement count too high."
          : null,
    });
  }
  if (platformAvg.requirementCount > 0) {
    differentials.push({
      metric: "requirementCount",
      pctDifference: pct(thisJob.requirementCount, platformAvg.requirementCount),
      suggestion: null,
    });
  }
  if (platformAvg.salaryMin != null && thisJob.salaryMin != null) {
    differentials.push({
      metric: "salaryMin",
      pctDifference: pct(thisJob.salaryMin, platformAvg.salaryMin),
      suggestion: null,
    });
  }
  if (platformAvg.salaryMax != null && thisJob.salaryMax != null) {
    differentials.push({
      metric: "salaryMax",
      pctDifference: pct(thisJob.salaryMax, platformAvg.salaryMax),
      suggestion: null,
    });
  }

  return NextResponse.json({
    thisJob,
    platformAvg,
    differentials,
    benchmarkAvailable: true,
  });
}
