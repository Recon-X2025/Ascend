import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/prisma/client";
import { logAudit } from "@/lib/audit/log";
import { queueWebhookDeliveries } from "@/lib/api/webhooks";

const updateBodySchema = z.object({
  status: z.enum(["SHORTLISTED", "REJECTED", "INTERVIEW_SCHEDULED", "OFFERED", "HIRED"]),
});

// Map API status to schema (we have UNDER_REVIEW, not INTERVIEW - use INTERVIEW_SCHEDULED)
const statusMap: Record<string, string> = {
  SHORTLISTED: "SHORTLISTED",
  REJECTED: "REJECTED",
  INTERVIEW_SCHEDULED: "INTERVIEW_SCHEDULED",
  OFFERED: "OFFERED",
  HIRED: "HIRED",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, "applications:read", async (_req, { apiKey }) => {
    const { id } = await params;

    const app = await prisma.jobApplication.findFirst({
      where: {
        id,
        jobPost: { companyId: apiKey.companyId },
      },
      include: {
        applicant: { select: { id: true, name: true, email: true } },
        jobPost: { select: { title: true } },
      },
    });

    if (!app) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: app.id,
        jobPostId: app.jobPostId,
        jobTitle: app.jobPost.title,
        status: app.status,
        submittedAt: app.submittedAt,
        updatedAt: app.updatedAt,
        candidateName: app.applicant.name,
        candidateEmail: app.applicant.email,
        resumeUrl: null,
      },
    });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, "applications:write", async (req, { apiKey }) => {
    const { id } = await params;

    const existing = await prisma.jobApplication.findFirst({
      where: {
        id,
        jobPost: { companyId: apiKey.companyId },
      },
      include: { jobPost: { select: { title: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = updateBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const newStatus = statusMap[parsed.data.status] ?? parsed.data.status;

    await prisma.jobApplication.update({
      where: { id },
      data: { status: newStatus as "SHORTLISTED" | "REJECTED" | "INTERVIEW_SCHEDULED" | "OFFERED" | "HIRED" },
    });

    queueWebhookDeliveries(apiKey.companyId, "application.status_changed", {
      applicationId: id,
      from: existing?.status,
      to: newStatus,
      jobTitle: existing?.jobPost?.title,
    }).catch(() => {});

    await logAudit({
      category: "DATA_MUTATION",
      action: "API_APPLICATION_STATUS_UPDATED",
      targetType: "JobApplication",
      targetId: id,
      metadata: { companyId: apiKey.companyId, from: existing.status, to: newStatus, source: "api_v1" },
    });

    return NextResponse.json({ success: true });
  });
}
