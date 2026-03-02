import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { privacyUpdateSchema } from "@/lib/validations/profile";
import type { ProfileVisibility, ResumeVisibility } from "@prisma/client";

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  const parsed = privacyUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const data: {
    visibility?: ProfileVisibility;
    hideFromCompanies?: string[];
    defaultResumeVisibility?: ResumeVisibility;
  } = {};
  if (parsed.data.visibility !== undefined) data.visibility = parsed.data.visibility as ProfileVisibility;
  if (parsed.data.hideFromCompanies !== undefined) data.hideFromCompanies = parsed.data.hideFromCompanies;
  if (parsed.data.defaultResumeVisibility !== undefined)
    data.defaultResumeVisibility = parsed.data.defaultResumeVisibility as ResumeVisibility;
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data,
  });
  return NextResponse.json({ success: true });
}
