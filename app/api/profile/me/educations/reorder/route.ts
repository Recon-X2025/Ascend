import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { z } from "zod";

async function ensureAuth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  return getSessionUserId();
}

const reorderSchema = z.object({ items: z.array(z.object({ id: z.string(), order: z.number().int().min(0) })) });

export async function POST(req: Request) {
  const userId = await ensureAuth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  const body = await req.json();
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  await prisma.$transaction(
    parsed.data.items.map(({ id, order }) =>
      prisma.education.updateMany({ where: { id, profileId: profile.id }, data: { order } })
    )
  );
  return NextResponse.json({ success: true });
}
