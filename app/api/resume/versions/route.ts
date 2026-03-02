import { NextResponse } from "next/server";
import { getSessionUserId, getProfileOrNull } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { getPlanForUser, isAtResumeVersionLimit, getMaxResumeVersions } from "@/lib/subscription";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getProfileOrNull(userId);
  if (!profile) {
    return NextResponse.json(
      { success: false, error: "Job seeker profile required" },
      { status: 403 }
    );
  }
  const { searchParams } = new URL(req.url);
  const baseOnly = searchParams.get("baseOnly") === "true";
  const versions = await prisma.resumeVersion.findMany({
    where: baseOnly ? { userId, jobPostId: null } : { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    include: {
      careerIntent: { select: { id: true, targetRole: true, targetIndustry: true } },
      jobPost: { select: { id: true, title: true, companyName: true, companyId: true } },
    },
  });
  // TODO Phase 6: count JobApplication per version and attach applicationCount
  const data = versions.map((v) => ({ ...v, applicationCount: 0 }));
  const plan = getPlanForUser(userId);
  const maxVersions = getMaxResumeVersions(plan);
  const limitReached = isAtResumeVersionLimit(plan, versions.length);
  return NextResponse.json({
    success: true,
    data,
    meta: { plan, count: versions.length, maxVersions, limitReached },
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getProfileOrNull(userId);
  if (!profile) {
    return NextResponse.json(
      { success: false, error: "Job seeker profile required" },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const { careerIntentId, name } = body as { careerIntentId?: string; name?: string };
  if (!careerIntentId || typeof careerIntentId !== "string") {
    return NextResponse.json(
      { success: false, error: "careerIntentId is required" },
      { status: 400 }
    );
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { success: false, error: "name is required" },
      { status: 400 }
    );
  }
  const intent = await prisma.careerIntent.findUnique({
    where: { id: careerIntentId },
    select: { id: true, userId: true, targetRole: true },
  });
  if (!intent || intent.userId !== userId) {
    return NextResponse.json({ success: false, error: "Career intent not found" }, { status: 404 });
  }
  const plan = getPlanForUser(userId);
  const count = await prisma.resumeVersion.count({ where: { userId } });
  if (isAtResumeVersionLimit(plan, count)) {
    return NextResponse.json(
      {
        success: false,
        error: "Resume version limit reached",
        message: "Free tier allows up to 5 resume versions. Upgrade to Premium for unlimited.",
      },
      { status: 403 }
    );
  }
  const templateId = (body.templateId as string) || null;
  const version = await prisma.resumeVersion.create({
    data: {
      userId,
      careerIntentId,
      name: name.trim(),
      templateId: templateId || undefined,
      status: "DRAFT",
    },
    include: {
      careerIntent: { select: { id: true, targetRole: true, targetIndustry: true } },
      jobPost: { select: { id: true, title: true, companyName: true, companyId: true } },
    },
  });
  return NextResponse.json({ success: true, data: version }, { status: 201 });
}
