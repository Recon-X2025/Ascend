import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getSimilarJobs, jobDetailInclude, getCompanyRatingForJob } from "@/lib/jobs/queries";
import { track, EVENTS } from "@/lib/analytics/track";
import { sanitizeRichText } from "@/lib/html/sanitize";
import { updateJobSchema } from "@/lib/validations/job";
import { canManageJob } from "@/lib/jobs/permissions";
import { jobSlug } from "@/lib/jobs/slug";
import { indexJob, removeJob } from "@/lib/search/sync/jobs";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function GET(req: Request, { params }: Params) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id == null) {
    return NextResponse.json({ success: false, error: "Invalid job id" }, { status: 400 });
  }

  const job = await prisma.jobPost.findUnique({
    where: { id },
    include: jobDetailInclude,
  });
  if (!job) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const canSeeAllStatuses = session?.user?.id && (await canManageJob(session.user.id, id));
  if (job.status !== "ACTIVE" && !canSeeAllStatuses) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  }

  prisma.jobPost.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  if (session?.user?.id) {
    track(EVENTS.JOB_VIEWED, { jobId: id }, { userId: session.user.id, persona: (session.user as { persona?: string }).persona ?? undefined }).catch(() => {});
  }

  const ratingAgg = job.companyId ? await getCompanyRatingForJob(job.companyId) : null;
  const similarJobs = await getSimilarJobs(id, 6);

  const data = {
    ...job,
    companyRating: ratingAgg,
    similarJobs: similarJobs.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      type: s.type,
      workMode: s.workMode,
      locations: s.locations,
      salaryVisible: s.salaryVisible,
      salaryMin: s.salaryMin,
      salaryMax: s.salaryMax,
      salaryCurrency: s.salaryCurrency,
      companyName: s.companyName,
      company: "companyRef" in s ? (s as { companyRef: unknown }).companyRef : null,
      publishedAt: s.publishedAt,
    })),
  };

  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id == null) {
    return NextResponse.json({ success: false, error: "Invalid job id" }, { status: 400 });
  }

  const allowed = await canManageJob(session.user.id, id);
  if (!allowed) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const input = parsed.data;

  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.companyId !== undefined) update.companyId = input.companyId;
  if (input.companyName !== undefined) update.companyName = input.companyName;
  if (input.type !== undefined) update.type = input.type;
  if (input.workMode !== undefined) update.workMode = input.workMode;
  if (input.locations !== undefined) update.locations = input.locations;
  if (input.salaryMin !== undefined) update.salaryMin = input.salaryMin;
  if (input.salaryMax !== undefined) update.salaryMax = input.salaryMax;
  if (input.salaryCurrency !== undefined) update.salaryCurrency = input.salaryCurrency;
  if (input.salaryVisible !== undefined) update.salaryVisible = input.salaryVisible;
  if (input.experienceMin !== undefined) update.experienceMin = input.experienceMin;
  if (input.experienceMax !== undefined) update.experienceMax = input.experienceMax;
  if (input.educationLevel !== undefined) update.educationLevel = input.educationLevel;
  if (input.openings !== undefined) update.openings = input.openings;
  if (input.deadline !== undefined) update.deadline = input.deadline ? new Date(input.deadline) : null;
  if (input.easyApply !== undefined) update.easyApply = input.easyApply;
  if (input.applicationUrl !== undefined) update.applicationUrl = input.applicationUrl || null;
  if (input.tags !== undefined) update.tags = input.tags;
  if (input.status !== undefined) update.status = input.status;
  if (input.description !== undefined) update.description = sanitizeRichText(input.description) || input.description;
  if (input.visibility !== undefined) update.visibility = input.visibility;
  if (input.internalFirstDays !== undefined) update.internalFirstDays = input.internalFirstDays;
  if (input.allowAnonymousApply !== undefined) update.allowAnonymousApply = input.allowAnonymousApply;

  const existing = await prisma.jobPost.findUnique({ where: { id }, select: { publishedAt: true, title: true, visibility: true } });
  if (input.status === "ACTIVE" && existing && !existing.publishedAt) {
    (update as Record<string, unknown>).publishedAt = new Date();
  }
  if (input.title !== undefined && existing) {
    (update as Record<string, unknown>).slug = jobSlug(input.title, id);
  }

  await prisma.jobPost.update({ where: { id }, data: update });

  if (input.skills !== undefined) {
    await prisma.jobPostSkill.deleteMany({ where: { jobPostId: id } });
    if (input.skills.length > 0) {
      await prisma.jobPostSkill.createMany({
        data: input.skills.map((s) => ({ jobPostId: id, skillId: s.skillId, required: s.required })),
      });
    }
  }
  if (input.screeningQuestions !== undefined) {
    await prisma.jobScreeningQuestion.deleteMany({ where: { jobPostId: id } });
    if (input.screeningQuestions.length > 0) {
      await prisma.jobScreeningQuestion.createMany({
        data: input.screeningQuestions.map((q, i) => ({
          jobPostId: id,
          question: q.question,
          type: q.type,
          options: q.options ?? [],
          required: q.required ?? true,
          order: q.order ?? i,
        })),
      });
    }
  }

  const updated = await prisma.jobPost.findUnique({
    where: { id },
    include: jobDetailInclude,
  });
  const newStatus = (update.status as string) ?? updated?.status;
  const newVisibility = (update.visibility as string) ?? (updated as { visibility?: string })?.visibility;
  if (newStatus === "CLOSED" || newStatus === "PAUSED" || newVisibility !== "PUBLIC") {
    removeJob(id);
  }
  if (updated && newStatus === "ACTIVE" && newVisibility === "PUBLIC") {
    const companyRating = updated.companyId ? await getCompanyRatingForJob(updated.companyId) : null;
    indexJob(
      {
        ...updated,
        companyRef: updated.companyRef ?? undefined,
        skills: updated.skills ?? [],
      },
      companyRating?.overallAvg ?? null
    );
    if (updated.companyId) {
      const { emitSignal } = await import("@/lib/signals/emit");
      const followers = await prisma.companyFollow.findMany({
        where: { companyId: updated.companyId },
        select: { userId: true },
      });
      await emitSignal({
        type: "NEW_JOB_AT_FOLLOW",
        companyId: updated.companyId,
        jobPostId: updated.id,
        audienceUserIds: followers.map((f) => f.userId),
        metadata: { jobTitle: updated.title, companyName: updated.companyName ?? undefined },
      });
    }
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id == null) {
    return NextResponse.json({ success: false, error: "Invalid job id" }, { status: 400 });
  }

  const allowed = await canManageJob(session.user.id, id);
  if (!allowed) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.jobPost.update({ where: { id }, data: { status: "CLOSED" } });
  removeJob(id);
  return NextResponse.json({ success: true });
}
