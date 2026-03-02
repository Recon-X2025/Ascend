import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.status !== "REVOKED") {
    return NextResponse.json({ success: false, error: "Only status REVOKED is allowed" }, { status: 400 });
  }

  const badge = await prisma.profileBadge.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!badge) return NextResponse.json({ success: false, error: "Badge not found" }, { status: 404 });

  await prisma.profileBadge.update({
    where: { id },
    data: { status: "REVOKED" },
  });

  try {
    const { sendBadgeRevokedEmail } = await import("@/lib/email/marketplace");
    if (badge.user?.email) await sendBadgeRevokedEmail(badge.user.email, badge.provider, badge.skill);
  } catch {
    // ignore
  }

  return NextResponse.json({ success: true, status: "REVOKED" });
}
