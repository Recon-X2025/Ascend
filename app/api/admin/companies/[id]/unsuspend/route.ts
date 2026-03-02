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
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    select: { id: true, name: true, suspendedAt: true },
  });
  if (!company) {
    return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  }
  if (!company.suspendedAt) {
    return NextResponse.json({ success: false, error: "Company is not suspended" }, { status: 400 });
  }

  await prisma.company.update({
    where: { id },
    data: { suspendedAt: null, suspensionReason: null },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "COMPANY_UNSUSPENDED",
    targetType: "Company",
    targetId: id,
    targetLabel: company.name,
  });

  return NextResponse.json({ id, suspendedAt: null });
}
