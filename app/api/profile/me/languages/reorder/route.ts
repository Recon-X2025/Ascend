import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { z } from "zod";

async function auth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  return getSessionUserId();
}
const schema = z.object({ items: z.array(z.object({ id: z.string(), order: z.number().int().min(0) })) });

export async function POST(req: Request) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const profile = await getProfileOrThrow(userId);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  await prisma.$transaction(
    parsed.data.items.map(({ id, order }) =>
      prisma.profileLanguage.updateMany({ where: { id, profileId: profile.id }, data: { order } })
    )
  );
  return NextResponse.json({ success: true });
}
