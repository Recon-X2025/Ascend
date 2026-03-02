import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import { generateUniqueUsername, slugFromName } from "@/lib/profile/username";
import { profileUpdateSchema } from "@/lib/validations/profile";
import type { FullProfile } from "@/lib/profile/completion";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  let profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId },
    include: profileInclude,
  });
  if (!profile) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const username = await generateUniqueUsername(slugFromName(user?.name ?? undefined));
    profile = await prisma.jobSeekerProfile.create({
      data: { userId, username },
      include: profileInclude,
    });
  }
  const result = calculateCompletionScore(profile as FullProfile);
  return NextResponse.json({
    success: true,
    data: {
      profile,
      completion: result,
    },
  });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const raw = parsed.data;
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v !== undefined) data[k] = v;
  }
  const before = await prisma.jobSeekerProfile.findUnique({
    where: { userId },
    select: { currentRole: true, currentCompany: true },
  });
  const profile = await prisma.jobSeekerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    include: profileInclude,
  });
  const result = calculateCompletionScore(profile as FullProfile);
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { completionScore: result.total },
  });
  const roleChanged =
    (raw.currentRole !== undefined && raw.currentRole !== before?.currentRole) ||
    (raw.currentCompany !== undefined && raw.currentCompany !== before?.currentCompany);
  if (roleChanged) {
    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ requesterId: userId }, { recipientId: userId }],
        status: "ACCEPTED",
      },
      select: { requesterId: true, recipientId: true },
    });
    const audienceUserIds = connections.map((c) =>
      c.requesterId === userId ? c.recipientId : c.requesterId
    );
    if (audienceUserIds.length > 0) {
      const { emitSignal } = await import("@/lib/signals/emit");
      await emitSignal({
        type: "ROLE_MOVE",
        actorId: userId,
        audienceUserIds,
        metadata: {
          fromRole: before?.currentRole ?? undefined,
          toRole: (profile as { currentRole?: string }).currentRole,
          fromCompany: before?.currentCompany ?? undefined,
          toCompany: (profile as { currentCompany?: string }).currentCompany,
        },
      });
    }
  }
  return NextResponse.json({
    success: true,
    data: { profile: { ...profile, completionScore: result.total }, completion: result },
  });
}
