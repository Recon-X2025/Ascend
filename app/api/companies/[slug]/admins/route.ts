import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  if (!(await isCompanyOwnerOrAdmin(userId, company.id)))
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const admins = await prisma.companyAdmin.findMany({
    where: { companyId: company.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    admins: admins.map((a) => ({
      id: a.id,
      userId: a.userId,
      name: a.user?.name ?? null,
      email: a.user?.email ?? null,
      role: a.role,
      createdAt: a.createdAt,
    })),
  });
}
