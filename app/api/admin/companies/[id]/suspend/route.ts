import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id },
    select: { id: true, name: true, suspendedAt: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.company.update({
      where: { id },
      data: { suspendedAt: new Date(), suspensionReason: reason },
    }),
    prisma.jobPost.updateMany({
      where: { companyId: id, status: "ACTIVE" },
      data: { status: "PAUSED" },
    }),
  ]);

  await logAdminAction({
    adminId: session.user.id,
    action: "COMPANY_SUSPENDED",
    targetType: "Company",
    targetId: id,
    targetLabel: company.name,
    metadata: { reason },
  });

  return NextResponse.json({ id, suspendedAt: new Date().toISOString() });
}
