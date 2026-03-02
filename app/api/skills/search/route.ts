import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

const MAX_RESULTS = 10;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }
  const normalized = q.replace(/\s+/g, " ").trim();
  const skills = await prisma.skill.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { normalizedName: { contains: normalized.replace(/\s/g, ""), mode: "insensitive" } },
      ],
    },
    take: MAX_RESULTS,
    select: { id: true, name: true },
  });
  const exactMatch = skills.some((s) => s.name.toLowerCase() === q);
  return NextResponse.json({
    success: true,
    data: skills,
    canCreate: !exactMatch && q.length >= 2,
    suggestedNewName: exactMatch ? undefined : q,
  });
}
