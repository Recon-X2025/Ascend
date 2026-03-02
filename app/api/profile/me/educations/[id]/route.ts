import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import { educationSchema } from "@/lib/validations/profile";
import type { FullProfile } from "@/lib/profile/completion";

async function ensureAuth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  return getSessionUserId();
}

async function getEducationAndProfile(userId: string, id: string) {
  const profile = await getProfileOrThrow(userId);
  const item = await prisma.education.findFirst({ where: { id, profileId: profile.id } });
  return { profile, item };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await ensureAuth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { profile, item } = await getEducationAndProfile(userId, id);
  if (!item) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const body = await req.json();
  const parsed = educationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const data = parsed.data;
  const updated = await prisma.education.update({
    where: { id },
    data: {
      institution: data.institution,
      degree: data.degree ?? undefined,
      fieldOfStudy: data.fieldOfStudy ?? undefined,
      startYear: data.startYear ?? undefined,
      endYear: data.endYear ?? undefined,
      isCurrent: data.isCurrent,
      grade: data.grade ?? undefined,
      activities: data.activities ?? undefined,
      description: data.description ?? undefined,
    },
  });
  const fullProfile = await prisma.jobSeekerProfile.findUnique({
    where: { id: profile.id },
    include: profileInclude,
  });
  if (fullProfile) {
    const result = calculateCompletionScore(fullProfile as FullProfile);
    await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { completionScore: result.total },
    });
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await ensureAuth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { profile, item } = await getEducationAndProfile(userId, id);
  if (!item) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  await prisma.education.delete({ where: { id } });
  const fullProfile = await prisma.jobSeekerProfile.findUnique({
    where: { id: profile.id },
    include: profileInclude,
  });
  if (fullProfile) {
    const result = calculateCompletionScore(fullProfile as FullProfile);
    await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { completionScore: result.total },
    });
  }
  return NextResponse.json({ success: true });
}
