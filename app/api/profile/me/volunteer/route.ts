import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import { volunteerWorkSchema } from "@/lib/validations/profile";
import type { FullProfile } from "@/lib/profile/completion";

async function auth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  return getSessionUserId();
}

export async function GET() {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  return NextResponse.json({ success: true, data: profile.volunteerWork });
}

export async function POST(req: Request) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  const parsed = volunteerWorkSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;
  const maxOrder = profile.volunteerWork.length ? Math.max(...profile.volunteerWork.map((v) => v.order)) : -1;
  const created = await prisma.volunteerWork.create({
    data: {
      profileId: profile.id,
      organization: d.organization,
      role: d.role,
      cause: d.cause ?? undefined,
      startMonth: d.startMonth ?? undefined,
      startYear: d.startYear ?? undefined,
      endMonth: d.isCurrent ? undefined : (d.endMonth ?? undefined),
      endYear: d.isCurrent ? undefined : (d.endYear ?? undefined),
      isCurrent: d.isCurrent,
      description: d.description ?? undefined,
      order: maxOrder + 1,
    },
  });
  const updated = await prisma.jobSeekerProfile.findUnique({ where: { id: profile.id }, include: profileInclude });
  if (updated) {
    const result = calculateCompletionScore(updated as FullProfile);
    await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { completionScore: result.total } });
  }
  return NextResponse.json({ success: true, data: created });
}
