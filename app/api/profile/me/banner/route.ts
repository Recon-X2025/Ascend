import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { storeFile, generateStorageKey, removeFile } from "@/lib/storage";

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: "File must be 4MB or less" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ success: false, error: "Only JPG, PNG, and WebP are allowed" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const key = generateStorageKey("banners", userId, `banner-${Date.now()}.${ext}`);
  await storeFile(key, buffer, file.type);
  const oldKey = profile.bannerUrl;
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { bannerUrl: key },
  });
  if (oldKey) await removeFile(oldKey).catch(() => {});
  return NextResponse.json({ success: true, data: { bannerUrl: key } });
}
