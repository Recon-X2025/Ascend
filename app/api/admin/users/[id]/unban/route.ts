import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, bannedAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!user.bannedAt) {
    return NextResponse.json({ error: "User is not banned" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { bannedAt: null, banReason: null },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "USER_UNBANNED",
    targetType: "User",
    targetId: id,
    targetLabel: user.email,
  });

  const updated = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, bannedAt: true, banReason: true },
  });
  return NextResponse.json(updated);
}
