import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import { experienceSchema } from "@/lib/validations/profile";
import type { FullProfile } from "@/lib/profile/completion";

async function getExperienceAndProfile(userId: string, id: string) {
  const profile = await getProfileOrThrow(userId);
  const exp = await prisma.experience.findFirst({
    where: { id, profileId: profile.id },
  });
  return { profile, exp };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { profile, exp } = await getExperienceAndProfile(userId, id);
  if (!exp) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const body = await req.json();
  const parsed = experienceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const data = parsed.data;
  const updated = await prisma.experience.update({
    where: { id },
    data: {
      company: data.company,
      designation: data.designation,
      employmentType: data.employmentType,
      location: data.location ?? undefined,
      workMode: data.workMode ?? undefined,
      startMonth: data.startMonth,
      startYear: data.startYear,
      endMonth: data.isCurrent ? undefined : (data.endMonth ?? undefined),
      endYear: data.isCurrent ? undefined : (data.endYear ?? undefined),
      isCurrent: data.isCurrent,
      description: data.description ?? undefined,
      achievements: data.achievements ?? [],
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { profile, exp } = await getExperienceAndProfile(userId, id);
  if (!exp) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  await prisma.experience.delete({ where: { id } });
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
