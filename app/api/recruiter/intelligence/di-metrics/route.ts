import { NextResponse } from "next/server";
import type { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { requireRecruiterSession } from "@/lib/recruiter-intelligence/auth";
import { canManageJob } from "@/lib/jobs/permissions";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";

const MIN_RECORDS = 10;
const STAGE_MAP = {
  APPLIED: ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFERED", "REJECTED"],
  SHORTLISTED: ["SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFERED"],
  HIRED: ["OFFERED"],
} as const;

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

  const job = await prisma.jobPost.findUnique({
    where: { id: jobPostId },
    select: { companyId: true },
  });
  if (!job?.companyId) {
    return NextResponse.json({ enabled: false });
  }
  const company = await prisma.company.findUnique({
    where: { id: job.companyId },
    select: { diMetricsEnabled: true },
  });
  if (!company?.diMetricsEnabled) {
    return NextResponse.json({ enabled: false });
  }

  const stages: Array<{
    stage: string;
    locationDistribution: Record<string, number>;
    educationDistribution: Record<string, number>;
    genderDistribution: Record<string, number> | null;
    totalCount: number;
  }> = [];

  for (const [stageName, statuses] of Object.entries(STAGE_MAP)) {
    const applications = await prisma.jobApplication.findMany({
      where: { jobPostId, status: { in: [...statuses] as ApplicationStatus[] } },
      select: {
        applicantId: true,
        applicant: {
          select: {
            jobSeekerProfile: {
              select: {
                city: true,
                educations: { select: { degree: true }, take: 1, orderBy: { endYear: "desc" } },
              },
            },
          },
        },
      },
    });

    if (applications.length < MIN_RECORDS) {
      return NextResponse.json({ insufficient: true, message: `Minimum ${MIN_RECORDS} records per stage required` });
    }

    const locationDistribution: Record<string, number> = {};
    const educationDistribution: Record<string, number> = {};
    for (const app of applications) {
      const city = app.applicant?.jobSeekerProfile?.city?.trim() || "Not specified";
      locationDistribution[city] = (locationDistribution[city] ?? 0) + 1;
      const degree = app.applicant?.jobSeekerProfile?.educations?.[0]?.degree?.trim() || "Not specified";
      educationDistribution[degree] = (educationDistribution[degree] ?? 0) + 1;
    }
    stages.push({
      stage: stageName,
      locationDistribution,
      educationDistribution,
      genderDistribution: null,
      totalCount: applications.length,
    });
  }

  return NextResponse.json({
    enabled: true,
    jobPostId,
    stages,
  });
}

export async function PATCH(req: Request) {
  const auth = await requireRecruiterSession();
  if ("error" in auth) return auth.error;
  if (auth.role !== "COMPANY_ADMIN") {
    return NextResponse.json({ success: false, error: "Only company admins can enable D&I metrics" }, { status: 403 });
  }

  let body: { companyId?: string; enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const { companyId, enabled } = body;
  if (!companyId || typeof enabled !== "boolean") {
    return NextResponse.json({ success: false, error: "companyId and enabled (boolean) required" }, { status: 400 });
  }
  const isAdmin = await isCompanyOwnerOrAdmin(auth.userId, companyId);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { diMetricsEnabled: enabled },
  });
  return NextResponse.json({ enabled });
}
