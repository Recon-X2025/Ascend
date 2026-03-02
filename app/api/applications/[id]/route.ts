import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { canManageJob } from "@/lib/jobs/permissions";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const id = (await params).id;
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    select: { id: true, jobPostId: true },
  });
  if (!app) {
    return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
  }
  const canManage = await canManageJob(session.user.id, app.jobPostId);
  if (!canManage) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  let body: { recruiterNotes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.recruiterNotes !== "string") {
    return NextResponse.json({ success: false, error: "recruiterNotes required" }, { status: 400 });
  }
  const updated = await prisma.jobApplication.update({
    where: { id },
    data: { recruiterNotes: body.recruiterNotes.trim() || null },
  });
  return NextResponse.json({
    id: updated.id,
    recruiterNotes: updated.recruiterNotes,
  });
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const id = (await params).id;
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    include: {
      jobPost: {
        select: {
          id: true,
          title: true,
          slug: true,
          companyName: true,
          companyRef: { select: { name: true } },
        },
      },
      resumeVersion: { select: { id: true, name: true } },
      applicant: {
        select: {
          name: true,
          jobSeekerProfile: { select: { headline: true, username: true } },
        },
      },
    },
  });

  if (!app) {
    return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
  }

  const canManage = await canManageJob(session.user.id, app.jobPostId);

  if (app.applicantId === session.user.id) {
    return NextResponse.json({
      id: app.id,
      jobPostId: app.jobPostId,
      jobTitle: app.jobPost.title,
      jobSlug: app.jobPost.slug,
      companyName: app.jobPost.companyRef?.name ?? app.jobPost.companyName,
      resumeVersion: app.resumeVersion,
      coverLetter: app.coverLetter,
      responses: app.responses,
      status: app.status,
      statusUpdatedAt: app.statusUpdatedAt.toISOString(),
      fitScoreSnapshot: app.fitScoreSnapshot,
      submittedAt: app.submittedAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    });
  }

  if (canManage) {
    return NextResponse.json({
      id: app.id,
      applicantName: app.applicant?.name ?? null,
      applicantHeadline: app.applicant?.jobSeekerProfile?.headline ?? null,
      applicantProfileUrl: app.applicant?.jobSeekerProfile?.username
        ? `/profile/${app.applicant.jobSeekerProfile.username}`
        : null,
      coverLetter: app.coverLetter,
      responses: app.responses,
      resumeVersion: app.resumeVersion,
      fitScoreSnapshot: app.fitScoreSnapshot,
      submittedAt: app.submittedAt.toISOString(),
      status: app.status,
      recruiterNotes: app.recruiterNotes,
    });
  }

  return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
}
