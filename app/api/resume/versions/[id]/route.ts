import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const version = await prisma.resumeVersion.findFirst({
    where: { id, userId },
    include: {
      careerIntent: { select: { id: true, targetRole: true, targetIndustry: true } },
      jobPost: { select: { id: true, title: true, companyName: true, companyId: true } },
    },
  });
  if (!version) {
    return NextResponse.json({ success: false, error: "Resume version not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: version });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.resumeVersion.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Resume version not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const data: {
    name?: string;
    templateId?: string | null;
    contentSnapshot?: object;
    atsScore?: number | null;
    status?: "DRAFT" | "COMPLETE";
    isDefault?: boolean;
    lastUpdatedAt: Date;
  } = { lastUpdatedAt: new Date() };
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.templateId !== undefined) data.templateId = body.templateId === null ? null : String(body.templateId);
  if (body.contentSnapshot !== undefined && body.contentSnapshot !== null) data.contentSnapshot = body.contentSnapshot as object;
  if (body.atsScore !== undefined) data.atsScore = body.atsScore === null ? null : Number(body.atsScore);
  if (body.status === "DRAFT" || body.status === "COMPLETE") data.status = body.status;
  if (typeof body.isDefault === "boolean") {
    data.isDefault = body.isDefault;
    if (body.isDefault) {
      await prisma.resumeVersion.updateMany({
        where: { userId, id: { not: id } },
        data: { isDefault: false },
      });
    }
  }
  const version = await prisma.resumeVersion.update({
    where: { id },
    data,
    include: {
      careerIntent: { select: { id: true, targetRole: true, targetIndustry: true } },
      jobPost: { select: { id: true, title: true, companyName: true, companyId: true } },
    },
  });
  return NextResponse.json({ success: true, data: version });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.resumeVersion.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Resume version not found" }, { status: 404 });
  }
  // TODO Phase 6: count JobApplication where resumeVersionId = id and return applicationCount for UI warning
  const applicationCount = 0;
  await prisma.resumeVersion.delete({ where: { id } });
  return NextResponse.json({ success: true, data: { applicationCount } });
}
