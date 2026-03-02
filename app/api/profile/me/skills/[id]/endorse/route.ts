import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const profile = await getProfileOrThrow(userId);
  const userSkill = await prisma.userSkill.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!userSkill) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (profile.userId === userId) {
    return NextResponse.json({ success: false, error: "You cannot endorse your own skill" }, { status: 400 });
  }
  if (userSkill.endorsedBy.includes(userId)) {
    return NextResponse.json({ success: true, data: { endorsed: true, endorseCount: userSkill.endorseCount } });
  }
  const updated = await prisma.userSkill.update({
    where: { id },
    data: {
      endorsedBy: [...userSkill.endorsedBy, userId],
      endorseCount: { increment: 1 },
    },
  });
  return NextResponse.json({ success: true, data: { endorsed: true, endorseCount: updated.endorseCount } });
}
