import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { getProfileOrNull } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { careerIntentSchema } from "@/lib/validations/career-intent";

export async function GET() {
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
  const intents = await prisma.careerIntent.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { resumeVersions: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ success: true, data: intents });
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
  const body = await req.json();
  const parsed = careerIntentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const intent = await prisma.careerIntent.create({
    data: {
      userId,
      profileId: profile.id,
      targetRole: data.targetRole.trim(),
      targetIndustry: data.targetIndustry.trim(),
      targetLevel: data.targetLevel,
      careerGoal: data.careerGoal.trim(),
      switchingIndustry: data.switchingIndustry,
      fromIndustry: data.switchingIndustry ? (data.fromIndustry?.trim() ?? null) : null,
      toIndustry: data.switchingIndustry ? (data.toIndustry?.trim() ?? null) : null,
    },
    include: { resumeVersions: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ success: true, data: intent }, { status: 201 });
}
