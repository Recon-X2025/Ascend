import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import { profileLanguageSchema } from "@/lib/validations/profile";
import type { FullProfile } from "@/lib/profile/completion";

async function auth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  return getSessionUserId();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const profile = await getProfileOrThrow(userId);
  const item = await prisma.profileLanguage.findFirst({ where: { id, profileId: profile.id } });
  if (!item) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const parsed = profileLanguageSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;
  const updated = await prisma.profileLanguage.update({
    where: { id },
    data: { language: d.language, proficiency: d.proficiency },
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
  const item = await prisma.profileLanguage.findFirst({ where: { id, profileId: profile.id } });
  if (!item) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  await prisma.profileLanguage.delete({ where: { id } });
  const fullProfile = await prisma.jobSeekerProfile.findUnique({ where: { id: profile.id }, include: profileInclude });
  if (fullProfile) {
    const result = calculateCompletionScore(fullProfile as FullProfile);
    await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { completionScore: result.total } });
  }
  return NextResponse.json({ success: true });
}
