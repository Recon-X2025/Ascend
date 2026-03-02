import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { storeFile, generateStorageKey, removeFile } from "@/lib/storage";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_SIZE = 256;

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
    return NextResponse.json({ success: false, error: "File must be 2MB or less" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ success: false, error: "Only JPG, PNG, and WebP are allowed" }, { status: 400 });
  }
  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  try {
    const sharp = await import("sharp");
    const resized = await sharp.default(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toBuffer();
    buffer = Buffer.from(resized);
  } catch {
    // Store as-is if sharp not available
  }
  const key = generateStorageKey("avatars", userId, `avatar-${Date.now()}.jpg`);
  await storeFile(key, buffer, "image/jpeg");
  const oldKey = profile.avatarUrl;
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { avatarUrl: key },
  });
  if (oldKey) await removeFile(oldKey).catch(() => {});
  return NextResponse.json({ success: true, data: { avatarUrl: key } });
}
