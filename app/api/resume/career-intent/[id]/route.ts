import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { careerIntentSchema } from "@/lib/validations/career-intent";

async function getIntentAndCheckAuth(id: string) {
  const userId = await getSessionUserId();
  if (!userId) return { status: 401 as const, body: { success: false, error: "Unauthorized" } };
  const intent = await prisma.careerIntent.findUnique({
    where: { id },
    include: { resumeVersions: { select: { id: true, name: true } } },
  });
  if (!intent) return { status: 404 as const, body: { success: false, error: "Career intent not found" } };
  if (intent.userId !== userId) return { status: 403 as const, body: { success: false, error: "Forbidden" } };
  return { intent, userId };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getIntentAndCheckAuth(id);
  if ("status" in result) {
    return NextResponse.json(result.body, { status: result.status });
  }
  const { intent } = result;
  const body = await req.json();
  const parsed = careerIntentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const updated = await prisma.careerIntent.update({
    where: { id: intent.id },
    data: {
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
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getIntentAndCheckAuth(id);
  if ("status" in result) {
    return NextResponse.json(result.body, { status: result.status });
  }
  await prisma.careerIntent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
