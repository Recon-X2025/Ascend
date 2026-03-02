import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";
import { calculateCompletionScore } from "@/lib/profile/completion";
import { addSkillSchema } from "@/lib/validations/profile";
import type { FullProfile } from "@/lib/profile/completion";

async function auth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  return getSessionUserId();
}

export async function GET() {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  return NextResponse.json({ success: true, data: profile.skills });
}

export async function POST(req: Request) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  const parsed = addSkillSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { skillName, proficiency } = parsed.data;
  const normalizedName = skillName.trim().toLowerCase().replace(/\s+/g, " ");
  let skill = await prisma.skill.findFirst({
    where: { OR: [{ normalizedName }, { name: { equals: skillName.trim(), mode: "insensitive" } }] },
  });
  if (!skill) {
    skill = await prisma.skill.create({
      data: { name: skillName.trim(), normalizedName },
    });
  }
  const existing = await prisma.userSkill.findUnique({
    where: { profileId_skillId: { profileId: profile.id, skillId: skill.id } },
  });
  if (existing) {
    return NextResponse.json({ success: false, error: "Skill already added" }, { status: 400 });
  }
  const maxOrder = profile.skills.length ? Math.max(...profile.skills.map((s) => s.order)) : -1;
  const created = await prisma.userSkill.create({
    data: {
      profileId: profile.id,
      skillId: skill.id,
      proficiency,
      order: maxOrder + 1,
    },
    include: { skill: { select: { name: true } } },
  });
  const updated = await prisma.jobSeekerProfile.findUnique({ where: { id: profile.id }, include: profileInclude });
  if (updated) {
    const result = calculateCompletionScore(updated as FullProfile);
    await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { completionScore: result.total } });
  }
  return NextResponse.json({ success: true, data: created });
}
