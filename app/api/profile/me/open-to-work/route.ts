import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { openToWorkSchema } from "@/lib/validations/profile";

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  const parsed = openToWorkSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { prisma } = await import("@/lib/prisma/client");
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: {
      openToWork: parsed.data.openToWork,
      openToWorkVisibility: parsed.data.visibility,
    },
  });
  return NextResponse.json({ success: true, data: { openToWork: parsed.data.openToWork, visibility: parsed.data.visibility } });
}
