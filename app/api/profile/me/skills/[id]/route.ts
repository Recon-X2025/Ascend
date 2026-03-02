import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import { z } from "zod";
import type { FullProfile } from "@/lib/profile/completion";

async function auth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  return getSessionUserId();
}

const patchSchema = z.object({ proficiency: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERT"]).optional(), order: z.number().int().min(0).optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const profile = await getProfileOrThrow(userId);
  const item = await prisma.userSkill.findFirst({ where: { id, profileId: profile.id }, include: { skill: true } });
  if (!item) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const updated = await prisma.userSkill.update({
    where: { id },
    data: { proficiency: parsed.data.proficiency, order: parsed.data.order },
    include: { skill: { select: { name: true } } },
  });
  const fullProfile = await prisma.jobSeekerProfile.findUnique({ where: { id: profile.id }, include: profileInclude });
  if (fullProfile) {
    const result = calculateCompletionScore(fullProfile as FullProfile);
    await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { completionScore: result.total } });
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const profile = await getProfileOrThrow(userId);
  const item = await prisma.userSkill.findFirst({ where: { id, profileId: profile.id } });
  if (!item) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  await prisma.userSkill.delete({ where: { id } });
  const fullProfile = await prisma.jobSeekerProfile.findUnique({ where: { id: profile.id }, include: profileInclude });
  if (fullProfile) {
    const result = calculateCompletionScore(fullProfile as FullProfile);
    await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { completionScore: result.total } });
  }
  return NextResponse.json({ success: true });
}
