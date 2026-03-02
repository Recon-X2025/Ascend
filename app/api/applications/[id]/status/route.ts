import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { canManageJob } from "@/lib/jobs/permissions";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { sendStatusUpdateEmail } from "@/lib/applications/emails";
import { notifyApplicationStatusChanged } from "@/lib/notifications/create";
import type { ApplicationStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["INTERVIEW_SCHEDULED", "REJECTED"],
  INTERVIEW_SCHEDULED: ["OFFERED", "REJECTED"],
  OFFERED: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = (await params).id;
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    include: {
      jobPost: { select: { id: true, recruiterId: true, companyId: true, title: true, companyName: true, slug: true } },
      applicant: { select: { id: true, email: true } },
    },
  });
  const applicantEmail = app?.applicant?.email;

  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  const canManage = await canManageJob(session.user.id, app.jobPostId);
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (app.status === "WITHDRAWN") {
    return NextResponse.json(
      { error: "Cannot change status of withdrawn application" },
      { status: 400 }
    );
  }

  let body: { status?: ApplicationStatus; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newStatus = body.status;
  const notes = typeof body.notes === "string" ? body.notes.trim() : null;
  const allowed = newStatus && VALID_TRANSITIONS[app.status]?.includes(newStatus);

  if (newStatus && !allowed) {
    return NextResponse.json(
      { error: "Invalid status transition" },
      { status: 400 }
    );
  }

  const recruiterNotesAppend =
    notes !== null && notes !== ""
      ? (app.recruiterNotes ? app.recruiterNotes + "\n\n" + notes : notes)
      : app.recruiterNotes;

  const timeline = Array.isArray(app.applicationTimeline) ? (app.applicationTimeline as { status: string; at: string }[]) : [];
  const newEntry = newStatus ? { status: newStatus, at: new Date().toISOString() } : null;
  const updatedTimeline = newEntry ? [...timeline, newEntry] : undefined;

  const updated = await prisma.jobApplication.update({
    where: { id },
    data: {
      ...(newStatus ? { status: newStatus, statusUpdatedAt: new Date() } : {}),
      ...(recruiterNotesAppend !== undefined ? { recruiterNotes: recruiterNotesAppend } : {}),
      ...(updatedTimeline ? { applicationTimeline: updatedTimeline } : {}),
    },
    include: {
      jobPost: { select: { id: true, title: true, slug: true, companyName: true } },
      resumeVersion: { select: { id: true, name: true } },
    },
  });

  if (newStatus) {
    if (applicantEmail && (newStatus === "SHORTLISTED" || newStatus === "OFFERED")) {
      const outcome = newStatus === "OFFERED" ? "HIRED" : "SHORTLISTED";
      await prisma.jobReferral
        .updateMany({
          where: { jobPostId: app.jobPostId, referredEmail: applicantEmail.toLowerCase() },
          data: { outcome: outcome as "SHORTLISTED" | "HIRED", updatedAt: new Date() },
        })
        .catch(() => {});
    }
    sendStatusUpdateEmail({
      to: app.applicant?.email ?? "",
      jobTitle: app.jobPost.title,
      companyName: app.jobPost.companyName ?? "Company",
      newStatus,
    });
    const companyName = app.jobPost.companyName ?? "Company";
    await notifyApplicationStatusChanged(
      app.applicantId,
      companyName,
      app.jobPost.title,
      newStatus.replace(/_/g, " ").toLowerCase()
    );
    trackOutcome(session.user.id, "APPLICATION_STATUS_CHANGED", {
      entityId: app.id,
      entityType: "JobApplication",
      metadata: {
        applicationId: app.id,
        oldStatus: app.status,
        newStatus,
        jobPostId: app.jobPostId,
      },
    });
  }

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    statusUpdatedAt: updated.statusUpdatedAt.toISOString(),
    recruiterNotes: updated.recruiterNotes,
  });
}
