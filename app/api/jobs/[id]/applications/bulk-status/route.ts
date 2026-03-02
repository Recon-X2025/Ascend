import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { canManageJob } from "@/lib/jobs/permissions";
import { sendStatusUpdateEmail } from "@/lib/applications/emails";
import { trackOutcome } from "@/lib/tracking/outcomes";
import type { ApplicationStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

const ALLOWED_BULK_STATUSES: ApplicationStatus[] = ["SHORTLISTED", "REJECTED"];

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const jobId = parseId((await params).id);
  if (jobId == null) {
    return NextResponse.json({ success: false, error: "Invalid job id" }, { status: 400 });
  }
  const canManage = await canManageJob(session.user.id, jobId);
  if (!canManage) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  let body: { applicationIds?: string[]; status?: ApplicationStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const applicationIds = Array.isArray(body.applicationIds) ? body.applicationIds : [];
  const status = body.status;
  if (!status || !ALLOWED_BULK_STATUSES.includes(status)) {
    return NextResponse.json({ success: false, error: "Invalid status for bulk update" }, { status: 400 });
  }
  if (applicationIds.length === 0) {
    return NextResponse.json({ updated: 0, applications: [] });
  }

  const apps = await prisma.jobApplication.findMany({
    where: {
      id: { in: applicationIds.slice(0, 50) },
      jobPostId: jobId,
      status: { notIn: ["WITHDRAWN", "REJECTED", "OFFERED"] },
    },
    include: {
      jobPost: { select: { title: true, companyName: true } },
      applicant: { select: { email: true } },
    },
  });

  const ids = apps.map((a) => a.id);
  await prisma.jobApplication.updateMany({
    where: { id: { in: ids } },
    data: { status, statusUpdatedAt: new Date() },
  });

  for (const app of apps) {
    sendStatusUpdateEmail({
      to: app.applicant?.email ?? "",
      jobTitle: app.jobPost.title,
      companyName: app.jobPost.companyName ?? "Company",
      newStatus: status,
    });
    trackOutcome(session.user.id, "APPLICATION_STATUS_CHANGED", {
      entityId: app.id,
      entityType: "JobApplication",
      metadata: {
        applicationId: app.id,
        oldStatus: app.status,
        newStatus: status,
        jobPostId: jobId,
      },
    });
  }

  return NextResponse.json({
    updated: ids.length,
    applicationIds: ids,
  });
}
