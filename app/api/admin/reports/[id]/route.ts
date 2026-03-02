import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { sendReportResolvedEmail } from "@/lib/email/templates/report-resolved";
import { z } from "zod";
import type { ReportStatus } from "@prisma/client";

const updateReportSchema = z.object({
  status: z.enum([
    "UNDER_REVIEW",
    "RESOLVED_ACTION_TAKEN",
    "RESOLVED_NO_ACTION",
    "DISMISSED",
  ]),
  resolution: z.string().max(2000).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const report = await prisma.userReport.findUnique({
    where: { id },
  });
  if (!report) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const status = parsed.data.status as ReportStatus;
  const resolution = parsed.data.resolution?.trim() ?? null;
  if (status === "RESOLVED_ACTION_TAKEN" && !resolution) {
    return NextResponse.json(
      { error: "Resolution note is required when taking action" },
      { status: 400 }
    );
  }

  if (status === "RESOLVED_ACTION_TAKEN") {
    if (report.targetType === "JOB_POST") {
      const jobId = parseInt(report.targetId, 10);
      if (!Number.isNaN(jobId)) {
        await prisma.jobPost.update({
          where: { id: jobId },
          data: { status: "CLOSED" },
        });
      }
    }
    if (report.targetType === "COMPANY_REVIEW") {
      await prisma.companyReview.update({
        where: { id: report.targetId },
        data: {
          status: "REJECTED",
          rejectionReason: resolution ?? "Removed after report resolution",
          moderatedAt: new Date(),
          moderatedById: session.user.id,
        },
      });
    }
    if (report.targetType === "USER_PROFILE" || report.targetType === "MENTOR_PROFILE") {
      const userId = report.targetId;
      await prisma.user.update({
        where: { id: userId },
        data: { updatedAt: new Date() },
      });
      // Flag for review: logged via audit; no dedicated "flagged" field
    }
  }

  const updated = await prisma.userReport.update({
    where: { id },
    data: {
      status,
      resolution,
      resolvedBy: session.user.id,
      resolvedAt: new Date(),
    },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "REPORT_RESOLVED",
    targetType: "UserReport",
    targetId: id,
    metadata: {
      reportId: id,
      status,
      targetType: report.targetType,
      targetId: report.targetId,
      resolution: resolution ?? undefined,
    },
  });

  if (status === "RESOLVED_ACTION_TAKEN") {
    trackOutcome(session.user.id, "PHASE17_COMPLIANCE_ACTION_TAKEN", {
      entityId: id,
      entityType: "UserReport",
      metadata: { targetType: report.targetType, targetId: report.targetId },
    }).catch(() => {});
    try {
      const reporter = await prisma.user.findUnique({
        where: { id: report.reporterId },
        select: { email: true, name: true },
      });
      if (reporter?.email) {
        await sendReportResolvedEmail(reporter.email, reporter.name ?? "User", id);
      }
    } catch {
      // non-blocking
    }
  }

  return NextResponse.json({
    success: true,
    report: {
      id: updated.id,
      status: updated.status,
      resolution: updated.resolution,
      resolvedAt: updated.resolvedAt?.toISOString() ?? null,
    },
  });
}
