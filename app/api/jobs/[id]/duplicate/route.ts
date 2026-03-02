import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { jobSlug } from "@/lib/jobs/slug";
import { canManageJob } from "@/lib/jobs/permissions";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function POST(req: Request, { params }: Params) {
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

  const source = await prisma.jobPost.findUnique({
    where: { id },
    include: { skills: true, screeningQuestions: true },
  });
  if (!source) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  }

  const newTitle = `${source.title} (Copy)`;
  const created = await prisma.jobPost.create({
    data: {
      title: newTitle,
      slug: "temp",
      description: source.description,
      type: source.type,
      workMode: source.workMode,
      locations: source.locations,
      salaryMin: source.salaryMin,
      salaryMax: source.salaryMax,
      salaryCurrency: source.salaryCurrency,
      salaryVisible: source.salaryVisible,
      experienceMin: source.experienceMin,
      experienceMax: source.experienceMax,
      educationLevel: source.educationLevel,
      openings: source.openings,
      deadline: source.deadline,
      easyApply: source.easyApply,
      applicationUrl: source.applicationUrl,
      tags: source.tags,
      status: "DRAFT",
      viewCount: 0,
      applicationCount: 0,
      companyId: source.companyId,
      companyName: source.companyName,
      recruiterId: source.recruiterId,
    },
  });

  const slug = jobSlug(created.title, created.id);
  await prisma.jobPost.update({ where: { id: created.id }, data: { slug } });

  if (source.skills.length > 0) {
    await prisma.jobPostSkill.createMany({
      data: source.skills.map((s) => ({ jobPostId: created.id, skillId: s.skillId, required: s.required })),
    });
  }
  if (source.screeningQuestions.length > 0) {
    await prisma.jobScreeningQuestion.createMany({
      data: source.screeningQuestions.map((q) => ({
        jobPostId: created.id,
        question: q.question,
        type: q.type,
        options: q.options,
        required: q.required,
        order: q.order,
      })),
    });
  }

  const full = await prisma.jobPost.findUnique({
    where: { id: created.id },
    include: { companyRef: true, skills: { include: { skill: true } }, screeningQuestions: true },
  });
  return NextResponse.json({ success: true, data: full }, { status: 201 });
}
