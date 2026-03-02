import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { resumeUpdateSchema } from "@/lib/validations/profile";

async function auth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  return getSessionUserId();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const profile = await getProfileOrThrow(userId);
  const resume = await prisma.resume.findFirst({ where: { id, profileId: profile.id } });
  if (!resume) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const parsed = resumeUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const data = parsed.data;
  if (data.isDefault === true) {
    await prisma.resume.updateMany({ where: { profileId: profile.id }, data: { isDefault: false } });
  }
  const updated = await prisma.resume.update({
    where: { id },
    data: {
      ...(data.label !== undefined && { label: data.label }),
      ...(data.visibility !== undefined && { visibility: data.visibility }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
    },
  });
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const profile = await getProfileOrThrow(userId);
  const resume = await prisma.resume.findFirst({ where: { id, profileId: profile.id } });
  if (!resume) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const { removeFile } = await import("@/lib/storage");
  await removeFile(resume.storageKey).catch(() => {});
  await prisma.resume.delete({ where: { id } });
  const { profileInclude } = await import("@/lib/profile/queries");
  const { calculateCompletionScore } = await import("@/lib/profile/completion");
  const fullProfile = await prisma.jobSeekerProfile.findUnique({ where: { id: profile.id }, include: profileInclude });
  if (fullProfile) {
    const result = calculateCompletionScore(fullProfile as import("@/lib/profile/completion").FullProfile);
    await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { completionScore: result.total } });
  }
  return NextResponse.json({ success: true });
}
