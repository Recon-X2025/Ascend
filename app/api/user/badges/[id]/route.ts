import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const badge = await prisma.profileBadge.findUnique({
    where: { id },
  });
  if (!badge || badge.userId !== userId) return NextResponse.json({ error: "Badge not found" }, { status: 404 });

  await prisma.profileBadge.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
