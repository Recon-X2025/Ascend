import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import { experienceSchema } from "@/lib/validations/profile";
import type { FullProfile } from "@/lib/profile/completion";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  return NextResponse.json({ success: true, data: profile.experiences });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  const body = await req.json();
  const parsed = experienceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const data = parsed.data;
  const maxOrder = profile.experiences.length ? Math.max(...profile.experiences.map((e) => e.order)) : -1;
  const created = await prisma.experience.create({
    data: {
      profileId: profile.id,
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
      order: maxOrder + 1,
    },
  });
  const updated = await prisma.jobSeekerProfile.findUnique({
    where: { id: profile.id },
    include: profileInclude,
  });
  if (updated) {
    const result = calculateCompletionScore(updated as FullProfile);
    await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { completionScore: result.total },
    });
  }
  return NextResponse.json({ success: true, data: created });
}
