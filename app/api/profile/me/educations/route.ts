import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import { educationSchema } from "@/lib/validations/profile";
import type { FullProfile } from "@/lib/profile/completion";

async function ensureAuth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  const userId = await getSessionUserId();
  if (!userId) return null;
  return userId;
}

export async function GET() {
  const userId = await ensureAuth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  return NextResponse.json({ success: true, data: profile.educations });
}

export async function POST(req: Request) {
  const userId = await ensureAuth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  const body = await req.json();
  const parsed = educationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const data = parsed.data;
  const maxOrder = profile.educations.length ? Math.max(...profile.educations.map((e) => e.order)) : -1;
  const created = await prisma.education.create({
    data: {
      profileId: profile.id,
      institution: data.institution,
      degree: data.degree ?? undefined,
      fieldOfStudy: data.fieldOfStudy ?? undefined,
      startYear: data.startYear ?? undefined,
      endYear: data.endYear ?? undefined,
      isCurrent: data.isCurrent,
      grade: data.grade ?? undefined,
      activities: data.activities ?? undefined,
      description: data.description ?? undefined,
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
