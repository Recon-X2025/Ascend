import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { storeFile, generateStorageKey, removeFile } from "@/lib/storage";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import type { FullProfile } from "@/lib/profile/completion";

const MAX_RESUMES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

async function auth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  return getSessionUserId();
}

export async function GET() {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  return NextResponse.json({ success: true, data: profile.resumes });
}

export async function POST(req: Request) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  if (profile.resumes.length >= MAX_RESUMES) {
    return NextResponse.json({ success: false, error: "Maximum 5 resumes allowed" }, { status: 400 });
  }
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const label = (formData.get("label") as string) || "Resume";
  const visibilityFromBody = formData.get("visibility") as "PUBLIC" | "RECRUITERS_ONLY" | "PRIVATE" | null;
  const visibility = visibilityFromBody ?? profile.defaultResumeVisibility ?? "RECRUITERS_ONLY";
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ success: false, error: "File must be 5MB or less" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ success: false, error: "Only PDF, DOC, and DOCX are allowed" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateStorageKey("resumes", userId, file.name);
  await storeFile(key, buffer, file.type);
  const isFirst = profile.resumes.length === 0;
  const created = await prisma.resume.create({
    data: {
      profileId: profile.id,
      label: label.slice(0, 200),
      storageKey: key,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      visibility,
      isDefault: isFirst,
    },
  });
  try {
    const updated = await prisma.jobSeekerProfile.findUnique({ where: { id: profile.id }, include: profileInclude });
    if (updated) {
      const result = calculateCompletionScore(updated as FullProfile);
      await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { completionScore: result.total } });
    }
  } catch {
    await removeFile(key);
    await prisma.resume.delete({ where: { id: created.id } }).catch(() => {});
    throw new Error("Failed to update profile");
  }
  return NextResponse.json({ success: true, data: created });
}
