import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { getProfileOrNull } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { getPlanForUser, isAtResumeVersionLimit } from "@/lib/subscription";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;
  const source = await prisma.resumeVersion.findFirst({
    where: { id, userId },
  });
  if (!source) {
    return NextResponse.json({ success: false, error: "Resume version not found" }, { status: 404 });
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
  const newName = `${source.name} Copy`.trim();
  const duplicate = await prisma.resumeVersion.create({
    data: {
      userId,
      careerIntentId: source.careerIntentId,
      name: newName,
      templateId: source.templateId,
      contentSnapshot: source.contentSnapshot as object | undefined,
      atsScore: source.atsScore,
      status: source.status,
      isDefault: false,
      // Do not copy jobPostId — duplicate is a new generic version
    },
    include: {
      careerIntent: { select: { id: true, targetRole: true, targetIndustry: true } },
      jobPost: { select: { id: true, title: true, companyName: true, companyId: true } },
    },
  });
  return NextResponse.json({ success: true, data: duplicate }, { status: 201 });
}
