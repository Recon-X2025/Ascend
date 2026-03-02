import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { isEnabled } from "@/lib/feature-flags";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { track, EVENTS } from "@/lib/analytics/track";
import { sendApplicationConfirmation, sendNewApplicationAlertToRecruiter } from "@/lib/applications/emails";
import { logAudit } from "@/lib/audit/log";
import { getRequestContext } from "@/lib/audit/context";
import { queueWebhookDeliveries } from "@/lib/api/webhooks";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import type { ScreeningResponse } from "@/lib/applications/types";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

const COVER_LETTER_MAX = 2000;

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as { role?: string }).role;
    if (role !== "JOB_SEEKER") {
      return NextResponse.json({ error: "Only job seekers can apply" }, { status: 403 });
    }
    if (!(await isEnabled("easy_apply_enabled"))) {
      return NextResponse.json({ error: "Easy Apply is temporarily disabled" }, { status: 503 });
    }

    const jobId = parseId((await params).id);
    if (jobId == null) {
      return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }

    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        screeningQuestions: { orderBy: { order: "asc" } },
        recruiter: { select: { email: true } },
      },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.status !== "ACTIVE") {
      return NextResponse.json({ error: "Job is not accepting applications" }, { status: 400 });
    }
    if (!job.easyApply) {
      return NextResponse.json({ error: "This job does not accept Easy Apply" }, { status: 400 });
    }

    const existing = await prisma.jobApplication.findUnique({
      where: { jobPostId_applicantId: { jobPostId: jobId, applicantId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already applied to this job" },
        { status: 409 }
      );
    }

    const urlRef = new URL(req.url).searchParams.get("ref");
    let body: {
      resumeVersionId?: string | null;
      coverLetter?: string | null;
      coverLetterId?: string | null;
      responses?: ScreeningResponse[];
      ref?: string | null;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const referralId = body.ref ?? urlRef ?? null;

    let coverLetter: string | null =
      body.coverLetter != null && typeof body.coverLetter === "string"
        ? body.coverLetter.slice(0, COVER_LETTER_MAX)
        : null;
    let coverLetterId: string | null = null;
    if (body.coverLetterId != null && typeof body.coverLetterId === "string" && body.coverLetterId.trim() !== "") {
      const cl = await prisma.coverLetter.findFirst({
        where: { id: body.coverLetterId!.trim(), userId: session.user.id, jobPostId: jobId },
        select: { id: true, content: true },
      });
      if (cl) {
        coverLetterId = cl.id;
        if (!coverLetter) coverLetter = cl.content;
      }
    }

    const responses = Array.isArray(body.responses) ? body.responses : [];
    const requiredIds = job.screeningQuestions.filter((q) => q.required).map((q) => q.id);
    const answeredIds = new Set(responses.map((r: ScreeningResponse) => r.questionId));
    for (const id of requiredIds) {
      if (!answeredIds.has(id)) {
        return NextResponse.json(
          { error: "All required screening questions must be answered" },
          { status: 400 }
        );
      }
    }

    let resumeVersionId: string | null = null;
    if (body.resumeVersionId != null && body.resumeVersionId !== "") {
      const rv = await prisma.resumeVersion.findFirst({
        where: {
          id: body.resumeVersionId,
          userId: session.user.id,
          status: "COMPLETE",
        },
      });
      if (rv) resumeVersionId = rv.id;
    }

    const fitScoreRow = await prisma.fitScore.findUnique({
      where: {
        userId_jobPostId: { userId: session.user.id, jobPostId: jobId },
      },
      select: { overallScore: true },
    });
    const fitScoreSnapshot = fitScoreRow?.overallScore ?? null;

    const allowAnonymous = (job as { allowAnonymousApply?: boolean }).allowAnonymousApply ?? false;
    const now = new Date().toISOString();
    const [app] = await prisma.$transaction([
      prisma.jobApplication.create({
        data: {
          jobPostId: jobId,
          applicantId: session.user.id,
          resumeVersionId,
          coverLetter,
          coverLetterId,
          responses: responses.length > 0 ? (responses as object) : Prisma.JsonNull,
          fitScoreSnapshot,
          applicationTimeline: [{ status: "SUBMITTED", at: now }],
          isAnonymous: allowAnonymous,
        },
      }),
      prisma.jobPost.update({
        where: { id: jobId },
        data: { applicationCount: { increment: 1 } },
      }),
    ]);

    if (referralId && typeof referralId === "string") {
      await prisma.jobReferral
        .updateMany({
          where: { id: referralId, jobPostId: jobId },
          data: { outcome: "APPLIED", updatedAt: new Date() },
        })
        .catch(() => {});
    }

    const applicant = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    const companyName = job.companyName ?? "Company";

    sendApplicationConfirmation({
      to: applicant?.email ?? "",
      jobTitle: job.title,
      companyName,
      submittedAt: app.submittedAt,
    });

    if (job.recruiter?.email) {
      const applicantName = allowAnonymous ? "Anonymous Applicant" : (session.user.name ?? "An applicant");
      sendNewApplicationAlertToRecruiter({
        to: job.recruiter.email,
        jobTitle: job.title,
        applicantName,
        fitScore: fitScoreSnapshot,
        jobId,
      });
    }

    trackOutcome(session.user.id, "APPLICATION_SUBMITTED", {
      entityId: app.id,
      entityType: "JobApplication",
      metadata: {
        jobPostId: jobId,
        resumeVersionId: resumeVersionId ?? undefined,
        fitScoreSnapshot,
        hasScreeningResponses: responses.length > 0,
        hasCoverLetter: !!coverLetter || !!coverLetterId,
      },
    });

    if (job.companyId) {
      queueWebhookDeliveries(job.companyId, "application.created", {
      applicationId: app.id,
      jobPostId: jobId,
      jobTitle: job.title,
      applicantId: session.user.id,
      }).catch(() => {});
    }
    const jobVisibility = (job as { visibility?: string }).visibility;
    if (jobVisibility === "INTERNAL") {
      trackOutcome(session.user.id, "INTERNAL_JOB_APPLIED", {
        entityId: app.id,
        entityType: "JobApplication",
        metadata: { jobPostId: jobId },
      }).catch(() => {});
    }
    try {
      const { actorIp, actorAgent } = getRequestContext(req);
      await logAudit({
        actorId: session.user.id,
        actorRole: role,
        actorIp: actorIp ?? undefined,
        actorAgent: actorAgent ?? undefined,
        category: "DATA_MUTATION",
        action: AUDIT_ACTIONS.APPLICATION_SUBMITTED,
        severity: "INFO",
        targetType: "JobApplication",
        targetId: String(app.id),
        metadata: { jobPostId: jobId, applicationId: app.id },
      });
    } catch {
      // non-blocking
    }

    track(EVENTS.JOB_APPLIED, { jobId }, { userId: session.user.id, persona: (session.user as { persona?: string }).persona }).catch(() => {});
    if (coverLetterId) {
      track(EVENTS.COVER_LETTER_ATTACHED_TO_APPLICATION, { jobId, coverLetterId }, { userId: session.user.id }).catch(() => {});
    }

    return NextResponse.json({
      id: app.id,
      status: "SUBMITTED",
      message: "Application submitted successfully.",
    });
  } catch (e) {
    console.error("[Apply]", e);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
