import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

const MAX_ENDORSER_NAMES = 3;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const endorsements = await prisma.profileEndorsement.findMany({
    where: { recipientId: userId },
    include: {
      endorser: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const bySkill = new Map<
    string,
    { count: number; endorsers: string[] }
  >();

  for (const e of endorsements) {
    const parts = e.endorser.name?.trim()?.split(/\s+/) ?? [];
    const displayName = parts.length > 1
      ? `${parts[0]} ${parts[1]?.charAt(0) ?? ""}.`
      : parts[0] ?? "Someone";
    const existing = bySkill.get(e.skill);
    if (existing) {
      existing.count += 1;
      if (existing.endorsers.length < MAX_ENDORSER_NAMES && !existing.endorsers.includes(displayName)) {
        existing.endorsers.push(displayName);
      }
    } else {
      bySkill.set(e.skill, { count: 1, endorsers: [displayName] });
    }
  }

  const list = Array.from(bySkill.entries()).map(([skill, { count, endorsers }]) => ({
    skill,
    count,
    endorsers: endorsers.slice(0, MAX_ENDORSER_NAMES),
  }));

  return NextResponse.json({ endorsements: list });
}
