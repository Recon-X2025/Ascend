import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireRecruiterSession } from "@/lib/recruiter-intelligence/auth";
import { canManageJob } from "@/lib/jobs/permissions";

const STAGE_ORDER = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "OFFERED",
] as const;

export async function GET(req: Request) {
  const auth = await requireRecruiterSession();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const jobPostIdParam = url.searchParams.get("jobPostId");
  if (!jobPostIdParam) {
    return NextResponse.json({ success: false, error: "jobPostId is required" }, { status: 400 });
  }
  const jobPostId = parseInt(jobPostIdParam, 10);
  if (Number.isNaN(jobPostId)) {
    return NextResponse.json({ success: false, error: "Invalid jobPostId" }, { status: 400 });
  }
  const canManage = await canManageJob(auth.userId, jobPostId);
  if (!canManage) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const [job, statusCounts, platformAgg] = await Promise.all([
    prisma.jobPost.findUnique({
      where: { id: jobPostId },
      select: { id: true, title: true },
    }),
    prisma.jobApplication.groupBy({
      by: ["status"],
      where: { jobPostId },
      _count: true,
    }),
    prisma.jobApplication.groupBy({
      by: ["status"],
      where: {
        jobPost: {
          companyId: { not: null },
          status: "ACTIVE",
          id: { not: jobPostId },
        },
      },
      _count: true,
    }),
  ]);

  if (!job) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  }

  const countByStatus: Record<string, number> = {};
  for (const row of statusCounts) {
    countByStatus[row.status] = row._count;
  }
  const platformByStatus: Record<string, number> = {};
  for (const row of platformAgg) {
    platformByStatus[row.status] = row._count;
  }

  const stages: Array<{
    stage: string;
    count: number;
    dropOffPct: number | null;
    suggestion: string | null;
  }> = [];
  let prevCount: number | null = null;
  for (let i = 0; i < STAGE_ORDER.length; i++) {
    const stage = STAGE_ORDER[i];
    const count = countByStatus[stage] ?? 0;
    let dropOffPct: number | null = null;
    let suggestion: string | null = null;
    if (prevCount !== null && prevCount > 0) {
      dropOffPct = Math.round(((prevCount - count) / prevCount) * 100);
      if (i === 1 && dropOffPct > 50) {
        suggestion =
          "More than half of applicants were never reviewed. Consider updating the JD requirements to pre-filter better.";
      } else if (i === 2 && dropOffPct > 70) {
        suggestion =
          "High view-to-shortlist drop suggests JD may be attracting off-target candidates.";
      } else if (i === 3 && dropOffPct > 60) {
        suggestion =
          "Scheduling friction may be causing candidate drop-off at interview stage.";
      }
    }
    stages.push({ stage, count, dropOffPct, suggestion });
    prevCount = count;
  }

  const platformBenchmark = STAGE_ORDER.map((stage, i) => {
    const prev = i === 0 ? 0 : (platformByStatus[STAGE_ORDER[i - 1]] ?? 0);
    const curr = platformByStatus[stage] ?? 0;
    const avgDropOffPct = prev > 0 ? Math.round(((prev - curr) / prev) * 100) : 0;
    return { stage, avgDropOffPct };
  });

  return NextResponse.json({
    jobPostId: job.id,
    jobTitle: job.title,
    stages,
    platformBenchmark,
  });
}
