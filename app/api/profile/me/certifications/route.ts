import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import { certificationSchema } from "@/lib/validations/profile";
import type { FullProfile } from "@/lib/profile/completion";

async function auth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  return getSessionUserId();
}

export async function GET() {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  return NextResponse.json({ success: true, data: profile.certifications });
}

export async function POST(req: Request) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  const parsed = certificationSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;
  const maxOrder = profile.certifications.length ? Math.max(...profile.certifications.map((c) => c.order)) : -1;
  const created = await prisma.certification.create({
    data: {
      profileId: profile.id,
      name: d.name,
      issuingOrg: d.issuingOrg,
      issueMonth: d.issueMonth ?? undefined,
      issueYear: d.issueYear ?? undefined,
      expiryMonth: d.doesNotExpire ? undefined : (d.expiryMonth ?? undefined),
      expiryYear: d.doesNotExpire ? undefined : (d.expiryYear ?? undefined),
      doesNotExpire: d.doesNotExpire,
      credentialId: d.credentialId ?? undefined,
      credentialUrl: d.credentialUrl ?? undefined,
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
