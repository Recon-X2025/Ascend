import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";

export async function PATCH(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const company = await prisma.company.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  await prisma.company.update({
    where: { id },
    data: { verified: false },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "COMPANY_UNVERIFIED",
    targetType: "Company",
    targetId: id,
    targetLabel: company.name,
  });

  return NextResponse.json({ id, verified: false });
}
