import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { validateUsername, isUsernameTaken } from "@/lib/profile/username";
import { z } from "zod";

const bodySchema = z.object({ username: z.string().min(1).max(30) });

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const raw = parsed.data.username.trim();
  const validation = validateUsername(raw);
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }
  const username = raw.toLowerCase();
  const taken = await isUsernameTaken(username, profile.id);
  if (taken) {
    return NextResponse.json({ success: false, error: "Username is already taken" }, { status: 400 });
  }
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { username },
  });
  return NextResponse.json({ success: true, data: { username } });
}
